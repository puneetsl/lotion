<p align="center">
  <img width="15%" height="15%"  src="./assets/Banner.png" alt="Lotion - Unofficial Notion.so Desktop App for Linux">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-linux-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/electron-34.3.2-9feaf9.svg" alt="Electron">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

---

## Introduction

Lotion is an unofficial Electron-based desktop application that brings Notion.so to Linux. While NotionHQ continues to focus on feature development for other platforms, Linux support remains a lower priority. This project aims to fill that gap by providing a native desktop experience with modern UI and comprehensive features.

<blockquote>
"Hey we don't want to release on platforms that we cannot ensure the quality – the team is still small and we don't use Linux ourselves"
<br>— Notion (@NotionHQ)
</blockquote>

### Application Preview

<p align="center">
  <img src="./assets/screenshot.png" alt="Lotion Application Screenshot" width="90%">
</p>

> **First time hearing about Notion?**
>
> Use this [link](https://www.notion.so/?r=55d4c384b54a457490f6cc1799bedc76) to sign up and get ready to manage your life like you have never managed before!

---

## Features

### User Interface
- **Frameless Window Design** - Modern, seamless interface with custom title bar
- **Tab Management** - Multiple tabs with drag-and-drop reordering, pinning, and favicon support
- **Navigation Controls** - Integrated back, forward, and refresh buttons
- **Dark Mode Support** - Automatic theme detection and switching
- **Logo Menu** - Quick access to project links and GitHub repository

### Core Functionality
- **Full Notion.so Integration** - Complete access to all Notion features on Linux
- **Native Linux Desktop Integration** - Proper icon support and system integration
- **Cross-platform Compatibility** - Linux, macOS, and Windows support

### Navigation & Interaction
- **Context Menu** - Right-click menu with Cut, Copy, Paste, Select All, and link handling
- **External Links** - Automatically open links in default browser

### Spell Check
- **English Language Support** - Built-in spell checking for English (US)
- **Real-time Suggestions** - Right-click on misspelled words for suggestions
- **Custom Dictionary** - Add words to your personal dictionary

### Architecture
- **Modern Electron Stack** - Built with Electron 34.3.2 and Electron Forge
- **Redux State Management** - Centralized state for tabs, windows, and preferences
- **WebContentsView API** - Efficient multi-tab implementation
- **Multiple Package Formats** - DEB, RPM, and ZIP packages
- **Multi-architecture** - x64 and ARM64 builds available

### Icon Design
Custom icon design by [Konrad Kolasa](https://dribbble.com/shots/4886987-Notion-Icon-Replacement)

---

## Installation

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

---

## Configuration

The application stores configuration in `config/config.json`:

```json
{
  "domainBaseUrl": "https://www.notion.so"
}
```

User data and preferences are automatically saved in:
- **Linux**: `~/.config/Lotion/`

---

## Keyboard Shortcuts

### Navigation
Use the navigation buttons in the tab bar:
- Back button (‹) - Go back
- Forward button (›) - Go forward
- Refresh button (↻) - Reload page

### Development
- `Ctrl+Shift+I` / `F12` - Toggle Developer Tools (dev mode only)

---

## Spell Check

Lotion includes built-in spell checking with support for English (US):

### How to Use:
1. Type text in any editable field in Notion
2. Right-click on any misspelled word (underlined in red)
3. Select from the suggested corrections
4. Or choose "Add to Dictionary" to remember the word

Spell check works automatically in all text fields and is always enabled.

---

## Development

### Project Structure

```
lotion/
├── src/
│   ├── main/
│   │   ├── controllers/      # WindowController, TabController, AppController
│   │   ├── store/            # Redux store & slices (tabs, windows, settings)
│   │   ├── index.js          # Main process entry point
│   │   └── spellCheckMenu.js # Spell check menu functionality
│   └── renderer/
│       ├── tab-bar/          # Custom tab bar UI (vanilla JS)
│       │   ├── index.html    # Tab bar HTML & CSS
│       │   ├── renderer.js   # Tab bar rendering logic
│       │   └── preload.js    # Tab bar IPC bridge
│       └── preload.js        # Main preload script
├── assets/                   # Application icons and images
├── config/                   # Configuration files
├── i18n/                     # Internationalization support
└── build.js                  # Build configuration script
```

### Development Scripts

```bash
npm run start      # Start in development mode
npm run dev        # Alias for start
npm run package    # Package the application
npm run make       # Create distribution packages
npm run make:linux # Create Linux-specific packages
```

### Architecture Overview

**Main Process**
- **AppController**: Application lifecycle and multi-window orchestration
- **WindowController**: Manages frameless windows with custom tab bars
- **TabController**: Individual tab lifecycle and WebContentsView management
- **Redux Store**: Centralized state for tabs, windows, and user preferences

**Renderer Process**
- **Tab Bar**: Custom vanilla JavaScript UI for tab management
- **Web Content**: Loads Notion.so web application in WebContentsView instances
- **IPC Bridge**: Secure communication between main and renderer processes

**Key Technologies**
- WebContentsView API for efficient tab rendering
- Electron context isolation for security
- Redux Toolkit for state management
- Native context menus with spell check integration

---

## Troubleshooting

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


## Contributing

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

---

## Acknowledgments

- Thanks to [sysdrum/notion-app](https://github.com/sysdrum/notion-app) for inspiration and initial code
- Icon design by [Konrad Kolasa](https://dribbble.com/shots/4886987-Notion-Icon-Replacement)
- Spell check functionality inspired by the community
- Built with Electron and modern web technologies

---

## License

This project is for educational and personal use. Please respect Notion's terms of service.

### Disclaimer

This is an unofficial adaptation of Notion's desktop application. It is not affiliated with, endorsed by, or supported by Notion Labs, Inc.

---

## Uninstall

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

---

## Support

For issues and questions, please use the GitHub issue tracker:
- [Report a bug](https://github.com/puneetsl/lotion/issues)
- [Request a feature](https://github.com/puneetsl/lotion/issues)
- [Ask a question](https://github.com/puneetsl/lotion/discussions)

---

### Advertisement: [Memodiction.com](https://memodiction.com/)
*A dictionary that helps you remember words*

---

<p align="center">Made for the Linux community</p>
