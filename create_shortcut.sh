#!/bin/sh
set -e
WORKING_DIR=`pwd`
THIS_PATH=`readlink -f $0`
cd `dirname ${THIS_PATH}`
FULL_PATH=`pwd`/Lotion
cd ${WORKING_DIR}
cat <<EOS > Lotion.desktop
[Desktop Entry]
Name=Notion
Name[en_US]=Lotion
Comment=Unofficial Notion.so application for Linux
Exec="${FULL_PATH}/Lotion"
Terminal=false
Categories=Office;TextEditor;Utility
Type=Application
Icon=${WORKING_DIR}/icon.png
StartupWMClass=Lotion
EOS
chmod +x Lotion.desktop
## This can be updated if this path is not valid. 
cp -p Lotion.desktop ~/.local/share/applications
