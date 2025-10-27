# Changelog

All notable changes to Lotion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-10-27

### 🎨 Theme System

**Added**
- **8 Beautiful Themes** including Dracula, Nord, Gruvbox Dark, and Catppuccin variants (Mocha, Macchiato, Frappe, Latte)
- **Unified Theming** - Tab bar and page content synchronize with selected theme
- **System Theme Integration** - Default theme respects system dark/light mode preference
- **Custom CSS Support** - Users can create custom themes in `~/.config/Lotion/themes/`
- **Minimal Theme Design** - Themes style UI chrome while preserving content readability
- **Instant Theme Switching** - Change themes on the fly without restarting

### 🪟 Frameless Window Design

**Added**
- **Custom 32px Title Bar** - Modern, seamless interface without traditional window chrome
- **Integrated Tab Bar** - Tabs and window controls in single cohesive bar
- **Window Control Buttons** - Native minimize, maximize, and close buttons
- **Rounded Corners** - 8px border radius for modern appearance

### 📑 Multi-Tab System

**Added**
- **Create/Close Tabs** - Full multi-tab support like a web browser
- **Tab Switching** - Click to switch between open tabs
- **Drag-and-Drop Reordering** - Visual tab reordering with smooth animations
- **Tab Pinning** - Pin important tabs for quick access
- **Favicon Support** - Tab icons with fallback to Notion logo
- **Active Tab Highlighting** - Clear visual indicator for current tab
- **Dynamic Tab Titles** - Tab titles update automatically from page content

### 🧭 Navigation Controls

**Added**
- **Back Button (‹)** - Navigate backward in history
- **Forward Button (›)** - Navigate forward in history
- **Refresh Button (↻)** - Reload current page
- **Integrated Design** - Navigation controls built into tab bar

### 🔖 Logo Menu

**Added**
- **Clickable Lotion Logo** - Interactive logo in top-left corner
- **Native Popup Menu** - Context menu with project links and settings
- **Theme Selector** - Choose from 8 built-in themes
- **Reload Custom CSS** - Refresh custom themes without restart
- **GitHub Links** - Quick access to project repository and issues
- **Spell Check Toggle** - Enable/disable spell checking

### 🔍 Context Menu & Spell Check

**Added**
- **Right-Click Context Menu** - Full-featured context menu for text editing
- **Spell Check Suggestions** - English (US) spell checking with suggestions
- **Add to Dictionary** - Remember custom words
- **Standard Editing Commands** - Cut, Copy, Paste, Select All
- **Link Handling** - Copy link addresses, open in browser
- **Image Support** - Copy image, copy image address

### 🏗️ Redux State Management

**Added**
- **Centralized State** - Redux Toolkit for application state
- **Tab State Management** - Complete tab lifecycle management
- **Window-Tab Relationships** - Track tabs per window
- **Tab Spaces Foundation** - State layer for future tab groups

### 🐛 Bug Fixes

**Fixed**
- Fixed theme CSS hiding Notion page content
- Fixed tab bar not respecting system theme in default mode
- Fixed window maximize/unmaximize behavior
- Fixed tab reordering visual glitches
- Fixed favicon loading and fallback

### 📝 Documentation

**Added**
- Comprehensive theme documentation in README
- Custom theme creation guide
- Updated feature list with v1.5 capabilities

---

## [Unreleased]

### Added
- Initial release of Lotion - Unofficial Notion.so Desktop App
- Cross-platform support (Windows, macOS, Linux)
- Native desktop experience with proper window management
- Navigation controls in native menu (Back, Forward, Refresh, Home)
- Keyboard shortcuts (Alt+Left, Alt+Right, Ctrl+R, Ctrl+H)
- Native title bar integration
- Auto-updater support
- Comprehensive build system with Electron Forge

### Features
- Clean, native UI that matches system theme
- Menu bar navigation with keyboard shortcuts
- External link handling (opens in default browser)
- Proper window state management
- Security-hardened Electron configuration
- TypeScript support with proper configuration

### Technical
- Built with Electron and Electron Forge
- Webpack-based build system
- Cross-platform packaging (DEB, RPM, DMG, EXE)
- GitHub Actions CI/CD pipeline
- Automated releases and builds
- Security audit integration 