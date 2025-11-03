# Changelog

All notable changes to CSS Gnommé extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.5.4] - 2025-11-03

### Added

- **Dynamic Shadow-Strength**: Real-time shadow calculation with adjustable strength (0.0-1.0), 233% visual range
- **Manual Icon Theme Override**: Independent icon theme selection with auto-detect fallback
- **Improved Accent Detection**: Smart validation prevents white/grey/black colors as accents (ZorinGrey fix)
- **Panel Color Intelligence**: 4-tier hierarchy (user override → theme panel → theme accent → system default)

### Fixed

- **ZorinGrey White Switch Bug**: Dual-mode themes no longer detect white as accent color
- **Neutral Theme Fallbacks**: Proper grey fallback colors instead of red/purple artifacts
- **Icon Theme Restoration**: Correctly restores actual icon theme (not GTK theme name)
- **Fluent Theme Colors**: Panel shows proper theme accent when override disabled

### Changed

- **Advanced Settings UI**: Reorganized with Zorin Integration moved from Theme Overlay page
- **Icon Theme Dropdown**: Consistent ComboRow design matching Base Theme selector
- **Cleaner Preferences**: Removed verbose descriptions from automation features

---

## [1.5.3] - 2025-11-01

### Fixed

- **Theme Dropdown Restore Bug**: Changing theme in dropdown now correctly restores to new theme (not old one)
- **Root Cause**: Stale `index.theme` metadata preserved from previous overlay
- **Solution**: Delete overlay directory before recreate (v2.5.1 backport pattern)

---

## [1.5.0] - 2025-10-25

### Added

- **Zorin Tint Removal System**: Adjust tint strength (0-100%) for more neutral appearance
- **Auto-update on Slider Change**: Tint adjustments apply instantly (2s debounce, no manual recreate)
- **Base-theme Cache Optimization**: Persistent cache with tintStrength in key for instant adjustments
- **Fluent GTK Theme Support**: Improved compatibility with Fluent GTK themes
- **Quick Settings Gradient Fix**: Removed unwanted Zorin accent gradient on third-party Shell themes

### Changed

- **95% performance improvement** for Shell theme reloads (154ms vs 3000ms+)
- Preferences UI reorganized for better clarity
- Main.loadTheme() API integration (official GNOME Shell pattern)

### Fixed

- Zorin intellihide management (floating panel now works reliably)
- Symlinking of gtk-3|4 assets (checkbox/radio icons in Fluent themes)
- Memory leak prevention for GNOME 43-44
- Race conditions in overlay updates

---

## [1.4] - 2025-10-19

### Fixed

- Fixed system tray popup menu alignment (now centered above icon)
- Improved memory management during overlay operations
- Enhanced theme recreation to properly preserve original themes

### Changed

- Code quality improvements (internal refactoring)
- Better state management for floating panel integration

---

## [1.3] - 2025-10-18

### Added

- **Floating Panel Effect**: Automatic Zorin intellihide management when border-radius is applied
- Native Zorin integration for floating panel (no custom CSS hacks)
- Original intellihide state preservation and restoration

### Changed

- Improved UI preferences subtitle for Zorin integration section

---

## [1.2] - 2025-10-15

### Added

- **Persistent Wallpaper Color Cache**: Cross-session persistence for analyzed wallpaper colors
- Cache survives extension disable and system reboot
- JSON-based storage in `~/.cache/cssgnomme/wallpaper-colors.json`
- Debounced cache saves (30 seconds) to prevent excessive disk I/O

### Changed

- **280x speedup** for cached wallpaper color extraction (cache hit)
- Improved startup performance with persistent cache loading
- Reduced CPU usage for wallpaper analysis

### Fixed

- Cache now persists across sessions (previously in-memory only)

---

## [1.1] - 2025-10-10

### Added

- **Dual-Tier CSS Caching**: Base theme cache + component CSS cache
- **LRU Memory Protection**: All caches protected against unbounded growth
- Comprehensive performance logging for cache operations

### Changed

- **240x speedup** for component CSS generation on cache hit
- **50-70% cache hit rate** in real-world usage
- Memory overhead capped at ~6.2MB maximum

### Fixed

- Eliminated unbounded cache growth risk
- Improved memory safety with LRU eviction

---

## [1.0] - 2025-10-01

### Added - Initial Release

- **Dynamic Theme Overlay System**: Non-destructive GTK theme overlays in `~/.themes/CSSGnomme/`
- **Automatic Wallpaper Color Extraction**: K-means clustering for dominant/accent color detection
- **Light/Dark Mode Support**: Automatic theme filtering and color scheme switching
- **Advanced Blur Effects**: Full backdrop-filter control (radius, saturation, contrast, brightness)
- **Custom Transparency**: Separate opacity controls for panel and popup menus
- **Zorin OS Integration**: Special Zorin Taskbar enhancements and styling
- **Border Customization**: Configurable border-radius, color, width, and opacity
- **Shadow Effects**: Custom shadow color and strength adjustment
- **Live CSS Updates**: Debounced overlay updates with smooth transitions
- **Theme Preservation**: Automatic restoration of original themes on disable
- **System Tray Menu**: Quick access to color extraction and preferences
- **Internationalization**: Support for English, Croatian

### Features

- Wallpaper color cache (in-memory, 100 entries)
- Smart theme dropdown filtering by color-scheme
- Fluent GTK theme enhancements (conditional)
- Full preferences dialog with Adwaita widgets
- Comprehensive error handling and logging
- Memory leak prevention patterns (GNOME 43-44 specific)

---

## Release Notes

### Version Numbering

Starting with v1.4, version numbers follow semantic versioning:

- **Major**: Breaking changes or significant feature additions
- **Minor**: New features, improvements
- **Patch**: Bug fixes only

### Upgrade Path

All versions are backward compatible within the 1.x series. Settings are preserved across updates.

### Platform Support

- **Supported**: GNOME Shell 43, 44 (Tested on Zorin OS 17.3 Core)
- **Not Supported**: GNOME 45+ (different API - see separate version)

---

## Known Issues Summary

For detailed issues and workarounds, see [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

**Critical:**
- GNOME Shell 43.9 wallpaper memory leak (external bug, not fixable)
- Dark/light theme toggle memory amplification (external bug)

**Minor:**
- GdkPixbuf minor memory residual (~0.1-0.2MB per wallpaper analysis)

---

## Links

- **Repository**: [GitHub - CSSGnomme-ZorinOS17](https://github.com/drdrummie/CSSGnomme-ZorinOS17)
- **Bug Reports**: [GitHub Issues](https://github.com/drdrummie/CSSGnomme-ZorinOS17/issues)
- **GNOME Extensions**: [extensions.gnome.org](https://extensions.gnome.org/)
