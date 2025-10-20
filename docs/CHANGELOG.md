# Changelog

All notable changes to CSS Gnommé extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
- **Internationalization**: Support for English, Croatian, German, Spanish, French

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
- **Supported**: GNOME Shell 43, 44 (Zorin OS 17.3, Ubuntu 22.04+, Fedora 38)
- **Not Supported**: GNOME 45+ (different API - see separate branch if available)

---

## Known Issues Summary

For detailed issues and workarounds, see [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

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
