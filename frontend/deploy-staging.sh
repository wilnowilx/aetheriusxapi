#!/bin/bash
# ============================================
# STAGING DEPLOY — AetheriusXapi
# ============================================
# FIX: Antes usábamos `cp -r dist\assets assets` que ANIDABA
# los archivos en assets/assets/ (pantalla negra).
# Ahora: copiamos CONTENTS de dist/ al root del staging repo.
# ============================================

set -e

STAGING_DIR="/c/Users/wil/AppData/Local/Temp/staging-deploy"
DIST_DIR="$(pwd)/dist"

echo "🔨 Building..."
PAGES_BASE=/aetheriusxapi-staging/ npm run build 2>&1 | tail -5

echo ""
echo "📦 Deploying to staging..."

# 1. Limpiar archivos viejos del staging (excepto .git)
find "$STAGING_DIR" -maxdepth 1 -not -name '.git' -not -name '.' -not -name '..' -exec rm -rf {} +

# 2. Copiar contents de dist/ al root del staging (NO nested)
cp "$DIST_DIR/index.html" "$STAGING_DIR/index.html"
cp "$DIST_DIR/favicon.svg" "$STAGING_DIR/favicon.svg" 2>/dev/null || true
cp -r "$DIST_DIR/assets" "$STAGING_DIR/assets"

# 3. Fix Windows Git Bash path injection
sed -i 's|/Program Files/Git/aetheriusxapi-staging|/aetheriusxapi-staging|g' "$STAGING_DIR/index.html"

# 4. Verificar que todos los archivos referenciados existen
echo ""
echo "🔍 Verifying assets..."
MISSING=0
for f in $(grep -o 'assets/[^"]*' "$STAGING_DIR/index.html"); do
  if [ -f "$STAGING_DIR/$f" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ MISSING: $f"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo ""
  echo "❌ ABORT: Missing assets! Fix before pushing."
  exit 1
fi

# 5. Push
cd "$STAGING_DIR"
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M') — $(git diff --cached --stat | tail -1)"
git push origin main

echo ""
echo "✅ Deployed! CDN propagation: ~2-5 min"
echo "🔗 https://wilnowilx.github.io/aetheriusxapi-staging/"
