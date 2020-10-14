#!/bin/bash
PD=`pwd`
INSTALL_DIR=$PD"/Lotion"

[ -d /usr/share/lotion ] INSTALL_DIR="/usr/share/lotion"

rm -r $INSTALL_DIR
rm /usr/share/applications/Lotion.desktop
rm /usr/bin/lotion
rm /usr/bin/lotion_uninstall
