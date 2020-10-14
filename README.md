<p align="center"><img width="35%" height="35%" src="http://i.imgur.com/6dtC91m.png" alt="Notion.so"><br>unofficial Notion.so Desktop app for Linux</p>

------

`Version: 0.04` 

# Introduction

Welcome! This is an unofficial version of `Notion.so` electron app. Since NotionHQ is busy doing other amazing feature developments, Linux is low on its priority. Here is the tweet from them explaining that

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Hey we don&#39;t want to release on platforms that we cannot ensure the quality – the team is still small and we don&#39;t use Linux ourselves </p>&mdash; Notion (@NotionHQ) <a href="https://twitter.com/NotionHQ/status/912737143327301634?ref_src=twsrc%5Etfw">September 26, 2017</a></blockquote>


So I decided to build my own app using `nativefier` 

Here is how it looks

![](http://i.imgur.com/QfG4Fwn.png) 



> Is it your first time finding about the Notion app? 
>
> Use this [link](https://www.notion.so/?r=55d4c384b54a457490f6cc1799bedc76) to sign up and get ready to manage your life like you have never managed before ([Notion.so](https://www.notion.so/?r=55d4c384b54a457490f6cc1799bedc76))

# Installation
Download setup script
```bash
wget https://raw.githubusercontent.com/puneetsl/lotion/master/setup.sh

# Run
./setup.sh install
# Or for native installation
./setup.sh install_native
```
Or simply clone this repo and run 

```bash
./install.sh 
```
If you would like to install the native (offline) version, run:

```bash
./install_native.sh
```

If the script has errors or you would like to install
manually, you can refer to [these](https://github.com/puneetsl/lotion/issues/1) instructions.



# Features

- Better Icon (courtesy: [Konrad Kolasa](https://dribbble.com/shots/4886987-Notion-Icon-Replacement) )

  <img width="15%" height="15%" src="https://github.com/puneetsl/lotion/blob/master/icon.png?raw=true" alt="Notion Icon">
<br>looks stunning in actual usage:<br>
<img width="75%" height="75%" src="https://cdn.dribbble.com/users/23017/screenshots/4886987/attachments/1096743/icon_in_dock.png">
- Everything you would expect from Windows or Mac application 

  -  [Here](https://github.com/puneetsl/lotion/issues/1) are the instructions to manually install natively if the
  installer script doesn't work.
- Tray icon

 -------
 
Thanks to [sysdrum](https://github.com/sysdrum/notion-app), I used some of his code and improved upon it

-------


# Uninstall

```bash
./uninstall.sh
```

# Advertisement
<a href="https://www.binarydecimal.com"><img width="80%" height="80%" src="https://i.imgur.com/L7vCi4o.jpg" alt="BinaryDecimal.com"></a>
