// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAaveV3Pool {
    function flashLoan(
        address receiver,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;

    function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

error NOT_OWNER();
error UNAUTHORIZED();

contract ArbitrageReceiver {
    address public owner;
    IAaveV3Pool public immutable pool;

    constructor(address _pool) {
        owner = msg.sender;
        pool = IAaveV3Pool(_pool);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, NOT_OWNER());
        _;
    }

    function executeArbitrage(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params
    ) external returns (uint256 profit) {
        require(msg.sender == address(pool), UNAUTHORIZED());

        for (uint256 i = 0; i < assets.length; i++) {
            IERC20(assets[i]).approve(address(pool), amounts[i]);
        }

        pool.flashLoan(
            address(this),
            assets,
            amounts,
            interestRateModes,
            onBehalfOf,
            params,
            0
        );

        for (uint256 i = 0; i < assets.length; i++) {
            uint256 balance = IERC20(assets[i]).balanceOf(address(this));
            if (balance > amounts[i]) {
                profit += balance - amounts[i];
            }
        }
    }

    function withdrawERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    function withdrawEth() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}