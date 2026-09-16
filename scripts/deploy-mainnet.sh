#!/bin/bash
# ============================================
# aetheriusxAPI — MAINNET DEPLOY SCRIPT
# Run: bash scripts/DEPLOY-MAINNET.sh
# ============================================

set -e

echo "🚀 aetheriusxAPI — MAINNET DEPLOY"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# VM Configuration
VM_HOST="34.156.149.38"
VM_USER="astronautshooter_gmail_com"
VM_DIR="/opt/aetherapi"
SERVICE_NAME="aetherapi"

# Mainnet Configuration
X402_MODE="real"
NETWORK="eip155:8453"
WALLET="0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
ETHERSCAN_KEY="24RDI25PE7AGVZ12XGGU959T3JA7IE29ME"

echo -e "${BLUE}📋 Deployment Plan:${NC}"
echo "   1. Install x402 SDK"
echo "   2. Update systemd service"
echo "   3. Restart API"
echo "   4. Verify mainnet mode"
echo ""

echo -e "${YELLOW}Step 1: Installing x402 SDK...${NC}"
ssh $VM_USER@$VM_HOST "cd $VM_DIR && pip3 install x402" 2>&1 || {
    echo -e "${RED}⚠️  x402 install failed. Trying with --user flag...${NC}"
    ssh $VM_USER@$VM_HOST "cd $VM_DIR && pip3 install --user x402"
}

echo -e "${YELLOW}Step 2: Updating systemd service...${NC}"
ssh $VM_USER@$VM_HOST "sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << 'ENDOFSCRIPT'
[Unit]
Description=aetheriusxAPI - Crypto-native API marketplace (MAINNET)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$VM_DIR
Environment=X402_MODE=$X402_MODE
Environment=AETHERIUS_NETWORK=$NETWORK
Environment=AETHERIUS_WALLET=$WALLET
Environment=ETHERSCAN_API_KEY=$ETHERSCAN_KEY
Environment=PORT=4020
Environment=PYTHONUNBUFFERED=1
Environment=CORS_ORIGINS=https://wilnowilx.github.io,http://127.0.0.1:4020,http://localhost:4020
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 4020
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
ENDOFSCRIPT"

echo -e "${YELLOW}Step 3: Restarting API service...${NC}"
ssh $VM_USER@$VM_HOST "sudo systemctl daemon-reload && sudo systemctl restart $SERVICE_NAME"

echo -e "${YELLOW}Step 4: Waiting for service to initialize...${NC}"
sleep 8

echo -e "${YELLOW}Step 5: Verifying mainnet deployment...${NC}"
HEALTH=$(curl -s "http://$VM_HOST/aetherapi/health" 2>&1)

if echo "$HEALTH" | grep -q '"mode": "real"'; then
    echo -e "${GREEN}✅ MAINNET DEPLOY SUCCESSFUL!${NC}"
    echo ""
    echo -e "${GREEN}📊 Status:${NC}"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}⚠️  API may not be in real mode. Checking service logs...${NC}"
    echo ""
    echo -e "${YELLOW}Last 10 lines of service log:${NC}"
    ssh $VM_USER@$VM_HOST "sudo journalctl -u $SERVICE_NAME -n 10 --no-pager"
fi

echo ""
echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}🎉 DEPLOY COMPLETE!${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""
echo -e "${BLUE}📊 Live Endpoints:${NC}"
echo "   Health:    http://$VM_HOST/aetherapi/health"
echo "   Telemetry: http://$VM_HOST/aetherapi/v1/telemetry"
echo "   Dashboard: https://wilnowilx.github.io/aetheriusxapi/dashboard/"
echo "   Docs:      http://$VM_HOST/aetherapi/docs"
echo ""
echo -e "${BLUE}💰 Wallet:${NC}"
echo "   $WALLET"
echo "   Network: Base Mainnet ($NETWORK)"
echo ""
echo -e "${BLUE}📝 Quick Test:${NC}"
echo "   curl http://$VM_HOST/aetherapi/health"
echo "   curl -H 'X-PAYMENT: test' http://$VM_HOST/aetherapi/v1/data/uuid"
echo ""
