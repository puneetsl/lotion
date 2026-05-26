# Changelog

All notable changes to Lotion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-05-25

### 🎨 Theme System (closes #150)

**Fixed**
- **Built-in themes now actually apply** — the 7 named themes were listed in the menu but never shipped CSS, so theming silently no-oped for everyone. Themes are bundled in `assets/themes/` and override Notion's current `--c-*` CSS variable convention with `!important` on `.notion-dark-theme` / `.notion-light-theme` so they win the cascade.

**Added**
- **3 new themes**: **Monokai** (classic Sublime green/yellow on olive), **Noir** (high-contrast B&W with blood-red accent), and **Sakura** (pastel pink light theme)
- **System-theme sync** — picking a light theme (Sakura, Catppuccin Latte) flips Notion's "use system setting" detection to light; dark themes flip it to dark. Uses `nativeTheme.themeSource`.

### 🪟 Window & Tab UX

**Added**
- **Session restore** — opt-in "Restore Tabs on Startup" toggle (logo menu) persists each window's tabs and restores them on next launch. Saves via a debounced Redux subscriber so close-via-X-button doesn't lose state.
- **Native window decorations toggle** (closes #151) — opt-in mode swaps the frameless custom tab bar for DE-provided window chrome + the standard Electron menu bar. Single-tab-per-window in this mode.

**Fixed**
- **Active tab indicator out of sync** (closes #157) — the Redux subscriber only fired on tab-data changes, missing active-tab-id updates, so the highlight lagged a click behind.
- **Drag-and-drop tab reordering** (closes #156) — the IPC handler and preload bridge were wired but the renderer had no drag handlers at all. Added native HTML5 drag-and-drop with before/after drop indicators.
- **First tab missing from tab bar** — `addTabToWindow` silently no-oped if dispatched before `addWindow`; the init order was the reverse. Reorder so the first tab actually lands in `tabIds`.
- **Tab overflow scrollbar** (closes #158) — tabs now shrink Chrome-style first (min-width 80px), then hide the scrollbar in favor of mouse-wheel scroll + soft fade gradients on whichever edge has hidden tabs. The `+` button stays pinned next to window controls.
- **Zoom shortcuts on Spanish (and other non-US) keyboards** (closes #155) — replaced the built-in `zoomIn`/`zoomOut`/`resetZoom` roles (which bind to layout-dependent `Plus`/`Minus`) with explicit `CmdOrCtrl+=` / `CmdOrCtrl+-` / `CmdOrCtrl+0` handlers that target the active tab's content.

### 🎛️ Logo Menu Redesign

**Changed**
- Replaced emoji-prefixed text labels and `✓` pseudo-checkmark hacks with native Electron menu controls: `type:'checkbox'` for toggles, app version header, About dialog, Help & GitHub submenu.

## [1.5.1] - 2026-05-25

### ⬆️ Dependency Overhaul

**Changed**
- **Electron 35.7.5 → 41.7.0** — fixes Notion's "Your browser is not compatible" error by shipping a newer Chromium engine
- **Electron Forge 7.6.1 → 7.11.2** — updated build/packaging toolchain
- **better-sqlite3 11.8.1 → 12.10.0**
- **electron-updater ^6.6.2 → ^6.8.3**

### 🔒 Security

**Fixed**
- **node-forge 1.3.1 → 1.4.0** — addresses 3 CVEs (ASN.1 validator desynchronization, unbounded recursion DoS, OID integer truncation)
- **lodash 4.17.21 → 4.18.1** — prototype pollution fix in `baseUnset`
- **js-yaml 4.1.0 → 4.1.1** — prototype pollution fix in YAML merge operator
- Refreshed transitive dependencies pulling in patched versions of `qs`, `express`, `postcss`, `@xmldom/xmldom`, `ip-address`, `socks`, `fast-uri`, `terser-webpack-plugin`, and others

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