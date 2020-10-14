#!/bin/bash

required_programs=(git tar)

for cmd in ${required_programs[@]};
do
    [ ! $(command -v $cmd) ] && echo Command $cmd is required to run this script && exit -1
done

cd /tmp

if [ -d lotion ];
then
    echo Do you want to use already cashed lotion directory ? [yes/no] && read answer
    case $answer in
        "no") echo Downloading ... && rm -rf ./lotion && git clone https://github.com/puneetsl/lotion ;;
        "yes") echo Using cached directory ... ;;
        *) echo Invalid response, using cached directory ;;
    esac
else
    echo Downloading ...
    git clone https://github.com/puneetsl/lotion
fi

cd ./lotion

echo Copying to /usr/share

rm -rf /usr/share/lotion
cp -rf ../lotion /usr/share/
cd /usr/share/lotion

echo Runinng ./$1.sh

[ ! $(./$1.sh) ] && echo Specified installment method \($1\) is not avaible && exit -1

ln -s $PWD/Lotion/Lotion /usr/bin/lotion
ln -s $PWD/uninstall.sh /usr/bin/lotion_uninstall

./clean.sh
