#!/bin/sh
set -e
WORKING_DIR=`pwd`
THIS_PATH=`readlink -f $0`
cd `dirname ${THIS_PATH}`
FULL_PATH=`pwd`/Lotion
cd ${WORKING_DIR}
cat <<EOS > LotionDev.desktop
[Desktop Entry]
Name=Notion
Name[en_US]=LotionDev
Comment=Unofficial Notion.so application for Linux
Exec="${FULL_PATH}/lotion"
Terminal=false
Categories=Office;TextEditor;Utility
Type=Application
Icon=${WORKING_DIR}/icon.png
StartupWMClass=lotion
EOS
chmod +x LotionDev.desktop
## This can be updated if this path is not valid. 
cp -p LotionDev.desktop ~/.local/share/applications
