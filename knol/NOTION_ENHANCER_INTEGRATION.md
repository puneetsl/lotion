# Notion-Enhancer Integration for Lotion

**Created:** October 27, 2025
**Status:** Research & Planning

## Overview

This document outlines how to integrate notion-enhancer-style features into Lotion, including:
- CSS theme injection
- Custom JavaScript enhancements
- User-submitted tweaks
- Plugin/mod system architecture

---

## What is Notion-Enhancer?

Notion-enhancer was a popular (now defunct/archived) project that enhanced the Notion desktop app with:
- **Themes** - Custom color schemes (Dracula, etc.)
- **CSS Tweaks** - Layout improvements, element hiding, styling modifications
- **Mods** - JavaScript-based feature additions
- **Custom Inserts** - User-uploaded CSS/JS files

**Why it's defunct:** Recent Notion updates broke compatibility, and the project was archived in February 2024.

**Why it's still relevant:** The architecture and popular tweaks provide a blueprint for what users want.

---

## Popular Features from Notion-Enhancer

### 1. Themes

**What they do:** Override Notion's CSS variables with custom color palettes

**Example: Dracula Theme**
```css
:root.dark {
  --theme--bg: #0f111a;
  --theme--fg: #f8f8f2;
  --theme--text: #f8f8f2;
  --theme--text_ui: #6272a4;
  --theme--text_ui_info: #8be9fd;
}
```

**Popular Themes:**
- Dracula
- Nord
- Gruvbox
- Solarized
- Material variants

### 2. CSS Tweaks (Most Popular)

Based on the tweaks repository, users wanted:

#### Layout & Spacing
- **Decrease side padding** - More content space on boards/tables
- **Smaller page icons** - More compact sidebar
- **Center-aligned table headers** - Better table aesthetics
- **Scrolling past page end** - Better reading experience

#### Element Hiding
- **Hide '+ new' buttons** - Declutter interface
- **Hide backlinks** - Remove distractions
- **Hide discussions** - Cleaner pages
- **Hide "Type '/' for commands"** - Remove helper text
- **Hide callout icons** - Minimalist callouts

#### Visual Improvements
- **Larger calendar icons** - Better visibility
- **Sticky table headers** - Headers stay visible on scroll
- **Remove rounded edges** - Sharp corners aesthetic
- **Left-align images** - Alternative layout

### 3. JavaScript Enhancements

**Features that required JS:**
- Tab management (now built into Lotion!)
- Sidebar improvements
- Custom right-click menus
- Keyboard shortcut extensions
- Database view customizations

---

## Architecture Design for Lotion

### Option 1: Simple CSS Injection (Recommended for v1.6)

**Pros:**
- Easy to implement (2-3 hours)
- Low maintenance
- Users can add their own CSS immediately
- No breaking on Notion updates (usually)

**Cons:**
- Limited to visual changes
- No complex features
- Each CSS file loads for all pages

**Implementation:**
```javascript
// In TabController.js
loadCustomCSS() {
  const cssPath = path.join(app.getPath('userData'), 'custom.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    this.webContentsView.webContents.insertCSS(css);
  }
}
```

**User workflow:**
1. Create `~/.config/Lotion/custom.css`
2. Add CSS tweaks
3. Restart Lotion or reload page
4. CSS is automatically applied

### Option 2: Theme System (Recommended for v1.7)

**Pros:**
- Organized theme management
- Multiple themes to choose from
- Easy theme switching
- Can ship with built-in themes

**Cons:**
- More complex (8-12 hours)
- Needs UI for theme selection
- State management for current theme

**Implementation:**

**Directory Structure:**
```
~/.config/Lotion/themes/
  ├── dracula/
  │   ├── theme.json
  │   └── theme.css
  ├── nord/
  │   ├── theme.json
  │   └── theme.css
  └── gruvbox/
      ├── theme.json
      └── theme.css
```

**theme.json:**
```json
{
  "name": "Dracula",
  "author": "Notion-Enhancer Community",
  "version": "1.0.0",
  "description": "Dark theme based on Dracula color scheme",
  "mode": "dark",
  "preview": "preview.png"
}
```

**Theme Manager:**
```javascript
class ThemeManager {
  constructor() {
    this.themesDir = path.join(app.getPath('userData'), 'themes');
    this.builtInThemesDir = path.join(__dirname, '../themes');
    this.currentTheme = null;
  }

  async loadThemes() {
    // Load built-in themes
    const builtInThemes = await this.scanThemeDirectory(this.builtInThemesDir);

    // Load user themes
    const userThemes = await this.scanThemeDirectory(this.themesDir);

    return [...builtInThemes, ...userThemes];
  }

  async applyTheme(themeName, webContents) {
    const theme = await this.getTheme(themeName);
    if (theme) {
      const css = fs.readFileSync(theme.cssPath, 'utf8');
      await webContents.insertCSS(css);
      this.currentTheme = themeName;
    }
  }
}
```

**UI Integration:**
- Add "Themes" option to logo menu
- Show theme gallery with previews
- Apply theme immediately on selection
- Save preference to settings

### Option 3: Full Mod System (Future - v2.0+)

**Pros:**
- Maximum flexibility
- Community can create complex mods
- Modular architecture
- Feature parity with notion-enhancer

**Cons:**
- Very complex (40-60 hours)
- Security concerns (running user code)
- Maintenance burden
- API stability requirements

**Implementation:**

**Mod Structure:**
```
~/.config/Lotion/mods/
  └── awesome-mod/
      ├── mod.json
      ├── main.js
      ├── renderer.js
      ├── styles.css
      └── README.md
```

**mod.json:**
```json
{
  "id": "awesome-mod",
  "name": "Awesome Mod",
  "version": "1.0.0",
  "author": "User",
  "description": "Adds awesome features",
  "main": "main.js",
  "renderer": "renderer.js",
  "styles": "styles.css",
  "permissions": ["webContents", "dom"],
  "settings": {
    "enabled": true,
    "color": "#ff0000"
  }
}
```

**Mod API:**
```javascript
// In renderer.js
module.exports = (api, settings) => {
  // api.dom - DOM manipulation helpers
  // api.storage - Persistent storage
  // api.notion - Notion API wrapper
  // settings - User settings for this mod

  api.dom.onReady(() => {
    // Mod initialization
  });
};
```

**Security Considerations:**
- Sandbox mod execution
- Permission system
- Code signing for verified mods
- User confirmation for first-time mods

---

## Recommended Implementation Plan

### Phase 1: Basic CSS Injection (v1.6)

**Time:** 2-3 hours
**Priority:** High

1. Add CSS file loader to TabController
2. Create user CSS directory on first launch
3. Add "Custom CSS" option to logo menu → "Reload CSS"
4. Document CSS variables available in Notion

**Files to create:**
- `~/.config/Lotion/custom.css` (user-editable)

**Files to modify:**
- `src/main/controllers/TabController.js`
- `src/main/index.js` (add "Reload CSS" IPC handler)

### Phase 2: Built-in Tweaks Library (v1.6)

**Time:** 4-6 hours
**Priority:** Medium

1. Port popular notion-enhancer tweaks to Lotion
2. Create tweak toggle UI in logo menu
3. Store enabled tweaks in settings
4. Apply tweaks on page load

**Tweaks to implement first:**
- Hide '+ new' buttons
- Decrease side padding
- Smaller page icons
- Hide "Type '/' for commands"
- Center-aligned table headers

**Files to create:**
- `src/main/tweaks/` directory
- `src/main/tweaks/hide-new-buttons.css`
- `src/main/tweaks/decrease-padding.css`
- etc.

**UI:**
```
Lotion Logo Menu
├── About Lotion
├── ⭐ Star on GitHub
├── 👤 Follow @puneetsl
├── 📂 View Repository
├── ─────────────────
├── Tweaks ▸
│   ├── ☑ Hide '+ New' Buttons
│   ├── ☐ Decrease Side Padding
│   ├── ☑ Smaller Page Icons
│   └── ☐ Hide Type Hint
├── Toggle Spell Check
└── Reload Custom CSS
```

### Phase 3: Theme System (v1.7)

**Time:** 8-12 hours
**Priority:** Medium

1. Create theme manager class
2. Port 3-5 popular themes (Dracula, Nord, Gruvbox, etc.)
3. Create theme selection UI
4. Add theme preview
5. Support user-created themes

**Built-in themes to ship:**
- Dracula (dark)
- Nord (dark)
- Gruvbox (dark/light variants)
- Solarized (dark/light variants)
- Default (no modifications)

### Phase 4: JavaScript Injection (v1.8)

**Time:** 12-16 hours
**Priority:** Low

1. Add safe JavaScript injection API
2. Create user scripts directory
3. Sandbox execution
4. Permission system

**Use cases:**
- Custom keyboard shortcuts
- Enhanced search
- Database view customizations
- Page templates

### Phase 5: Full Mod System (v2.0+)

**Time:** 40-60 hours
**Priority:** Future

Only implement if there's strong community demand and resources for maintenance.

---

## Technical Implementation Details

### CSS Injection API

**Method 1: insertCSS (Recommended)**
```javascript
// In TabController.js
async injectCustomCSS() {
  const customCSSPath = path.join(app.getPath('userData'), 'custom.css');

  if (fs.existsSync(customCSSPath)) {
    const css = fs.readFileSync(customCSSPath, 'utf8');
    const key = await this.webContentsView.webContents.insertCSS(css);
    this.injectedCSSKey = key; // Save for later removal
    log.info(`Custom CSS injected for tab ${this.tabId}`);
  }
}

async removeCustomCSS() {
  if (this.injectedCSSKey) {
    await this.webContentsView.webContents.removeInsertedCSS(this.injectedCSSKey);
    this.injectedCSSKey = null;
  }
}

async reloadCustomCSS() {
  await this.removeCustomCSS();
  await this.injectCustomCSS();
}
```

**Method 2: executeJavaScript**
```javascript
// Alternative for more control
async injectCustomCSS() {
  const css = fs.readFileSync(customCSSPath, 'utf8');
  await this.webContentsView.webContents.executeJavaScript(`
    (function() {
      const style = document.createElement('style');
      style.id = 'lotion-custom-css';
      style.textContent = ${JSON.stringify(css)};
      document.head.appendChild(style);
    })();
  `);
}
```

### Notion CSS Variables Reference

Based on notion-enhancer documentation, Notion uses these CSS variables:

```css
/* Background colors */
--theme--bg: main background
--theme--fg: foreground/content area

/* Text colors */
--theme--text: primary text
--theme--text_ui: UI text (less prominent)
--theme--text_ui_info: info text

/* Interactive elements */
--theme--interactive: buttons, links
--theme--interactive_hover: hover state

/* Borders & dividers */
--theme--divider: lines between elements

/* Specific elements */
--theme--sidebar: sidebar background
--theme--code: code blocks
--theme--code_inline: inline code
```

**To find current variables:**
```javascript
// Run in DevTools console on Notion page
Object.entries(getComputedStyle(document.documentElement))
  .filter(([k, v]) => k.startsWith('--'))
  .forEach(([k, v]) => console.log(k, ':', v));
```

### Tweak Implementation Example

**Hide '+ New' Buttons:**
```css
/* hide-new-buttons.css */
div[class*="addNew"],
div[class*="addRow"],
button[class*="addRow"] {
  display: none !important;
}
```

**Decrease Side Padding:**
```css
/* decrease-padding.css */
.notion-board-view {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.notion-table-view {
  padding-left: 8px !important;
  padding-right: 8px !important;
}
```

### Theme Implementation Example

**Dracula Theme:**
```css
/* themes/dracula/theme.css */
:root.dark {
  /* Background */
  --theme--bg: #282a36;
  --theme--fg: #44475a;

  /* Text */
  --theme--text: #f8f8f2;
  --theme--text_ui: #6272a4;
  --theme--text_ui_info: #8be9fd;

  /* Accent colors */
  --theme--interactive: #bd93f9;
  --theme--interactive_hover: #ff79c6;

  /* Syntax highlighting */
  --theme--code: #44475a;
  --theme--code_inline: #50fa7b;

  /* Borders */
  --theme--divider: #6272a4;
}

/* Additional specific overrides */
.notion-sidebar {
  background: #21222c !important;
}

.notion-topbar {
  background: #21222c !important;
  border-bottom: 1px solid #6272a4 !important;
}
```

---

## User Documentation

### For End Users

**How to add custom CSS:**

1. Navigate to Lotion's config directory:
   - Linux: `~/.config/Lotion/`
   - macOS: `~/Library/Application Support/Lotion/`
   - Windows: `%APPDATA%\Lotion\`

2. Create a file named `custom.css`

3. Add your CSS rules:
   ```css
   /* Hide the + New button */
   div[class*="addNew"] {
     display: none !important;
   }
   ```

4. Click Lotion logo → "Reload Custom CSS" (or restart app)

**How to use themes:**

1. Download theme files to `~/.config/Lotion/themes/theme-name/`
2. Click Lotion logo → "Themes"
3. Select your preferred theme
4. Theme applies immediately

### For Theme Creators

**Creating a theme:**

1. Create directory: `~/.config/Lotion/themes/my-theme/`

2. Create `theme.json`:
   ```json
   {
     "name": "My Awesome Theme",
     "author": "Your Name",
     "version": "1.0.0",
     "description": "A cool theme",
     "mode": "dark"
   }
   ```

3. Create `theme.css` with your styles

4. (Optional) Add `preview.png` for theme gallery

5. Share on GitHub or Lotion community!

---

## Security Considerations

### For CSS Injection
- **Low risk** - CSS cannot execute code
- **Medium risk** - CSS can hide sensitive information
- **Mitigation:** User must manually create/edit CSS file

### For JavaScript Injection
- **High risk** - JS can execute arbitrary code
- **Mitigation strategies:**
  1. Sandboxed execution context
  2. Permission system (like browser extensions)
  3. Code signing for verified mods
  4. User consent before first execution
  5. Limit API surface (no file system access by default)

### For Theme System
- **Low risk** - Themes are just CSS
- **Mitigation:** Scan for suspicious patterns before applying

---

## Community Integration

### Theme/Tweak Repository

Create a curated repository of themes and tweaks:
- `github.com/puneetsl/lotion-themes`
- Community can submit via PR
- Automated testing for safety
- Gallery website for browsing

### In-App Theme Browser (Future)

- Browse themes without leaving app
- One-click install
- Automatic updates
- Ratings and reviews

---

## Migration from Notion-Enhancer

For users coming from notion-enhancer:

**What's compatible:**
- CSS-only themes (with minor adjustments)
- CSS tweaks (most should work as-is)
- Color palette customizations

**What's not compatible:**
- JavaScript mods (need rewriting for Lotion API)
- Themes that depend on enhancer-specific classes
- Mods that modify the Electron wrapper directly

**Migration guide:**
1. Copy your CSS from notion-enhancer
2. Paste into `~/.config/Lotion/custom.css`
3. Test and adjust selectors if needed
4. Share updated version with community!

---

## Next Steps

1. **Get user feedback** on implementation priority
2. **Start with Phase 1** (basic CSS injection) for v1.6
3. **Port popular tweaks** from notion-enhancer
4. **Create 2-3 built-in themes** as examples
5. **Document API** for community contributors
6. **Launch community repository** for sharing

---

## Resources

- **Notion-Enhancer GitHub:** https://github.com/notion-enhancer/notion-enhancer (archived)
- **Tweaks Repository:** https://github.com/notion-enhancer/tweaks (archived)
- **Notion CSS Variables:** Can be inspected via browser DevTools
- **Community Themes:** Available on userstyles.org

---

**Last Updated:** October 27, 2025
**Status:** Ready for implementation - Phase 1
**Next Review:** After user feedback on approach
