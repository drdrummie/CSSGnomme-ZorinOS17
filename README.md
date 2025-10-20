# CSS Gnommé - Dynamic Theme Overlay for GNOME Shell

**CSS Gnommé** is a GNOME Shell extension for **GNOME 43-44** (Zorin OS 17.3) that creates dynamic theme overlays with automatic wallpaper color extraction, advanced blur effects, and customizable transparency. Enhance your desktop appearance without modifying original theme files - everything is completely reversible.

![CSS Gnommé Logo](screenshot.png)

---

## ✨ Features

### 🎨 **Automatic Wallpaper Color Extraction**
- **Smart Analysis**: Automatically extracts dominant and accent colors from your desktop background using advanced K-means clustering algorithm
- **Intelligent Application**: Applies extracted colors to panel backgrounds, popup menus, and accent borders
- **Light/Dark Detection**: Automatically adjusts color intensity based on your theme brightness
- **Manual Control**: Extract colors on-demand with one click from the system tray menu

### 🔄 **Dynamic Theme Overlay System**
- **Non-Destructive**: Creates a custom theme overlay in `~/.themes/CSSGnomme/` that inherits from your current GTK theme
- **Live Updates**: Automatically updates CSS when settings (may flicker because css needs to reload)
- **One-Click Toggle**: Enable/disable the overlay system without losing your configuration
- **Theme Preservation**: Automatically restores your original theme when disabling the overlay

### 🌫️ **Advanced Blur Effects**
- **Full Backdrop Control**: Adjust blur radius (1-50px), saturation, contrast, and brightness independently
- **Custom Tinting**: Apply semi-transparent color overlays for unique glass effects
- **Border Customization**: Define border color, width (0-5px), and opacity for framed appearance
- **Universal Application**: Blur effects apply to popup menus, Alt+Tab switcher, and other shell elements

### 🖥️ **Zorin OS Integration**
- **Taskbar Enhancement**: Special integration with Zorin Taskbar for consistent styling and Zorin's "inegrated" features
- **Floating Panel Effect**: Automatically enables floating panel effect when border-radius is applied (Zorin intellihide option)
- **Tint Control**: Removes Zorin theme color tint intensity (with various success)
- **Shell Component Styling**: Enhanced visual consistency across panels, menus, and system UI

### 🎛️ **Customizable Transparency**
- **Panel Opacity**: Control main taskbar/panel transparency (10-100%)
- **Menu Opacity**: Separate opacity control for popup menus (10-100%)
- **Color Overrides**: Manually set panel and popup background colors with full RGBA support
- **Border Radius**: Auto-detect or manually set rounded corners (0-25px)

---

## 📥 Installation

### Option 1: GNOME Extensions Website (Recommended)
1. Visit [GNOME Extensions](https://extensions.gnome.org/)
2. Search for "CSS Gnommé"
3. Click the toggle switch to install
4. Enable in GNOME Extensions app

### Option 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/drdrummie/CSSGnomme-ZorinOS17/releases)
2. Extract the archive:
   ```bash
   unzip cssgnomme@dr.drummie.zip -d ~/.local/share/gnome-shell/extensions/cssgnomme@dr.drummie/
   ```
3. Restart GNOME Shell:
   - **X11**: Press `Alt+F2`, type `r`, press Enter
   - **Wayland**: Log out and log back in
4. Enable the extension:
   ```bash
   gnome-extensions enable cssgnomme@dr.drummie
   ```

### Option 3: Build from Source
```bash
git clone https://github.com/drdrummie/CSSGnomme-ZorinOS17.git
cd CSSGnomme-ZorinOS17
make install
```

Then restart GNOME Shell and enable the extension.

---

## 🎯 Usage

### Getting Started

1. **Enable the Extension**: Use GNOME Extensions app or the system tray icon
2. **Open Preferences**: Click the system tray icon → "Open Settings"
3. **Choose Base Theme**: Select your preferred GTK theme from the dropdown
4. **Enable Overlay**: Toggle "Enable Overlay Theme" to activate
5. **Customize**: Adjust transparency, blur effects, and colors to your liking
6. **Disable notifications**: If too distracting for your taste

### Quick Actions (System Tray Menu)

- **Extract Colors from Wallpaper**: One-click color extraction
- **Enable/Disable Overlay**: Quick toggle without opening preferences
- **Open Settings**: Open full settings dialog

### Recommended Settings

**For Glass Effect:**
- Panel Opacity: 70-85%
- Blur Radius: 15-25px
- Saturation: 1.2-1.4
- Enable border for definition

**For Clean Minimal Look:**
- Panel Opacity: 100% or very low (10-20%)
- Blur Radius: 0px (disable)
- Border Radius: 0px (flat corners)
- Disable color extraction

**For Wallpaper-Driven Theme:**
- Enable "Auto Color Extraction"
- Enable "Override Panel Color"
- Enable "Override Popup Color" (optionally)
- Set transparency, border-radius
- Adjust blur to taste (play with border and other settings)
- **Experimental** - Full wallpaper autodriven mode

**Border radius = 0:**
- Deeply shadowed backgrounds of shell elements 

---

## 🔧 Configuration

Access preferences via:
- System tray icon → "Preferences"
- GNOME Extensions app → CSS Gnommé → Settings icon
- Command line: `gnome-extensions prefs cssgnomme@dr.drummie`

### Main Settings

**Theme Overlay:**
- Enable/disable overlay system
- Choose base GTK theme
- Auto-switch between light/dark themes

**Color Extraction:**
- Auto-extract on wallpaper change
- Manual extraction trigger
- Override panel/popup colors

**Transparency:**
- Panel opacity (10-100%)
- Popup menu opacity (10-100%)

**Blur Effects:**
- Blur radius (0-50px)
- Saturation multiplier (0.4-2.0)
- Contrast multiplier (0.4-2.0)
- Brightness multiplier (0.4-2.0)
- Blur tint color

**Borders & Styling:**
- Border radius (0-25px)
- Border color and opacity
- Border width (0-5px)
- Shadow color and strength

**Zorin Integration:**
- Enable Zorin taskbar enhancements
- Taskbar opacity control
- Theme tint adjustment (decreased where possible)

---

## 🖼️ Screenshots

**Additional Screenshots:**
- [Border Effects](docs/screenshot-border-menu.png)
- [Quick Settings](docs/screenshot-border-quicksettings.png)
- [More examples in docs/](docs/)

---

## 🔄 Compatibility

**Supported GNOME Shell Versions:**
- GNOME 43 (Zorin OS 17.3)
- GNOME 44

**Tested On:**
- Zorin OS 17.3 Core (Primary target)

**Not Compatible With:**
- GNOME 45+ (breaking API changes - see GNOME 46 branch if available)
- GNOME 42 and earlier (missing required APIs)

---

## 🐛 Known Issues

See [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) for detailed list of limitations and workarounds.

**Quick Summary:**
- **Wallpaper Memory Leak**: GNOME Shell 43.9 has a memory leak with wallpaper changes (external bug). Avoid frequent wallpaper switching.
- **Dark/Light Toggle Performance**: Multiple theme toggles can impact performance. Restart GNOME Shell if needed.
- **GdkPixbuf Memory**: Minor memory residual after color extraction (~0.1-0.2MB per wallpaper).
- **Could affect apps too but it can be adjusted (i.e. remove transparency and / or choose wanted color manually)**

---

## 📝 Changelog

See [CHANGELOG.md](docs/CHANGELOG.md) for version history and release notes.

**Latest Version: 1.4** (October 2025)
- Code quality improvements (duplicate removal)
- UI alignment fixes (system tray popup)
- Improved floating panel integration
- Enhanced memory management

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Reporting Bugs

Please report bugs via [GitHub Issues](https://github.com/drdrummie/CSSGnomme-ZorinOS17/issues).

Include:
- GNOME Shell version (`gnome-shell --version`)
- Extension version
- Steps to reproduce
- Relevant logs (`journalctl -f -o cat /usr/bin/gnome-shell`)

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** - see [LICENSE](LICENSE) for details.

---

## 👤 Author

**dr.drummie**

- GitHub: [@drdrummie](https://github.com/drdrummie)
- Repository: [CSSGnomme-ZorinOS17](https://github.com/drdrummie/CSSGnomme-ZorinOS17)

---

## 🙏 Acknowledgments

- GNOME Shell team for the extension API
- Zorin OS team for the excellent desktop environment
- CSS Panels (Cinnamon Mint) and Open Bar extensions for inspiration

---

## 💡 Tips & Tricks

**Best Performance:**
- Disable auto-color extraction if you don't change wallpapers often
- Set your desired "style"
- Use moderate blur radius (10-20px) for best balance

**Visual Consistency:**
- Match border-radius across all elements for cohesive look
- Use extracted colors for best integration with wallpaper
- Adjust saturation for more vibrant or muted appearance

**Troubleshooting:**
- If UI doesn't update: Restart GNOME Shell (`Alt+F2` → `r` on X11)
- If colors look wrong: Re-extract from wallpaper
- If performance issues: Reduce blur radius or disable blur

---

**Enjoy your customized GNOME Shell experience!** ✨
