#!/bin/sh
set -e
WORKING_DIR=`pwd`
THIS_PATH=`readlink -f $0`
command=$1
cd `dirname ${THIS_PATH}`
FULL_PATH=`pwd`/Lotion
cd ${WORKING_DIR}
if [[ $command == 'web' ]]; then
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
else
cat <<EOS > Notion_native.desktop
[Desktop Entry]
Name=Notion native
Name[en_US]=Notion native
Comment=Unofficial Notion.so application for Linux
Exec="${FULL_PATH}/Lotion"
Terminal=false
Categories=Office;TextEditor;Utility
Type=Application
Icon=${WORKING_DIR}/icon.png
StartupWMClass=Notion
EOS
chmod +x Notion_native.desktop
fi

