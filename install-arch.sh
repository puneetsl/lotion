#!/bin/bash
# Lotion Installation Script for Arch Linux
# This script downloads the PKGBUILD, verifies it, and installs Lotion

set -e

REPO_URL="https://github.com/puneetsl/lotion"
TEMP_DIR=$(mktemp -d)
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
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "==> Building and installing Lotion..."
makepkg -si

echo ""
echo "==> Installation complete!"
echo "==> Run 'lotion' to start the application"

# Cleanup
cd ~
rm -rf "$TEMP_DIR"
