#!/bin/bash

lotion_mirror="https://github.com/puneetsl/lotion"
required_programs=(git tar 7z wget)

# Check for required programs
for cmd in ${required_programs[@]};
do
    [ ! $(command -v $cmd) ] && echo Command $cmd is required to run this script && exit 1
done

# Select installation destination
[ "$EUID" -ne 0 ] && locally="yes" || locally="no"

installation_folder=$(pwd)
case $locally in
    "yes") 
        echo "Installing for current user. If you want to install globally, run script as sudo" 
		installation_folder=~/.local/share/lotion/
        executable_folder=~/.local/bin/
        applications_folder=~/.local/share/applications/
        ;;
    "no")  echo "Installing program for all users. If you want to install program locally, run script without sudo" 
        installation_folder=/usr/share/lotion/
        executable_folder=/usr/bin/
        applications_folder=/usr/share/applications/
        ;;
esac

# Select installation type
cmd=$1
if [[  ! $cmd =~ native|web ]]; then
	printf "\nSelect an installation type:\n\nweb - Installs the web app at the latest version\nnative - Installs the native windows app at v2.0.9 which has offline support.\n"
	select cmd in web native
	do
		if [[ $cmd =~ native|web ]]; then
			echo $cmd
			break
		else
			echo "Please input 1 or 2"
		fi
	done
fi

# Create and copy current lotion folder
echo Copying to $installation_folder

rm -rf $installation_folder
mkdir $installation_folder
cd $installation_folder
cd /tmp

# Caching 
if [ -d lotion ];
then
    echo Do you want to use already cached lotion directory ? [yes/no] && read answer
    case $answer in
        "N" | "n" | "No" | "no") echo Downloading ... && rm -rf ./lotion && git clone --depth=1 $lotion_mirror ;;
        "Y" | "y" | "Yes" | "yes") echo Using cached directory ... ;;
        *) echo Invalid response, using cached directory ;;
    esac
else
    echo Downloading ...
    git clone --depth=1 $lotion_mirror
fi

cd ./lotion

# Create and copy current lotion folder
echo Copying to $installation_folder

rm -rf $installation_folder
mkdir $installation_folder
cp -rf ./* $installation_folder
cd $installation_folder

# Installation
echo "$cmd"
if [[ -f install.sh ]]; then
    ./install.sh $cmd
else
    echo Specified installment method \($cmd\) is not avaible
    exit 1
fi

echo Linking executables ...
# Linking executables for terminal usage
mkdir -p ${executable_folder}
ln -s $PWD/Lotion/Lotion ${executable_folder}lotion
ln -s $PWD/uninstall.sh ${executable_folder}lotion_uninstall

echo Copying shortcut ...
if [[ $cmd == 'web' ]]; then
    cp ./Lotion.desktop ${applications_folder}Lotion.desktop
else
    cp ./Notion_native.desktop ${applications_folder}Notion_native.desktop
fi

echo Cleaning ...
#./clean.sh

echo Done !
