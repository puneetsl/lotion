#!/bin/bash
PD=$(pwd)
INSTALL_DIR=$PD"/Lotion"
APP_DIR=$PD"/nativeApp"
echo "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
tar xvf "$PD"/Lotion-linux-x64.tar.xz -C "$INSTALL_DIR" --strip 1
mkdir nativeApp
wget -P "$PD"/nativeApp https://desktop-release.notion-static.com/Notion%20Setup%202.0.9.exe
cd nativeApp || exit 2
7z x "Notion Setup 2.0.9.exe"
7z x \$PLUGINSDIR/app-64.7z
cp resources/app.asar "$PD"/Lotion/
mv "$PD"/Lotion/app/ "$PD"/Lotion/app.bak/
/bin/bash "$PD"/create_shortcut.sh

