#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
echo "[postbuild] ROOT_DIR=$ROOT_DIR"

rm -rf .amplify-hosting
mkdir -p .amplify-hosting/compute/default
mkdir -p .amplify-hosting/static

if [ ! -d ".next/standalone" ]; then
  echo "[postbuild] ERROR: .next/standalone not found. Enable Next.js standalone output."
  exit 1
fi

# --- 重要：dotディレクトリ（.next 等）も含めてコピーするために "/." を使う ---
if [ -d ".next/standalone/frontend" ]; then
  echo "[postbuild] Detected .next/standalone/frontend; flattening output (including dotfiles)"
  cp -R ".next/standalone/frontend/." ".amplify-hosting/compute/default/"
else
  echo "[postbuild] Copying .next/standalone (including dotfiles)"
  cp -R ".next/standalone/." ".amplify-hosting/compute/default/"
fi

# Next.js static assets -> static/_next/static
if [ -d ".next/static" ]; then
  mkdir -p .amplify-hosting/static/_next
  cp -R ".next/static" ".amplify-hosting/static/_next/static"
fi

# public -> static root
if [ -d "public" ]; then
  cp -R public/* .amplify-hosting/static/ || true
fi

# deploy-manifest.json
if [ ! -f "deploy-manifest.json" ]; then
  echo "[postbuild] ERROR: deploy-manifest.json not found in frontend/"
  exit 1
fi
cp deploy-manifest.json .amplify-hosting/deploy-manifest.json

# デバッグ（しばらく残してOK）
echo "[postbuild] Listing compute/default (top-level):"
ls -la .amplify-hosting/compute/default || true

echo "[postbuild] Searching entry candidates:"
find .amplify-hosting/compute/default -maxdepth 2 -type f \
  \( -name "server.js" -o -name "index.js" -o -name "app.js" -o -name "main.js" \) \
  -print || true

echo "[postbuild] Checking .next existence in compute bundle:"
ls -la .amplify-hosting/compute/default/.next || true

echo "[postbuild] Done. Listing .amplify-hosting:"
find .amplify-hosting -maxdepth 3 -type f | sed 's|^\./||'
