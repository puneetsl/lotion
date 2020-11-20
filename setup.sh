#!/bin/bash

lotion_mirror="https://github.com/Mazurel/lotion"
required_programs=(git tar)

# Check for required programs
for cmd in ${required_programs[@]};
do
    [ ! $(command -v $cmd) ] && echo Command $cmd is required to run this script && exit -1
done

# Select installation destination
[ "$EUID" -ne 0 ] && locally="yes" || locally="no"

case $locally in
    "yes") 
        echo "Installing program locally (only for current user). If you want to install globally, run script as sudo" 
        installation_folder=~/.local/share/lotion/
        executable_folder=~/.local/bin/
        applications_folder=~/.local/share/applications/
        ;;
    "no")  echo "Installing program globaly (for all users). If you want to install program locally, run script without sudo" 
        installation_folder=/usr/share/lotion/
        executable_folder=/usr/bin/
        applications_folder=/usr/share/applications/
        ;;
esac

if [ $locally == 'yes' ] && [ ! -d ~/.local/bin/ ]; then
    mkdir ~/.local/bin/
fi

# Select installation type
if [ -n "$1" ]; then
    cmd=$1
else
    echo "Please select one of the install types:"
    echo "1) install"
    echo "2) install_native"
    read cmd
    case $cmd in
        "1" | "install") cmd=install;;
        "2" | "install_native") cmd=install_native;;
        *) echo "Wrong value"; exit -1;;
    esac
fi

cd /tmp

# Cashing 
if [ -d lotion ];
then
    echo Do you want to use already cashed lotion directory ? [yes/no] && read answer
    case $answer in
        "no") echo Downloading ... && rm -rf ./lotion && git clone --depth=1 $lotion_mirror ;;
        "yes") echo Using cached directory ... ;;
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
if [[ -f $cmd.sh ]]; then
    ./$cmd.sh
else
    echo Specified installment method \($cmd\) is not avaible
    exit -1
fi

echo Linking executables ...
# Linking executables for terminal usage
ln -s $PWD/Lotion/Lotion ${executable_folder}lotion
ln -s $PWD/uninstall.sh ${executable_folder}lotion_uninstall

echo Creating shortcut ...
./create_shortcut.sh
cp ./Lotion.desktop ${applications_folder}Lotion.desktop

echo Cleaning ...
./clean.sh

echo Done !
