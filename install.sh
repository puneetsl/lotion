#!/bin/bash
PD=`pwd`
INSTALL_DIR=$PD"/Lotion"
echo $INSTALL_DIR
mkdir -p $INSTALL_DIR
tar xvf $PD/Lotion-linux-x64.tar.xz -C $INSTALL_DIR --strip 1
/bin/bash $PD/create_shortcut.sh
##you my need to add the following lines to make it work
chown root:root $PD/Lotion/chrome-sandbox
chmod 4755 $PD/Lotion/chrome-sandbox
