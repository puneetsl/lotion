#!/bin/bash
PD=$(pwd)
INSTALL_DIR=$PD"/Lotion"
echo "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
tar xvf "$PD"/Lotion-linux-x64.tar.xz -C "$INSTALL_DIR" --strip 1
mkdir nativeApp
wget -P "$PD"/nativeApp https://desktop-release.notion-static.com/Notion%20Setup%202.0.9.exe
cd nativeApp || exit 1
7z x "Notion Setup 2.0.9.exe"
7z x \$PLUGINSDIR/app-64.7z
cp resources/app.asar "$PD"/Lotion/resources/
mv "$PD"/Lotion/resources/app/ "$PD"/Lotion/resources/app.bak/
cd "$PD" || exit 1
/bin/bash "$PD"/create_shortcut.sh Notion

