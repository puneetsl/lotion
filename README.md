# Lotion

**Unofficial Notion.so Desktop app for Linux**

A Linux-compatible Electron application based on Notion's desktop app, adapted to work natively on Linux systems.

## 🎉 Current Status

✅ **WORKING!** The application successfully runs on Linux and loads the full Notion.so web interface in a native desktop window.

🔌 **NEW: Offline Reading Support!** Visit pages while online, then read them offline automatically.

## Features

- ✅ Full Notion.so functionality on Linux
- ✅ **Offline Reading**: Automatically caches visited pages for offline access
- ✅ **Smart Caching**: API responses and static assets cached automatically  
- ✅ **Offline Indicators**: Visual indicators when offline with cached content
- ✅ Native Linux desktop integration
- ✅ Support for both x64 and ARM64 architectures
- ✅ Package formats: DEB, RPM, and ZIP
- ✅ Internationalization support (multiple languages)
- ✅ Native menu bar and shortcuts
- ✅ External link handling
- ✅ Auto-updater ready (for future use)

## How Offline Reading Works

### 🌐 **While Online:**
- Browse Notion normally
- All visited pages are **automatically cached**
- API responses stored for offline access
- No user action required

### 🔌 **When Offline:**
- Previously visited pages **load instantly** from cache
- Window title shows "(Offline)" indicator
- Read-only access to cached content
- Graceful handling of non-cached content

### 📊 **Cache Management:**
- **Menu > Offline > Cache Status**: View cached content stats
- **Menu > Offline > Clear Cache**: Reset offline cache
- Automatic cache updates when back online

## Requirements

- Node.js 18 or higher
- npm or yarn
- Linux operating system

## Quick Start

### Option 1: Direct launch
```bash
npm install
npm run start
```

### Option 2: Using launch script
```bash
./scripts/launch.sh
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
# Build all Linux packages
npm run make:linux

# Or use the build script
node build.js

# This will create packages in the 'out' directory:
# - .deb package (for Debian/Ubuntu)
# - .rpm package (for Red Hat/Fedora/openSUSE)
# - .zip archive (universal)
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
│   └── renderer/       # Renderer process code + service worker
├── .webpack/          # Compiled webpack output (includes original Notion code)
├── assets/            # Application assets (icons, etc.)
├── config/            # Configuration files
├── i18n/              # Internationalization files (copied from Notion)
├── scripts/           # Build and utility scripts
└── build.js           # Build script for creating packages
```

## How It Works

Lotion works by:

1. **Main Process**: A custom Electron main process (`src/main/index.js`) that:
   - Creates a native desktop window
   - Loads the Notion.so web application
   - Handles native desktop integration (menus, shortcuts, etc.)
   - Manages external links and security
   - **Injects service worker for offline support**

2. **Service Worker**: (`src/renderer/service-worker.js`) that:
   - **Automatically caches visited pages**
   - Intercepts API requests for offline serving
   - Handles cache management and updates
   - Provides offline/online status detection

3. **Web Content**: The full Notion.so web application runs inside the Electron window, providing the complete Notion experience with offline reading capabilities

4. **Native Integration**: Platform-specific features like:
   - Native menus and keyboard shortcuts
   - **Offline cache management UI**
   - System tray integration (future)
   - File system access (future)
   - Notifications (future)

## Configuration

The application configuration is located in `config/config.json`. Key settings include:

- `targetPlatform`: Set to "linux" for Linux builds
- `domainBaseUrl`: Notion.so domain configuration ("https://www.notion.so")
- `offline`: Set to `true` to enable offline reading features
- Various API endpoints and settings inherited from the original Notion app

## Keyboard Shortcuts

- `Ctrl+N` (or `Cmd+N` on macOS): New Page
- `Ctrl+R` (or `Cmd+R` on macOS): Refresh/Reload
- `Ctrl+Q` (or `Cmd+Q` on macOS): Quit Application
- `F5`: Reload
- `Ctrl+Shift+I`: Toggle Developer Tools
- `F11`: Toggle Fullscreen

## Menu Features

### Offline Menu
- **Cache Status**: View offline cache statistics
- **Clear Cache**: Reset offline cache (forces re-caching)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Linux (including offline functionality)
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
4. **Offline not working**: Check browser console for service worker registration errors

### Known Limitations

- **Offline editing**: Not supported (read-only offline access)
- **Real-time sync**: Requires internet connection
- **Large workspaces**: May take time to cache all content
- Some platform-specific features may not work as expected on Linux
- Native modules may need recompilation for different Linux distributions
- Auto-updater is not yet configured (manual updates required)

### Offline Functionality

- **What works offline**: Previously visited pages, cached API responses, static assets
- **What doesn't work offline**: Creating new pages, editing content, real-time collaboration
- **Cache persistence**: Survives app restarts and system reboots
- **Cache size**: Automatically managed, typically 50-100MB for normal usage

## Support

For issues and questions, please use the GitHub issue tracker at: https://github.com/puneetsl/lotion/issues

## Acknowledgments

- Based on the original Notion desktop application
- Built with Electron and modern web technologies
- Service Worker API for offline functionality
- Inspired by the need for a native Linux Notion client with offline reading support 