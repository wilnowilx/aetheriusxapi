#!/bin/bash
# deploy-staging.sh — Safe staging deploy for Git Bash on Windows
# Disables MSYS path conversion to prevent /Program Files/Git/ injection

set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

STAGING_REPO="C:/Users/wil/AppData/Local/Temp/staging-deploy"
DIST_DIR="$(dirname "$0")/dist"

echo "[1/5] Building..."
PAGES_BASE=/aetheriusxapi-staging/ npm run build

echo "[2/5] Cleaning old assets..."
rm -rf "$STAGING_REPO/assets"

echo "[3/5] Copying dist..."
cp -r "$DIST_DIR/assets" "$STAGING_REPO/assets"
cp "$DIST_DIR/index.html" "$STAGING_REPO/index.html"

echo "[4/5] Fixing Git Bash path corruption..."
cd "$STAGING_REPO"
# Remove any /Program Files/Git/ prefix that Git Bash injected
sed -i 's|/Program Files/Git/aetheriusxapi-staging/|/aetheriusxapi-staging/|g' index.html
# Fix favicon
sed -i 's|href="/aetheriusxapi/favicon.svg"|href="/aetheriusxapi-staging/favicon.svg"|g' index.html

echo "[5/5] Commit and push..."
git add -A
git commit -m "deploy: staging update $(date +%Y-%m-%d_%H-%M)"
git push

echo "✅ Deployed to staging!"
