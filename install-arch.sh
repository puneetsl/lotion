#!/bin/bash
# Lotion Installation Script for Arch Linux
# This script downloads the PKGBUILD, verifies it, and installs Lotion
#
# WARNING: This script downloads and executes content from GitHub.
# Only run this script if you trust the source (https://github.com/puneetsl/lotion)
# For maximum security, download and review the PKGBUILD manually before building.

set -e

TEMP_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)
PKGBUILD_URL="https://raw.githubusercontent.com/puneetsl/lotion/master/PKGBUILD"

echo "==> Installing Lotion for Arch Linux"
echo "==> Creating temporary directory: $TEMP_DIR"

cd "$TEMP_DIR"

echo "==> Downloading PKGBUILD..."
curl -fsSL "$PKGBUILD_URL" -o PKGBUILD

echo ""
echo "==> PKGBUILD downloaded. Contents:"
echo "----------------------------------------"
cat PKGBUILD
echo "----------------------------------------"
echo ""

read -p "==> Does the PKGBUILD look correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation aborted."
    cd "$ORIGINAL_DIR"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "==> Building package..."
echo "==> Note: You will be prompted for sudo password to install the package"
makepkg -si

echo ""
echo "==> Installation complete!"
echo "==> Run 'lotion' to start the application"

# Cleanup
cd "$ORIGINAL_DIR"
rm -rf "$TEMP_DIR"
