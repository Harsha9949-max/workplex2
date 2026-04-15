#!/usr/bin/env bash
# ============================================================
# WorkPlex Deep Clean Script (Unix/Mac/Linux)
# Deletes node_modules, .vite cache, and dist folders
# Then performs a fresh npm install
# ============================================================

set -e

echo ""
echo "========================================"
echo "  WorkPlex Deep Clean"
echo "========================================"
echo ""

echo "[1/4] Removing node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "      Done."
else
    echo "      Skipped (not found)."
fi

echo "[2/4] Removing .vite cache..."
if [ -d ".vite" ]; then
    rm -rf .vite
    echo "      Done."
else
    echo "      Skipped (not found)."
fi

echo "[3/4] Removing dist folder..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "      Done."
else
    echo "      Skipped (not found)."
fi

echo "[4/4] Running fresh npm install..."
echo ""
npm install

echo ""
echo "========================================"
echo "  Deep Clean Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Start the dev server:  npm run dev"
echo "  2. Open browser to:       http://localhost:2532"
echo "  3. If issues persist, check:"
echo "     - Node.js version (run: node --version)"
echo "     - Network/proxy settings"
echo "     - DevTools Console for errors"
echo ""
