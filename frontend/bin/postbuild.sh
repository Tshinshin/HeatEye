#!/usr/bin/env bash
set -euo pipefail

# frontend ディレクトリで実行される想定
ROOT_DIR="$(pwd)"
echo "[postbuild] ROOT_DIR=$ROOT_DIR"

# 初期化
rm -rf .amplify-hosting
mkdir -p .amplify-hosting/compute/default
mkdir -p .amplify-hosting/static

# Next.js standalone 出力の存在確認
if [ ! -d ".next/standalone" ]; then
  echo "[postbuild] ERROR: .next/standalone not found. Enable Next.js standalone output."
  exit 1
fi

# --- ここが重要：余計な frontend 階層を吸収する ---
if [ -d ".next/standalone/frontend" ]; then
  echo "[postbuild] Detected .next/standalone/frontend; flattening output"
  cp -R .next/standalone/frontend/* .amplify-hosting/compute/default/
else
  echo "[postbuild] Copying .next/standalone/* to compute/default"
  cp -R .next/standalone/* .amplify-hosting/compute/default/
fi

# Next.js static assets を static にコピー（/_next/static）
if [ -d ".next/static" ]; then
  mkdir -p .amplify-hosting/static/_next
  cp -R .next/static .amplify-hosting/static/_next/static
fi

# public/ を static のルートにコピー
if [ -d "public" ]; then
  cp -R public/* .amplify-hosting/static/ || true
fi

# deploy-manifest.json を配置
if [ ! -f "deploy-manifest.json" ]; then
  echo "[postbuild] ERROR: deploy-manifest.json not found in frontend/"
  exit 1
fi
cp deploy-manifest.json .amplify-hosting/deploy-manifest.json

# entrypoint チェック
if [ ! -f ".amplify-hosting/compute/default/server.js" ]; then
  echo "[postbuild] WARNING: server.js not found under compute/default."
fi

# デバッグ出力
echo "[postbuild] Listing compute/default (top-level):"
ls -la .amplify-hosting/compute/default || true

echo "[postbuild] Searching entry candidates:"
find .amplify-hosting/compute/default -maxdepth 2 -type f \
  \( -name "server.js" -o -name "index.js" -o -name "app.js" -o -name "main.js" \) \
  -print || true

echo "[postbuild] Done. Listing .amplify-hosting:"
find .amplify-hosting -maxdepth 3 -type f | sed 's|^\./||'

echo "[postbuild] Listing .amplify-hosting (top-level):"
ls -la .amplify-hosting || true
