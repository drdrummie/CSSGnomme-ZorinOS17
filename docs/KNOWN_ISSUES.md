# Known Issues & Limitations

This document lists known issues, limitations, and workarounds for CSS Gnommé extension.

**Last Updated:** October 20, 2025
**Version:** 1.4
**Platform:** GNOME Shell 43-44 (Zorin OS 17.3+)

---

## 🔴 Critical Platform Limitations

### Issue 1: Wallpaper Memory Leak (GNOME Shell Bug)

**Status:** 🔴 **External Bug** - Not fixable in extension
**Severity:** HIGH
**Affected Versions:** GNOME Shell 43.9 (Zorin OS 17.3)

**Problem:**
GNOME Shell 43.9 fails to properly dispose wallpaper textures, causing **20-70MB memory leak per wallpaper change**. This is a known GNOME Shell bug that was fixed in GNOME 44+, but Zorin OS 17.3 uses GNOME 43.9.

**Impact:**
- Memory usage increases with each wallpaper change
- System may become unstable after multiple (>10) wallpaper switches
- Can lead to performance degradation or system freeze

**Workarounds:**
1. **Avoid frequent wallpaper changes** - Stick to one wallpaper per session
2. **Disable auto-color extraction** if you frequently change wallpapers:
   ```bash
   gsettings set org.gnome.shell.extensions.cssgnomme auto-color-extraction false
   ```
3. **Restart GNOME Shell periodically** to clear memory:
   - Press `Alt+F2`, type `r`, press Enter (X11 only)
   - On Wayland: Log out and log back in
4. **Consider upgrading** to a distribution with GNOME 44+ (if available)

**Note:** This leak occurs even without CSS Gnommé installed. The extension follows best practices (stream-based loading, explicit disposal, manual GC triggers) but cannot fix the underlying Shell bug.

---

### Issue 2: Dark/Light Theme Toggle Memory Impact

**Status:** 🔴 **External Bug** - Not fixable in extension
**Severity:** MEDIUM
**Affected Versions:** GNOME Shell 43.9

**Problem:**
GNOME Shell 43.9 fails to cleanup CSS objects when switching the system `color-scheme` preference. When combined with wallpaper changes, this creates **50-120MB leak per cycle**.

**Impact:**
- Dark/light theme toggles amplify memory usage
- System becomes less responsive after 2-3 toggles
- Compound effect with wallpaper changes

**Workarounds:**
1. **Choose one theme mode** and stick to it (light OR dark, not both)
2. **Minimize theme toggles** - plan your preference ahead
3. **Restart GNOME Shell** after toggling themes:
   - Press `Alt+F2`, type `r`, press Enter (X11 only)
4. **Disable auto-switch-color-scheme** if experiencing issues

**Note:** CSS Gnommé's overlay recreation is clean (~1-2MB per toggle). The leak is in GNOME Shell's CSS cache management.

---

## ⚠️ Minor Known Issues

### Issue 3: GdkPixbuf Memory Residual

**Status:** ⚠️ **Library Limitation** - Partially mitigated
**Severity:** LOW
**Impact:** ~0.1-0.2MB residual memory per wallpaper analysis

**Problem:**
GdkPixbuf library has known memory leak issues in GNOME Shell context. Even with explicit disposal and garbage collection, small amounts of memory persist.

**Mitigation Applied:**
- Stream-based image loading (not file-based)
- Explicit `run_dispose()` + garbage collection
- Minimizes residual to acceptable levels

**Impact:**
Negligible in practice. After 50 wallpaper analyses, residual is ~5-10MB.

---

### Issue 4: Shell CSS Reload Performance

**Status:** ℹ️ **Platform Limitation** - Cannot be optimized
**Severity:** LOW
**Impact:** ~3.9 seconds delay when updating theme CSS

**Problem:**
When CSS Gnommé updates the theme overlay, GNOME Shell must reload all CSS files. This reload process takes ~3.9 seconds on average hardware and is handled entirely by GNOME Shell's internal CSS loader.

**Impact:**
- Settings changes have ~4 second delay before visual update
- Most noticeable when adjusting sliders (opacity, blur)
- Does not affect system stability, only perceived responsiveness

**Mitigation:**
- Extension debounces updates (2 second delay) to batch multiple changes
- This reduces the number of expensive CSS reloads
- 95% of update time is in GNOME Shell, only 5% in extension code

**Note:** This is normal GNOME Shell behavior and cannot be improved by the extension.

---

## 🛠️ Troubleshooting

### UI Not Updating After Settings Change

**Symptoms:**
- Changed opacity/blur/colors but UI looks the same
- Theme doesn't reflect new settings

**Solutions:**
1. **Wait 2 seconds** - Extension debounces updates
2. **Check overlay is enabled** - Toggle "Enable Overlay Theme" in preferences
3. **Verify theme is active**:
   ```bash
   gsettings get org.gnome.desktop.interface gtk-theme
   # Should return: 'CSSGnomme'
   ```
4. **Restart GNOME Shell** (X11):
   - Press `Alt+F2`, type `r`, press Enter
5. **Check logs** for errors:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell | grep -i cssgnomme
   ```

---

### Color Extraction Returns Gray/Unsaturated Colors

**Symptoms:**
- Extracted colors are too gray/desaturated
- Colors don't match wallpaper appearance

**Causes:**
- Wallpaper is too desaturated (low color variety)
- Brightness thresholds filter out colorful pixels
- Wrong light/dark mode detection

**Solutions:**
1. **Use wallpapers with vibrant colors** for best results
2. **Toggle color-scheme** if results improve:
   ```bash
   # Try opposite mode
   gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
   # or
   gsettings set org.gnome.desktop.interface color-scheme 'default'
   ```
3. **Manual color override** - Set colors manually in preferences instead of extraction

---

### Theme Dropdown Empty in Preferences

**Symptoms:**
- Theme selection dropdown shows no themes or very few

**Cause:**
- "Auto-switch color-scheme" is enabled and filtering themes

**Solution:**
1. **Disable auto-switch-color-scheme** to show all themes:
   - Open preferences
   - Find "Auto-switch color-scheme" toggle
   - Disable it to see all installed GTK themes
2. **Install more themes** matching your current color-scheme (light/dark)

---

### Extension Crashes or Disappears

**Symptoms:**
- Extension disappears from system tray
- Settings don't open
- GNOME Shell logs show errors

**Solutions:**
1. **Check extension is enabled**:
   ```bash
   gnome-extensions list
   gnome-extensions enable cssgnomme@dr.drummie
   ```
2. **Restart GNOME Shell** (X11):
   - Press `Alt+F2`, type `r`, press Enter
3. **Check for conflicts** with other extensions:
   - Disable other theme/transparency extensions
   - Test with only CSS Gnommé enabled
4. **Reinstall extension**:
   ```bash
   gnome-extensions uninstall cssgnomme@dr.drummie
   # Then reinstall from Extensions website or manual zip
   ```
5. **Report bug** with logs:
   ```bash
   journalctl -b -o cat /usr/bin/gnome-shell | grep -A 10 -B 10 -i cssgnomme > cssgnomme-error.log
   ```
   Submit log to [GitHub Issues](https://github.com/drdrummie/CSSGnomme-ZorinOS17/issues)

---

## 💡 Performance Tips

### Optimize Memory Usage
- Disable auto-color extraction if you don't change wallpapers often
- Stick to one color-scheme (light OR dark)
- Restart GNOME Shell weekly to clear accumulated memory

### Improve Responsiveness
- Use moderate blur radius (10-20px) instead of maximum
- Reduce number of theme switches per session
- Enable persistent cache (enabled by default in v1.2+)

### Best Visual Quality
- Use wallpapers with vibrant, saturated colors for extraction
- Match border-radius across all elements for cohesive look
- Adjust saturation multiplier for desired appearance (0.4-2.0)

---

## 🔗 Support

**Bug Reports:** [GitHub Issues](https://github.com/drdrummie/CSSGnomme-ZorinOS17/issues)
**Repository:** [CSSGnomme-ZorinOS17](https://github.com/drdrummie/CSSGnomme-ZorinOS17)

When reporting issues, please include:
- GNOME Shell version (`gnome-shell --version`)
- Extension version (from preferences or `gnome-extensions info cssgnomme@dr.drummie`)
- Steps to reproduce the issue
- Relevant logs (see troubleshooting section above)
- Screenshots if UI-related

---

**Note:** Many of these issues are external to the extension (GNOME Shell bugs) and will be resolved when Zorin OS updates to GNOME 44+. The extension implements all recommended best practices and workarounds for the current platform.
