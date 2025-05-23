# Lotion

**Unofficial Notion.so Desktop app for Linux**

A lightweight Linux-compatible Electron application that provides a native desktop experience for Notion.so.

## 🎉 Current Status

✅ **WORKING!** The application successfully runs on Linux and loads the full Notion.so web interface in a native desktop window.

🖥️ **Native Desktop Integration** with persistent menu bar preferences, keyboard shortcuts, and proper Linux desktop integration.

## Features

- ✅ Full Notion.so functionality on Linux  
- ✅ Native Linux desktop integration with proper icon support
- ✅ **Persistent Menu Bar Preferences** - Hide/show menu bar with settings saved across sessions
- ✅ **Customizable Keyboard Shortcuts** for menu bar control
- ✅ Support for both x64 and ARM64 architectures
- ✅ Package formats: DEB, RPM, and ZIP
- ✅ Internationalization support (multiple languages)
- ✅ Native menu bar with navigation controls
- ✅ External link handling (opens in system browser)
- ✅ Proper window management and native title bar
- ✅ Cross-platform icon support (PNG for Linux, ICO for Windows, ICNS for macOS)

## Requirements

- Node.js 18 or higher
- npm or yarn
- Linux operating system
- For building .deb packages: `dpkg` and `fakeroot`

## Quick Start

### Option 1: Direct launch
```bash
npm install
npm run start
```

### Option 2: Development mode
```bash
npm run dev
```

## Installation

### From Source

1. Clone the repository:
```bash
git clone git@github.com:puneetsl/lotion.git
cd lotion
```

2. Install dependencies:
```bash
npm install
```

3. Run the application in development mode:
```bash
npm run dev
```

### Building for Distribution

To build packages for Linux:

```bash
# Build .deb package (recommended)
npx electron-forge make --targets @electron-forge/maker-deb

# Build all Linux packages (if dependencies are installed)
npm run make:linux

# This will create packages in the 'out' directory:
# - .deb package (for Debian/Ubuntu)
# - .rpm package (for Red Hat/Fedora/openSUSE) 
# - .zip archive (universal - also used for macOS distribution)
```

**Note**: macOS distribution uses ZIP format instead of DMG to ensure reliable builds in CI environments.

### Installing the .deb Package

```bash
# Install the built package
sudo dpkg -i out/make/deb/x64/lotion_1.0.0_amd64.deb

# If there are dependency issues on non-Debian systems:
sudo dpkg -i --force-depends out/make/deb/x64/lotion_1.0.0_amd64.deb
```

## Development

### Scripts

- `npm run start` - Start the application in development mode
- `npm run dev` - Alias for start
- `npm run package` - Package the application
- `npm run make` - Create distribution packages
- `npm run make:linux` - Create Linux-specific packages
- `npm run dist` - Create distribution packages for Linux

### Project Structure

```
lotion/
├── src/
│   ├── main/           # Main process code (Electron backend)
│   └── renderer/       # Renderer process code 
├── assets/            # Application assets (icons, desktop files)
│   ├── icon.png       # Linux icon
│   ├── icon.ico       # Windows icon  
│   ├── icon.icns      # macOS icon
│   ├── icons/         # Various icon sizes
│   └── lotion.desktop # Linux desktop entry
├── config/            # Configuration files
├── i18n/              # Internationalization files
├── scripts/           # Build and utility scripts
└── build.js           # Build script for creating packages
```

## How It Works

Lotion works by:

1. **Main Process**: A custom Electron main process (`src/main/index.js`) that:
   - Creates a native desktop window with proper Linux integration
   - Loads the Notion.so web application directly
   - Handles native desktop features (menus, shortcuts, preferences)
   - Manages external links and security
   - Saves user preferences (menu bar settings) persistently

2. **Web Content**: The full Notion.so web application runs inside the Electron window, providing the complete Notion experience

3. **Native Integration**: Platform-specific features like:
   - Native menus and keyboard shortcuts
   - **Persistent menu bar preferences**
   - Proper desktop file integration on Linux
   - Icon support across platforms

## Configuration

The application configuration is located in `config/config.json`. Key settings include:

- `domainBaseUrl`: Notion.so domain configuration ("https://www.notion.so")

User preferences (like menu bar settings) are automatically saved using `electron-store`.

## Keyboard Shortcuts

### Navigation
- `Alt+Left`: Go Back
- `Alt+Right`: Go Forward  
- `Ctrl+R`: Refresh/Reload
- `Ctrl+H`: Go to Home (Notion.so)

### Menu Bar Control
- `Ctrl+Shift+M`: Toggle Menu Bar Visibility
- `Ctrl+Alt+M`: Toggle Auto-Hide Menu Bar
- `Alt`: Show Menu Bar (when auto-hide is enabled)

### Application
- `Ctrl+Q`: Quit Application
- `Ctrl+,`: Open Preferences
- `F11`: Toggle Fullscreen
- `Ctrl+Shift+I`: Toggle Developer Tools

## Menu Features

### Lotion Menu
- **About Lotion**: Application information
- **Preferences**: Menu bar settings and keyboard shortcuts
- **Quit**: Exit the application

### View Menu  
- **Hide/Show Menu Bar**: Toggle menu bar visibility with persistent setting
- **Enable/Disable Auto-Hide Menu Bar**: Auto-hide behavior with persistent setting
- Various zoom and fullscreen options

## Menu Bar Preferences

The application includes a comprehensive menu bar preference system:

- **Persistent Settings**: Menu bar preferences are saved across application restarts
- **Toggle Visibility**: Hide or show the menu bar completely
- **Auto-Hide Mode**: Menu bar appears when pressing Alt key
- **Keyboard Shortcuts**: Quick access via Ctrl+Shift+M and Ctrl+Alt+M
- **Preferences Dialog**: Access via Ctrl+, or Lotion menu

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Linux
5. Submit a pull request

## License

This project is for educational and personal use. Please respect Notion's terms of service.

## Disclaimer

This is an unofficial adaptation of Notion's desktop application. It is not affiliated with, endorsed by, or supported by Notion Labs, Inc.

## Troubleshooting

### Common Issues

1. **App won't start**: Make sure you have Node.js 18+ installed
2. **Missing dependencies**: Run `npm install` to install all dependencies  
3. **Build fails**: Check that you have the required build tools for your Linux distribution
4. **Storage errors**: Clear app data with `rm -rf ~/.config/Lotion ~/.cache/lotion`
5. **Icon not showing**: Make sure the .deb package was installed correctly

### Known Limitations

- Requires internet connection (loads web version of Notion.so)
- Some Notion features may not work identically to the official desktop app
- Auto-updater is not yet configured (manual updates required)

### Building Requirements

For **.deb packages**:
```bash
sudo dnf install dpkg fakeroot  # Fedora/RHEL
sudo apt install dpkg fakeroot  # Debian/Ubuntu
```

## Support

For issues and questions, please use the GitHub issue tracker at: https://github.com/puneetsl/lotion/issues

## Acknowledgments

- Built with Electron and modern web technologies
- Inspired by the need for a native Linux Notion client
- Icon design and desktop integration for Linux platforms 