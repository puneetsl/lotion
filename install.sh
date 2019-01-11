#!/bin/bash
PD=`pwd`
INSTALL_DIR=$PD"/Notion"
echo $INSTALL_DIR
mkdir -p $INSTALL_DIR
tar xvf $PD/notion-linux-x64.tar.gz -C $INSTALL_DIR --strip 1
/bin/bash $PD/create_shortcut.sh