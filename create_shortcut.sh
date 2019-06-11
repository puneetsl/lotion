#!/bin/sh
set -e
WORKING_DIR=`pwd`
THIS_PATH=`readlink -f $0`
cd `dirname ${THIS_PATH}`
FULL_PATH=`pwd`/Notion
cd ${WORKING_DIR}
cat <<EOS > Notion.desktop
[Desktop Entry]
Name=Notion
Name[en_US]=Notion
Comment=Notion.so Desktop application for Linux
Exec="${FULL_PATH}/notion"
Terminal=false
Categories=Office;TextEditor;Utility
Type=Application
Icon=${FULL_PATH}/icon.png
StartupWMClass=notion-nativefier-fe83e9
EOS
chmod +x Notion.desktop
## This can be updated if this path is not valid. 
cp -p Notion.desktop ~/.local/share/applications
