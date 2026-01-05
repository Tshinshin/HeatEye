#!/usr/bin/env bash
set -euo pipefail

# frontend ディレクトリで実行される想定
ROOT_DIR="$(pwd)"

echo "[postbuild] ROOT_DIR=$ROOT_DIR"

rm -rf .amplify-hosting
mkdir -p .amplify-hosting/compute/default
mkdir -p .amplify-hosting/static

# Next.js の standalone 出力を compute にコピー
if [ ! -d ".next/standalone" ]; then
  echo "[postbuild] ERROR: .next/standalone not found. Enable Next.js standalone output."
  exit 1
fi

cp -R .next/standalone/* .amplify-hosting/compute/default/

# Next.js static assets を static にコピー（/_next/static になるように配置）
if [ -d ".next/static" ]; then
  mkdir -p .amplify-hosting/static/_next
  cp -R .next/static .amplify-hosting/static/_next/static
fi

# public/ を static のルートにコピー（favicon.ico 等）
if [ -d "public" ]; then
  cp -R public/* .amplify-hosting/static/ || true
fi

# deploy-manifest.json を配置
if [ ! -f "deploy-manifest.json" ]; then
  echo "[postbuild] ERROR: deploy-manifest.json not found in frontend/"
  exit 1
fi
cp deploy-manifest.json .amplify-hosting/deploy-manifest.json

# entrypoint の存在チェック（Next standalone は通常 server.js を含む）
if [ ! -f ".amplify-hosting/compute/default/server.js" ]; then
  echo "[postbuild] WARNING: server.js not found under compute/default."
  echo "[postbuild] Listing compute/default:"
  ls -la .amplify-hosting/compute/default || true
fi

echo "[postbuild] Done. Listing .amplify-hosting:"
find .amplify-hosting -maxdepth 3 -type f | sed 's|^\./||'
