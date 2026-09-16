#!/bin/bash
# ============================================
# aetheriusxAPI — COMPLETE SETUP & DEPLOY
# Run: bash scripts/SETUP-AND-DEPLOY.sh
# ============================================

set -e

echo "🚀 aetheriusxAPI — COMPLETE SETUP & MAINNET DEPLOY"
echo "===================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VM_HOST="34.156.149.38"
VM_USER="astronautshooter_gmail_com"
VM_DIR="/opt/aetherapi"
SERVICE_NAME="aetherapi"
WALLET="0x677B483128D0399bCD0A5AB36eE990C0246d7f61"

echo -e "${BLUE}📋 Step 0: Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $VM_USER@$VM_HOST "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful!${NC}"
else
    echo -e "${RED}❌ SSH connection failed.${NC}"
    echo ""
    echo -e "${YELLOW}📋 Manual steps required:${NC}"
    echo "   1. Generate SSH key (if needed): ssh-keygen -t ed25519"
    echo "   2. Add public key to Google Cloud VM"
    echo "   3. Or use Google Cloud Console SSH-in-browser"
    echo ""
    echo -e "${BLUE}Alternative: Use Google Cloud Console:${NC}"
    echo "   https://console.cloud.google.com/compute/instances"
    echo "   Click on sentinel-v4 > SSH"
    echo ""
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Step 1: Installing x402 SDK...${NC}"
ssh $VM_USER@$VM_HOST "cd $VM_DIR && pip3 install x402 2>&1 | tail -5"

echo ""
echo -e "${BLUE}📋 Step 2: Creating mainnet service config...${NC}"
ssh $VM_USER@$VM_HOST "sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << 'ENDOFSERVICE'
[Unit]
Description=aetheriusxAPI - Crypto-native API marketplace (MAINNET)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$VM_DIR
Environment=X402_MODE=real
Environment=AETHERIUS_NETWORK=eip155:8453
Environment=AETHERIUS_WALLET=$WALLET
Environment=ETHERSCAN_API_KEY=24RDI25PE7AGVZ12XGGU959T3JA7IE29ME
Environment=PORT=4020
Environment=PYTHONUNBUFFERED=1
Environment=CORS_ORIGINS=https://wilnowilx.github.io,http://127.0.0.1:4020,http://localhost:4020
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 4020
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
ENDOFSERVICE"

echo ""
echo -e "${BLUE}📋 Step 3: Restarting service...${NC}"
ssh $VM_USER@$VM_HOST "sudo systemctl daemon-reload && sudo systemctl restart $SERVICE_NAME"
sleep 8

echo ""
echo -e "${BLUE}📋 Step 4: Verifying deployment...${NC}"
HEALTH=$(curl -s "http://$VM_HOST/aetherapi/health" 2>&1)

if echo "$HEALTH" | grep -q '"mode": "real"'; then
    echo -e "${GREEN}✅ MAINNET DEPLOY SUCCESSFUL!${NC}"
    echo ""
    echo -e "${GREEN}📊 API Status:${NC}"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null | head -20 || echo "$HEALTH"
else
    echo -e "${YELLOW}⚠️  Checking service status...${NC}"
    ssh $VM_USER@$VM_HOST "sudo systemctl status $SERVICE_NAME --no-pager | head -15"
fi

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}🎉 DEPLOY COMPLETE!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${BLUE}🔗 Live Endpoints:${NC}"
echo "   Health:    http://$VM_HOST/aetherapi/health"
echo "   Telemetry: http://$VM_HOST/aetherapi/v1/telemetry"
echo "   Dashboard: https://wilnowilx.github.io/aetheriusxapi/dashboard/"
echo "   API Docs:  http://$VM_HOST/aetherapi/docs"
echo ""
echo -e "${BLUE}💰 Your Wallet:${NC}"
echo "   $WALLET"
echo ""
