#!/bin/bash
PD=`pwd`

if [ -d /usr/share/lotion ]
then
INSTALL_DIR="/usr/share/lotion"
SHORTCUT_DIR="/usr/share/applications"
EXEC_DIR="/usr/bin"
else
INSTALL_DIR=$PD"/Lotion"
SHORTCUT_DIR="$HOME/.local/share/applications"
EXEC_DIR="$HOME/.local/bin"
fi

rm -r $INSTALL_DIR
rm $SHORTCUT_DIR/Lotion.desktop
rm $EXEC_DIR/lotion
rm $EXEC_DIR/lotion_uninstall
