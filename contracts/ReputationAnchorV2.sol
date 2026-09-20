// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title ReputationAnchorV2 — reputation registry + dynamic escrow collateral.
/// @notice Rule: for any routed value V, the attester's free collateral must satisfy
///         stake - locked >= V * factor / 10000  (STAKE > VALUE, always).
///         Micro-streams settle atomically (loss < stake by construction);
///         macro-routes require proportional collateral or the gate refuses.
contract ReputationAnchorV2 is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    IERC20 public immutable COLLATERAL;
    uint256 public collateralFactorBps = 12000; // 120% default buffer

    mapping(address => uint16) public reputationScore;
    mapping(address => uint64) public lastUpdate;
    mapping(address => bytes32) public behaviorHash;

    mapping(address => uint256) public stake;
    mapping(address => uint256) public locked;

    event Anchored(address indexed agent, uint16 score, bytes32 behaviorRoot, uint64 timestamp);
    event BatchAnchored(address[] agents, uint16[] scores, bytes32[] behaviors, uint64 timestamp);
    event Staked(address indexed agent, uint256 amount, uint256 total);
    event Unstaked(address indexed agent, uint256 amount, uint256 total);
    event EscrowOpened(address indexed agent, uint256 value, uint256 lockedAfter);
    event EscrowReleased(address indexed agent, uint256 value, uint256 lockedAfter);
    event Slashed(address indexed agent, uint256 amount, bytes32 indexed evidence, uint256 remaining);

    error InsufficientCollateral(uint256 free, uint256 required);
    error NothingLocked();

    constructor(address _collateral) {
        COLLATERAL = IERC20(_collateral);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /* ---- reputation (unchanged semantics, V1-compatible) ---- */

    function anchor(address agent, uint16 score, bytes32 behaviorRoot)
        external onlyRole(ORACLE_ROLE) nonReentrant {
        require(score <= 10000, "Score exceeds max 10000");
        reputationScore[agent] = score;
        lastUpdate[agent] = uint64(block.timestamp);
        behaviorHash[agent] = behaviorRoot;
        emit Anchored(agent, score, behaviorRoot, uint64(block.timestamp));
    }

    function batchAnchor(
        address[] calldata agents,
        uint16[] calldata scores,
        bytes32[] calldata behaviors
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        require(agents.length == scores.length && agents.length == behaviors.length, "Array length mismatch");
        uint256 len = agents.length;
        for (uint256 i = 0; i < len; i++) {
            require(scores[i] <= 10000, "Score exceeds max 10000");
            reputationScore[agents[i]] = scores[i];
            lastUpdate[agents[i]] = uint64(block.timestamp);
            behaviorHash[agents[i]] = behaviors[i];
        }
        emit BatchAnchored(agents, scores, behaviors, uint64(block.timestamp));
    }

    function getReputation(address agent)
        external view returns (uint16 score, uint64 updated, bytes32 behavior) {
        return (reputationScore[agent], lastUpdate[agent], behaviorHash[agent]);
    }

    /* ---- dynamic escrow collateral ---- */

    function setCollateralFactorBps(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps >= 10000, "Factor below 100%");
        collateralFactorBps = bps;
    }

    function requiredCollateral(uint256 routedValue) public view returns (uint256) {
        return (routedValue * collateralFactorBps) / 10000;
    }

    function freeCollateral(address agent) public view returns (uint256) {
        uint256 s = stake[agent];
        uint256 l = locked[agent];
        return s > l ? s - l : 0;
    }

    /// @notice View gate other contracts query before routing value through an agent.
    function authorizes(address agent, uint256 routedValue) external view returns (bool) {
        return freeCollateral(agent) >= requiredCollateral(routedValue);
    }

    function depositStake(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero stake");
        require(COLLATERAL.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stake[msg.sender] += amount;
        emit Staked(msg.sender, amount, stake[msg.sender]);
    }

    function withdrawStake(uint256 amount) external nonReentrant {
        require(amount > 0 && amount <= freeCollateral(msg.sender), "Exceeds free collateral");
        stake[msg.sender] -= amount;
        require(COLLATERAL.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount, stake[msg.sender]);
    }

    function openEscrow(address agent, uint256 routedValue) external onlyRole(ORACLE_ROLE) nonReentrant {
        uint256 req = requiredCollateral(routedValue);
        uint256 free = freeCollateral(agent);
        if (free < req) revert InsufficientCollateral(free, req);
        locked[agent] += req;
        emit EscrowOpened(agent, routedValue, locked[agent]);
    }

    function releaseEscrow(address agent, uint256 routedValue) external onlyRole(ORACLE_ROLE) nonReentrant {
        uint256 req = requiredCollateral(routedValue);
        if (locked[agent] < req) revert NothingLocked();
        locked[agent] -= req;
        emit EscrowReleased(agent, routedValue, locked[agent]);
    }

    function slash(address agent, uint256 amount, bytes32 evidence)
        external onlyRole(ORACLE_ROLE) nonReentrant {
        uint256 s = stake[agent];
        uint256 take = amount > s ? s : amount;
        if (take == 0) revert NothingLocked();
        stake[agent] = s - take;
        if (locked[agent] > stake[agent]) locked[agent] = stake[agent];
        emit Slashed(agent, take, evidence, stake[agent]);
    }

    function grantOracleRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORACLE_ROLE, account);
    }

    function revokeOracleRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ORACLE_ROLE, account);
    }
}
