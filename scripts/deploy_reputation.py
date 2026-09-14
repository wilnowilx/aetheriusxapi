#!/usr/bin/env python3
"""
Deploy ReputationAnchor contract to Base Mainnet.
Outputs contract address to .env.reputation and grants ORACLE_ROLE to PAY_TO wallet.
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account
from dotenv import load_dotenv

# Load environment
load_dotenv()
load_dotenv(".env.reputation")

BASE_RPC_URL = os.getenv("BASE_RPC_URL")
DEPLOYER_PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY")
PAY_TO = "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"

if not BASE_RPC_URL:
    print("ERROR: BASE_RPC_URL not set in environment")
    sys.exit(1)

if not DEPLOYER_PRIVATE_KEY:
    print("ERROR: DEPLOYER_PRIVATE_KEY not set in environment")
    sys.exit(1)

w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

if not w3.is_connected():
    print("ERROR: Failed to connect to Base RPC")
    sys.exit(1)

deployer = Account.from_key(DEPLOYER_PRIVATE_KEY)
print(f"Deployer: {deployer.address}")
print(f"PAY_TO (Oracle): {PAY_TO}")

# Compile with forge
contract_path = Path(__file__).parent.parent / "contracts" / "ReputationAnchor.sol"
if not contract_path.exists():
    print(f"ERROR: Contract not found at {contract_path}")
    sys.exit(1)

print("\n=== Compiling with Forge ===")
result = subprocess.run(
    ["forge", "build", "--contracts", str(contract_path.parent)],
    capture_output=True,
    text=True,
    cwd=Path(__file__).parent.parent
)
if result.returncode != 0:
    print("Forge build failed:")
    print(result.stderr)
    sys.exit(1)
print("Compilation successful")

# Get contract artifact
artifact_path = Path(__file__).parent.parent / "out" / "ReputationAnchor.sol" / "ReputationAnchor.json"
if not artifact_path.exists():
    print(f"ERROR: Artifact not found at {artifact_path}")
    sys.exit(1)

with open(artifact_path) as f:
    artifact = json.load(f)

abi = artifact["abi"]
bytecode = artifact["bytecode"]["object"]

# Estimate gas
print("\n=== Gas Estimation ===")
contract = w3.eth.contract(abi=abi, bytecode=bytecode)
constructor_tx = contract.constructor().build_transaction({
    "from": deployer.address,
    "nonce": w3.eth.get_transaction_count(deployer.address),
})

gas_estimate = w3.eth.estimate_gas(constructor_tx)
gas_price = w3.eth.gas_price
estimated_cost_wei = gas_estimate * gas_price
estimated_cost_eth = w3.from_wei(estimated_cost_wei, "ether")

print(f"Gas estimate: {gas_estimate:,}")
print(f"Gas price: {w3.from_wei(gas_price, 'gwei'):.2f} gwei")
print(f"Estimated cost: {estimated_cost_eth:.6f} ETH")

# Deploy
print("\n=== Deploying Contract ===")
nonce = w3.eth.get_transaction_count(deployer.address)
tx = contract.constructor().build_transaction({
    "from": deployer.address,
    "nonce": nonce,
    "gas": gas_estimate + 50000,
    "gasPrice": gas_price,
    "chainId": 8453,
})

signed_tx = w3.eth.account.sign_transaction(tx, DEPLOYER_PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print(f"Tx hash: {tx_hash.hex()}")

print("Waiting for receipt...")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
contract_address = receipt.contractAddress
print(f"Contract deployed at: {contract_address}")
print(f"Gas used: {receipt.gasUsed:,}")
print(f"Actual cost: {w3.from_wei(receipt.gasUsed * gas_price, 'ether'):.6f} ETH")

# Grant ORACLE_ROLE to PAY_TO
print("\n=== Granting ORACLE_ROLE to PAY_TO ===")
contract_instance = w3.eth.contract(address=contract_address, abi=abi)

ORACLE_ROLE = w3.keccak(text="ORACLE_ROLE")
nonce = w3.eth.get_transaction_count(deployer.address)
grant_tx = contract_instance.functions.grantOracleRole(PAY_TO).build_transaction({
    "from": deployer.address,
    "nonce": nonce,
    "gas": 100000,
    "gasPrice": gas_price,
    "chainId": 8453,
})

signed_grant = w3.eth.account.sign_transaction(grant_tx, DEPLOYER_PRIVATE_KEY)
grant_hash = w3.eth.send_raw_transaction(signed_grant.raw_transaction)
print(f"Grant tx hash: {grant_hash.hex()}")
grant_receipt = w3.eth.wait_for_transaction_receipt(grant_hash)
print(f"ORACLE_ROLE granted. Gas used: {grant_receipt.gasUsed:,}")

# Verify on Basescan (optional)
print("\n=== Verifying on Basescan ===")
verify_result = subprocess.run(
    [
        "forge", "verify-contract",
        "--chain-id", "8453",
        "--etherscan-api-key", os.getenv("BASESCAN_API_KEY", ""),
        contract_address,
        "contracts/ReputationAnchor.sol:ReputationAnchor"
    ],
    capture_output=True,
    text=True,
    cwd=Path(__file__).parent.parent
)
if verify_result.returncode == 0:
    print("Verification successful!")
    print(verify_result.stdout)
else:
    print("Verification skipped or failed (BASESCAN_API_KEY may not be set)")
    print(verify_result.stderr)

# Write .env.reputation
env_path = Path(__file__).parent.parent / ".env.reputation"
env_content = f"""# ReputationAnchor Deployment
AETHERIUS_REPUTATION_CONTRACT={contract_address}
AETHERIUS_REPUTATION_DEPLOYER={deployer.address}
AETHERIUS_REPUTATION_CHAIN=8453
AETHERIUS_REPUTATION_ORACLE={PAY_TO}
AETHERIUS_REPUTATION_DEPLOYED_AT={receipt.blockNumber}
"""
with open(env_path, "w") as f:
    f.write(env_content)

print(f"\n=== Deployment Complete ===")
print(f"Contract: {contract_address}")
print(f"Env file: {env_path}")
print(f"Oracle (PAY_TO): {PAY_TO} has ORACLE_ROLE")
print("\nAdd to your .env:")
print(f"AETHERIUS_REPUTATION_CONTRACT={contract_address}")