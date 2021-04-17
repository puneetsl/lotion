#!/bin/bash

# Selects native or web installation
command=$1
if [[  ! $command =~ native|web ]]; then
	printf "\nSelect an installation type:\n\nweb - Installs the web app at the latest version\nnative - Installs the native windows app at v2.0.9 which has offline support.\n"
	select command in web native
	do
		if [[ $command =~ native|web ]]; then
			echo $command
			break
		else
			echo "Please input 1 or 2"
		fi
	done
fi

PD=`pwd`
INSTALL_DIR=$PD"/Lotion"
echo $INSTALL_DIR
mkdir -p $INSTALL_DIR

# Unzips nativefier application

if [[ $command == 'web' ]]; then
	wget https://github.com/puneetsl/lotion/releases/download/V-0.05/Lotion-web.tar.xz
	tar xvf $PD/Lotion-web.tar.xz -C $INSTALL_DIR --strip 1
	rm Lotion-web.tar.xz
	/bin/bash $PD/create_shortcut.sh $command
	echo done
	exit 0
fi

wget https://github.com/puneetsl/lotion/releases/download/V-0.05/Lotion-native.tar.gz
tar xvf $PD/Lotion-native.tar.gz -C $INSTALL_DIR --strip 1
rm Lotion-native.tar.gz

# Creates the desktop shortcut
/bin/bash "$PD"/create_shortcut.sh $command