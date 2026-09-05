#!/bin/bash
# ============================================
# SSH Key Fix — Run this first if SSH fails
# ============================================

echo "🔧 Fixing SSH access to VM..."

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "📝 No SSH key found. Generating new one..."
    ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
    echo ""
    echo "🔑 Your new SSH public key:"
    echo "============================"
    cat ~/.ssh/id_ed25519.pub
    echo "============================"
    echo ""
    echo "📋 Copy this key and add it to the VM:"
    echo "   1. Go to Google Cloud Console"
    echo "   2. Navigate to Compute Engine > VM instances"
    echo "   3. Click on sentinel-v4 > Edit"
    echo "   4. Add the SSH key above"
    echo "   5. Save and try connecting again"
else
    echo "✅ SSH key exists. Testing connection..."
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no astronautshooter_gmail_com@34.156.149.38 "echo 'SSH connection successful!'" 2>&1
fi
