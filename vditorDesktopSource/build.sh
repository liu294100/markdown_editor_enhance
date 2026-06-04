#!/bin/bash
echo "============================================"
echo "  Vditor Desktop - Build Script"
echo "============================================"
echo ""

# Detect platform
PLATFORM=$(uname -s)
case "$PLATFORM" in
    Linux*)  TARGET="linux";;
    Darwin*) TARGET="mac";;
    *)       TARGET="linux";;
esac

echo "Detected platform: $PLATFORM (target: $TARGET)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: npm install failed!"
        exit 1
    fi
else
    echo "[1/3] Dependencies already installed, skipping..."
fi

echo ""
echo "[2/3] Building $TARGET executable..."
echo ""

if [ "$TARGET" = "mac" ]; then
    npx electron-builder --mac dir
elif [ "$TARGET" = "linux" ]; then
    npx electron-builder --linux dir
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Build failed!"
    echo ""
    echo "If you see network errors, try setting a proxy:"
    echo "  export HTTPS_PROXY=http://your-proxy:port"
    echo ""
    exit 1
fi

echo ""
echo "[3/3] Build complete!"
echo ""
echo "============================================"

if [ "$TARGET" = "mac" ]; then
    echo "  Output: dist/mac/"
    echo "  App: dist/mac/Vditor Desktop.app"
    echo ""
    echo "  To create DMG installer:"
    echo "    npx electron-builder --mac dmg"
elif [ "$TARGET" = "linux" ]; then
    echo "  Output: dist/linux-unpacked/"
    echo "  Executable: dist/linux-unpacked/vditor-desktop"
    echo ""
    echo "  To create AppImage:"
    echo "    npx electron-builder --linux AppImage"
    echo ""
    echo "  To create deb package:"
    echo "    npx electron-builder --linux deb"
fi

echo "============================================"
