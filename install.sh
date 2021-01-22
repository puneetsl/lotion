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
tar xvf $PD/Lotion-linux-x64.tar.xz -C $INSTALL_DIR --strip 1
if [[ $command == 'web' ]]; then
	/bin/bash $PD/create_shortcut.sh Lotion
	echo done
	exit 0
fi

# Ensures 7z command is available
if ! command -v 7z &> /dev/null
then
	echo "7z tool required to install natively, install using sudo apt install p7zip-full"
	exit 1
fi

mkdir nativeApp
# Pulls the Notion windows app from the v2.0.9 release channel
wget -P "$PD"/nativeApp "https://desktop-release.notion-static.com/Notion%20Setup%202.0.9.exe"
cd nativeApp || exit 1

# Extracts the Notion app
7z x "Notion Setup 2.0.9.exe"
7z x \$PLUGINSDIR/app-64.7z

# Copies the needed resources to location for linux use.
cp resources/app.asar "$PD"/Lotion/resources/
mv "$PD"/Lotion/resources/app/ "$PD"/Lotion/resources/app.bak/
cd "$PD" || exit 1

# Creates the desktop shortcut
/bin/bash "$PD"/create_shortcut.sh Notion
