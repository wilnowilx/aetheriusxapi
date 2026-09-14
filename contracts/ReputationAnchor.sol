// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ReputationAnchor is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    mapping(address => uint16) public reputationScore;
    mapping(address => uint64) public lastUpdate;
    mapping(address => bytes32) public behaviorHash;

    event Anchored(address indexed agent, uint16 score, bytes32 behaviorRoot, uint64 timestamp);
    event BatchAnchored(address[] agents, uint16[] scores, bytes32[] behaviors, uint64 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function anchor(
        address agent,
        uint16 score,
        bytes32 behaviorRoot
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
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

    function getReputation(address agent) external view returns (uint16 score, uint64 updated, bytes32 behavior) {
        return (reputationScore[agent], lastUpdate[agent], behaviorHash[agent]);
    }

    function grantOracleRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORACLE_ROLE, account);
    }

    function revokeOracleRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ORACLE_ROLE, account);
    }
}