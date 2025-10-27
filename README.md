<p align="center">
  <img width="15%" height="15%" src="https://github.com/puneetsl/lotion/blob/master/assets/icon.png?raw=true" alt="Lotion Icon"><br>
  <h1 align="center">Lotion</h1>
  <p align="center">Unofficial Notion.so Desktop App for Linux</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-linux-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/electron-34.3.2-9feaf9.svg" alt="Electron">
</p>

------

## Introduction

Welcome! This is an unofficial version of the `Notion.so` Electron app. Since NotionHQ has been focused on other amazing feature developments, Linux support is lower on their priority list. Here's what they had to say:

<blockquote>
"Hey we don't want to release on platforms that we cannot ensure the quality – the team is still small and we don't use Linux ourselves"
<br>— Notion (@NotionHQ)
</blockquote>

So I decided to build a proper Linux desktop app using Electron! This version provides a native desktop experience with all the features you'd expect from a first-class desktop application.

### Here's how it looks:

![Lotion Screenshot](https://user-images.githubusercontent.com/6509604/115094341-2e867900-9eeb-11eb-8305-a0cc50426283.png)

> **First time hearing about Notion?**
>
> Use this [link](https://www.notion.so/?r=55d4c384b54a457490f6cc1799bedc76) to sign up and get ready to manage your life like you have never managed before!

------

## ✨ Features

### Core Functionality
- ✅ **Full Notion.so functionality** on Linux
- ✅ **Native Linux desktop integration** with proper icon support
- ✅ **Offline mode support** (when using native build)
- ✅ **System tray integration**
- ✅ **Cross-platform support** (Linux, macOS, Windows)

### Menu & Navigation
- ✅ **Persistent Menu Bar Preferences** - Hide/show menu bar with settings saved across sessions
- ✅ **Customizable Keyboard Shortcuts** for menu bar control
- ✅ **Native menu bar** with navigation controls (Back, Forward, Refresh, Home)
- ✅ **Auto-hide menu bar** mode with Alt key toggle

### Spell Check (NEW! 🎉)
- ✅ **Multi-language spell checking** - English (US/UK), German, French, Spanish, Portuguese, Russian
- ✅ **Multiple dictionaries** - Select multiple languages simultaneously
- ✅ **Persistent settings** - Your language preferences are saved
- ✅ **Easy access** - Available in View → Spell Check Dictionary menu

### Architecture & Build
- ✅ **Modern Electron Forge** build system
- ✅ **Multiple package formats**: DEB, RPM, and ZIP
- ✅ **Multi-architecture support**: x64 and ARM64
- ✅ **Internationalization support** (i18n ready)
- ✅ **Redux-based state management** for app settings

### Better Icon
Featuring a stunning icon design (courtesy: [Konrad Kolasa](https://dribbble.com/shots/4886987-Notion-Icon-Replacement))

<img width="75%" height="75%" src="https://user-images.githubusercontent.com/6509604/115094448-86bd7b00-9eeb-11eb-9be5-2ac125825fa1.png" alt="Lotion in System Tray">

------

## 📦 Installation

### Arch Linux (AUR)

For Arch Linux users, install from the AUR:

```bash
# Using yay
yay -S lotion

# Using paru
paru -S lotion

# Using makepkg manually
git clone https://aur.archlinux.org/lotion.git
cd lotion
makepkg -si
```

### Debian/Ubuntu (.deb package)

Download the latest `.deb` package from [Releases](https://github.com/puneetsl/lotion/releases):

```bash
sudo dpkg -i lotion_1.0.0_amd64.deb

# If you have dependency issues:
sudo apt install -f
```

### Fedora/RHEL (.rpm package)

Download the latest `.rpm` package from [Releases](https://github.com/puneetsl/lotion/releases):

```bash
sudo rpm -i lotion-1.0.0.x86_64.rpm

# Or using dnf:
sudo dnf install ./lotion-1.0.0.x86_64.rpm
```

### From Source

1. **Clone the repository:**
```bash
git clone git@github.com:puneetsl/lotion.git
cd lotion
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run in development mode:**
```bash
npm run dev
```

### Build Packages

To build distribution packages:

```bash
# Build .deb package (recommended for Debian/Ubuntu)
npx electron-forge make --targets @electron-forge/maker-deb

# Build all Linux packages
npm run make:linux

# Packages will be in the 'out' directory:
# - .deb package (Debian/Ubuntu)
# - .rpm package (Red Hat/Fedora/openSUSE)
# - .zip archive (universal)
```

### Install the .deb Package

```bash
sudo dpkg -i out/make/deb/x64/lotion_1.0.0_amd64.deb

# If you have dependency issues on non-Debian systems:
sudo dpkg -i --force-depends out/make/deb/x64/lotion_1.0.0_amd64.deb
```

### Portable Installation

For a portable install (no system installation required):

```bash
./portable.sh
```

------

## ⚙️ Configuration

The application stores configuration in `config/config.json`:

```json
{
  "domainBaseUrl": "https://www.notion.so"
}
```

User preferences (menu bar settings, spell check dictionaries) are automatically saved using `electron-store` in:
- **Linux**: `~/.config/Lotion/`

------

## ⌨️ Keyboard Shortcuts

### Navigation
- `Alt+Left` - Go Back
- `Alt+Right` - Go Forward
- `Ctrl+R` - Refresh/Reload
- `Ctrl+H` - Go to Home (Notion.so)

### Menu Bar Control
- `Ctrl+Shift+M` - Toggle Menu Bar Visibility
- `Ctrl+Alt+M` - Toggle Auto-Hide Menu Bar
- `Alt` - Show Menu Bar (when auto-hide is enabled)

### Application
- `Ctrl+Q` - Quit Application
- `Ctrl+,` - Open Preferences
- `F11` - Toggle Fullscreen
- `Ctrl+Shift+I` - Toggle Developer Tools

------

## 📝 Spell Check

Lotion includes built-in spell checking with support for multiple languages:

### Available Languages:
- English (US)
- English (UK)
- German
- French
- Spanish
- Portuguese (Brazil)
- Russian

### How to Use:
1. Open Lotion
2. Go to **View → Spell Check Dictionary**
3. Check one or more languages
4. Spell checking is now enabled for all selected languages!

Your dictionary preferences are saved and persist across app restarts.

------

## 🔧 Development

### Project Structure

```
lotion/
├── src/
│   ├── main/
│   │   ├── controllers/      # AppController, WindowController
│   │   ├── store/            # Redux store & slices
│   │   ├── index.js          # Main entry point
│   │   └── spellCheckMenu.js # Spell check functionality
│   └── renderer/
│       └── preload.js        # Preload script
├── assets/                   # Icons and desktop files
├── config/                   # Configuration files
├── i18n/                     # Internationalization
└── build.js                  # Build script
```

### Development Scripts

```bash
npm run start      # Start in development mode
npm run dev        # Alias for start
npm run package    # Package the application
npm run make       # Create distribution packages
npm run make:linux # Create Linux-specific packages
```

### How It Works

1. **Main Process**: Manages application lifecycle, window creation, and native features
   - **AppController**: Handles app-level management and window orchestration
   - **WindowController**: Manages individual window instances
   - **Redux Store**: Centralized state management for preferences and windows

2. **Renderer Process**: Loads and displays the Notion.so web application

3. **Native Integration**: Provides Linux desktop features like tray icons, keyboard shortcuts, and menu bar management

------

## 🐛 Troubleshooting

### Common Issues

**App won't start:**
- Make sure you have Node.js 18+ installed: `node --version`
- Try: `rm -rf node_modules && npm install`

**Missing dependencies:**
- Run: `npm install`

**Build fails:**
- Install required tools:
  ```bash
  # Debian/Ubuntu
  sudo apt install dpkg fakeroot

  # Fedora/RHEL
  sudo dnf install dpkg fakeroot
  ```

**Storage errors:**
- Clear app data: `rm -rf ~/.config/Lotion ~/.cache/lotion`

**Icon not showing:**
- Reinstall the .deb package
- Update icon cache: `sudo update-icon-caches /usr/share/icons/*`

### Login Issues

If you're having trouble logging in with Google SSO:

Google has [stopped allowing logins](https://security.googleblog.com/2019/04/better-protection-against-man-in-middle.html) from unidentified browsers. The solution is simple:

1. **Use email login** instead of "Continue with Google"
2. Enter your email address
3. Notion will email you a login code
4. Enter the code to log in

![Email Login](https://user-images.githubusercontent.com/6509604/114249493-c541bb80-9968-11eb-9a79-fd242aa9010c.png)

**Note:** The native version doesn't have this issue!

Related issues: [Google issue #78](https://github.com/puneetsl/lotion/issues/78), [Apple issue #70](https://github.com/puneetsl/lotion/issues/70)

### Known Limitations

- Requires internet connection (web version loads from Notion.so)
- Some Notion features may differ slightly from the official desktop app
- Auto-updater not yet configured (manual updates required)


## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly on Linux
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### For Maintainers

If you're maintaining the AUR package, see [AUR_SUBMISSION.md](AUR_SUBMISSION.md) for detailed instructions on:
- Submitting to AUR for the first time
- Updating the package for new releases
- Testing and troubleshooting

------

## 🙏 Acknowledgments

- Thanks to [sysdrum/notion-app](https://github.com/sysdrum/notion-app) for inspiration and initial code
- Icon design by [Konrad Kolasa](https://dribbble.com/shots/4886987-Notion-Icon-Replacement)
- Spell check functionality inspired by the community
- Built with ❤️ using Electron and modern web technologies

------

## 📄 License

This project is for educational and personal use. Please respect Notion's terms of service.

### Disclaimer

This is an unofficial adaptation of Notion's desktop application. It is not affiliated with, endorsed by, or supported by Notion Labs, Inc.

------

## 🗑️ Uninstall

### For .deb Package Installation

```bash
# Using dpkg
sudo dpkg -r lotion

# Or using apt
sudo apt remove lotion
```

### For .rpm Package Installation

```bash
# Using rpm
sudo rpm -e lotion

# Or using dnf/yum
sudo dnf remove lotion
# or
sudo yum remove lotion
```

### For Source/Portable Installation

Simply delete the application directory:

```bash
rm -rf /path/to/lotion

# Also remove user data (optional)
rm -rf ~/.config/Lotion ~/.cache/lotion
```

------

## 📬 Support

For issues and questions, please use the GitHub issue tracker:
- 🐛 [Report a bug](https://github.com/puneetsl/lotion/issues)
- 💡 [Request a feature](https://github.com/puneetsl/lotion/issues)
- 💬 [Ask a question](https://github.com/puneetsl/lotion/discussions)

------

### 📢 Ad: [Memodiction.com](https://memodiction.com/)
*A dictionary that helps you remember words*

------

<p align="center">Made with ❤️ for the Linux community</p>
