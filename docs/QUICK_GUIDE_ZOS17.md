# 🚀 CSS Gnomme Quick Guide (ZorinOS 17)

**Version:** v1.5.4 (GNOME 43-44)
**Last Updated:** November 3, 2025

---

## 📖 What is CSS Gnomme?

CSS Gnomme is a powerful GNOME Shell extension that creates a **dynamic overlay theme** on top of your existing GTK theme. It automatically extracts colors from your wallpaper, applies custom transparency and blur effects, and enhances your desktop appearance—all **completely reversible** without modifying your original themes.

**Key Features:**

- 🔄 **Dynamic theme overlay** that adapts to your background
- 🎨 **Automatic color extraction** from your wallpaper
- 🌫️ **Advanced blur effects** for panels and menus
- 🖥️ **Zorin OS integration** for seamless taskbar styling
- ⚡ **Live updates** when you change settings

---

## ⚙️ Settings Overview

Access settings by clicking the **CSS Gnomme icon** in your system tray → **"Open Settings"**

### 🎨 Page 1: Theme Overlay

**This is where you enable CSS Gnomme and choose your base theme.**

#### Theme Integration

- **Enable Overlay Theme**: Master switch to activate the entire CSS Gnomme system
  - ✅ ON: CSS Gnomme creates overlay theme and applies your customizations
  - ❌ OFF: System reverts to your original theme (all settings preserved)

- **Base Theme**: The GTK theme CSS Gnomme uses as foundation
  - Select from installed themes in `~/.themes/` or `/usr/share/themes/`
  - CSS Gnomme will inherit this theme's styling and apply your customizations on top
  - **Tip:** Use Fluent-based themes (ZorinBlue, ZorinPurple) for best results on Zorin OS

- **Auto-detect theme border radius**: Automatically match your theme's rounded corners
  - ✅ ON: CSS Gnomme detects border-radius from active theme
  - ❌ OFF: Use manual Border Radius slider in Color Settings

#### Automatic Color Extraction

- **Auto-detect colors on wallpaper change**: Automatically extract and apply colors when you change your background
  - **How it works:** Monitors wallpaper changes via GNOME settings
  - Extracts dominant colors using K-means clustering
  - Applies colors to panel, menus, and borders within 2 seconds

- **Extract Colors Now**: Manual trigger button
  - Use this after changing wallpaper if auto-extraction is disabled
  - Or to force re-extraction if colors don't look right

#### Manual Controls

- **Apply Changes Now**: Force immediate update (bypasses 2-second auto-update delay)
  - Use when adjusting multiple settings and want instant preview

- **Recreate Overlay Theme**: Rebuild entire overlay from scratch
  - **When to use:** If theme looks broken or settings aren't applying
  - Deletes and regenerates `~/.themes/CSSGnomme/`

---

### 🎨 Page 2: Color Settings

**Fine-tune transparency, colors, and panel appearance.**

#### Basic Transparency Controls

- **Panel Opacity** (10-100%): Taskbar/panel transparency
  - **10%**: Nearly transparent (minimal visibility)
  - **50%**: Half transparent (balanced)
  - **100%**: Fully opaque (solid panel)
  - **Recommended:** 70-90% for subtle transparency

- **Menu Opacity** (10-100%): Popup menu transparency
  - Controls application menus, system menus, and dropdown panels
  - **Tip:** Keep this higher than panel (85-95%) for readability

- **Tint strength** (0-100%): Zorin theme tint neutralization
  - **0%**: Completely neutral (gray/beige base colors)
  - **50%**: Half neutralized (subtle theme colors remain)
  - **100%**: Original Zorin theme colors (blue, green, purple, etc.)
  - **Use case:** Create neutral base while keeping wallpaper-driven accents

#### Panel Appearance

- **Enable bordered floating mode**: Control whether panel itself gets rounded
  - ✅ ON: Panel has rounded corners (enables Zorin floating panel effect by turning intellihide on)
  - ❌ OFF: Only menus/popups are rounded
  - **Note**: Zorin uses inline CSS so currently extension cannot control panel's border-radius

- **Override panel color**: Use custom color instead of extracted wallpaper color
  - Enable to manually choose panel background color
  - Useful if extracted color doesn't match your preference

- **Choose override panel color**: RGBA color picker
  - Full control over panel background (supports transparency via alpha channel)
  - Only active when "Override panel color" is enabled

- **Override popup color**: Separate color override for menus/popups
  - Recommended to keep similar to panel color for consistency

- **Choose override popup color**: RGBA picker for menu backgrounds
  - Full control over popup background (supports transparency via alpha channel)
  - Only active when "Override popup color" is enabled

- **Border Radius** (0-25px): Roundness of panel corners
  - **0px**: Square corners (flat design)
  - **8-12px**: Moderately rounded (modern)
  - **15-25px**: Heavily rounded (macOS-style)

---

### 🌫️ Page 3: Blur Effects

**Create frosted glass effects for panels and menus.**

#### Custom Blur Settings

- **Blur radius** (1-50px): Intensity of blur effect
  - **10-20px**: Subtle, elegant blur
  - **30-40px**: Noticeable frosted glass effect
  - **Higher values:** More diffused, fog-like appearance

- **Saturation multiplier** (0.4-2.0): Color vibrancy in blurred background
  - **< 1.0**: Desaturated, muted colors
  - **1.0**: Natural colors
  - **> 1.0**: Enhanced, vivid colors
  - **Recommended:** 1.1-1.3 for vibrant frosted glass

- **Contrast multiplier** (0.4-2.0): Difference between light/dark areas
  - **< 1.0**: Softer, low-contrast blur
  - **1.0**: Natural contrast
  - **> 1.0**: Sharp, high-contrast edges
  - **Recommended:** 0.9-1.1 for natural appearance

- **Brightness multiplier** (0.4-2.0): Overall lightness of blur effect
  - **< 1.0**: Darker, dimmed background
  - **1.0**: Natural brightness
  - **> 1.0**: Brighter, illuminated effect
  - **Tip:** Use 1.1-1.3 for light themes, 0.8-0.9 for dark themes

- **Background color/tint**: Semi-transparent overlay color applied over blur
  - Automatically set to neutral white (light themes) or black (dark themes)
  - Customize for unique glass effects (e.g., blue tint for cool tones)

- **Border color**: Color of subtle border framing blurred elements
  - Automatically extracted from wallpaper accent color
  - Provides definition and polish to blur effect

- **Border width** (0-5px): Thickness of border
  - **0px**: No border (deep shadow styling mode)
  - **1-2px**: Subtle definition (recommended)
  - **3-5px**: Prominent frame

- **Blur opacity** (0.0-1.0): Transparency of entire blur layer
  - **0.0**: Blur disabled (no effect)
  - **0.3-0.6**: Light, ethereal appearance
  - **0.8-1.0**: Prominent, solid glass effect

#### Shadow Effects

- **Shadow strength** (0.0-1.0): Intensity of drop shadow (**NEW in v1.5.4: dynamic calculation**)
  - **0.0**: No shadow
  - **0.3-0.5**: Subtle depth
  - **1.0**: Strong, dramatic shadow (30px spread)
  - **Formula:** `baseShadow = shadowStrength × 30px` with dynamic ratios:
    - Panel: 1.0× (full shadow)
    - Popup: 0.67× (lighter)
    - Buttons: 0.67× (matching popups)
    - Inset: 1.25× (stronger depth)

- **Shadow color**: Color of drop shadow
  - Automatically set based on theme (dark shadow for light themes, vice versa)
  - Customize for specific aesthetic (e.g., colored shadows)

---

### ⚙️ Page 4: Advanced Settings

**Power-user settings, Zorin integration, icon theme override, automation, and debugging.**

#### Interface Behavior

- **Hide system tray indicator**: Remove CSS Gnomme icon from top panel
  - Settings still accessible via Extensions app
  - **Use case:** Minimize clutter after setup is complete

- **Enable notifications**: Show desktop notifications for theme changes
  - ✅ ON: Notifications for color extraction, theme switches, errors
  - ❌ OFF: Silent operation (recommended after initial setup)

- **Enable Zorin OS Integration**: Special enhancements for Zorin Taskbar (**MOVED from Theme Overlay page**)
  - Enables floating panel effect when border-radius is applied
  - Adds Zorin-specific styling improvements
  - For Fluent GTK themes, adds Zorin-style CSS enhancements
  - **Recommended:** Enable if you're using Zorin OS 17

#### Icon Theme Override (**NEW in v1.5.4**)

- **Manual icon theme selection**: Override default icon theme with custom choice
  - ✅ ON: Manually select icon theme from dropdown
  - ❌ OFF: Auto-detect icon theme from source GTK theme (default)

- **Select icon theme**: Dropdown with all installed icon themes
  - Scans `/usr/share/icons` and `~/.local/share/icons`
  - **Use case:** Mix Fluent GTK theme with different icon set
  - **Example:** Fluent-round-teal-Dark (GTK) + Fluent-Dark icons (manually selected)
  - Only active when "Manual icon theme selection" is enabled

#### Automation Features

- **Auto-switch between Light/Dark variants**: Automatically switch between Light/Dark theme variants
  - ✅ ON: Detects system Dark Mode toggle, switches to matching theme variant
  - Example: ZorinPurple-Light ↔ ZorinPurple-Dark
  - **Note:** Dropdown will only show matching variants (Light OR Dark, not both)

- **Full Auto Mode (experimental)**: Wallpaper-driven mode for shell elements
  - ✅ ON: Wallpaper controls ALL colors including blur effects (border, background, shadow)
  - ❌ OFF: Theme controls blur effects while wallpaper controls panel/popup (default)

#### Debugging

- **Enable debug logging**: Detailed console logs for troubleshooting
  - View logs with: `journalctl -f -o cat /usr/bin/gnome-shell | grep CSSGnomme`
  - **Warning:** Increases log verbosity significantly

---

### ℹ️ Page 5: About

**Project information, version, and How It Works explanation.**

- **Version**: Current extension version (v1.5.4)
- **How It Works**: Detailed explanation of overlay system, color extraction, and CSS generation

---

## 🎯 Quick Setup Workflow

### Minimal Setup (5 minutes)

1. **Page 1 (Theme Overlay)**:
   - ✅ Enable **Enable Overlay Theme**
   - ✅ Enable **Auto-detect colors on wallpaper change**
   - Select your preferred **Base Theme**

2. **Page 2 (Color Settings)**:
   - Adjust **Panel Opacity** (try 85%)
   - Adjust **Border Radius** (try 12px)
   - ✅ Enable **Apply border radius to main panel** for floating effect

3. **Page 4 (Advanced Settings)**:
   - ✅ Enable **Enable Zorin OS Integration** (if on Zorin OS)

4. **Done!** Colors will auto-extract from wallpaper.

### Full Customization (15 minutes)

1. Follow Minimal Setup above
2. **Page 3 (Blur Effects)**:
   - Set **Blur radius** (try 30px)
   - Adjust **Saturation** (try 1.2)
   - Fine-tune **Blur opacity** (try 0.8)
   - Adjust **Shadow strength** (try 0.4) ← **NEW dynamic slider**
3. **Page 2** (return here):
   - Experiment with **Override panel color** if needed
   - Adjust **Tint strength** to neutralize Zorin theme colors (try 0%)
4. **Page 4** (Advanced):
   - Try **Manual icon theme selection** to mix GTK and icon themes
5. **Test**: Change wallpaper and watch auto-extraction work!

---

## 💡 Pro Tips

### Best Blur Settings

For **frosted glass effect** (macOS-style):

- Blur radius: 30-35px
- Saturation: 1.2-1.3
- Contrast: 0.9-1.0
- Brightness: 1.1 (light themes) / 0.9 (dark themes)
- Blur opacity: 0.8-0.9
- Shadow strength: 0.4-0.5

For **subtle transparency** (Windows 11-style):

- Blur radius: 15-20px
- Saturation: 1.0-1.1
- Contrast: 1.0
- Brightness: 1.0
- Blur opacity: 0.6-0.7
- Shadow strength: 0.3

### Floating Panel Tips

- Set **Border Radius** to 8-12px
- ✅ Enable **Apply border radius to main panel**
- ✅ Enable **Enable Zorin OS Integration** (Page 4) for floating effect
- Adjust **Panel Opacity** to 0.8-0.9
- Result: Modern floating taskbar (Zorin style)

### Tint Neutralization Tips (**NEW in v1.5.4**)

- **Problem:** ZorinBlue theme too blue, want neutral base?
- **Solution:** Set **Tint strength** to 0% (Page 2)
- **Result:** Neutral gray base + wallpaper accent colors
- **Perfect for:** Wallpaper-driven color schemes on Zorin themes

### Color Extraction Tips

- **Too dark?** Increase **Brightness multiplier** (Blur Effects page)
- **Too colorful?** Lower **Saturation multiplier**
- **Wrong colors?** Click **Extract Colors Now** to re-analyze wallpaper
- **Manual override?** Disable auto-extraction, use **Override panel color**

### Icon Theme Mixing Tips (**NEW in v1.5.4**)

- **Want Fluent GTK with different icons?**
  - Page 1: Select Fluent-round-teal-Dark (Base Theme)
  - Page 4: ✅ Enable **Manual icon theme selection**
  - Page 4: Choose desired icon theme (e.g., Papirus-Dark)
- **Auto-detect not working?** Manual override ensures correct icon theme

### Performance Tips

- Lower **Blur radius** (< 25px) for better performance on older hardware
- Disable **Enable debug logging** after setup (reduces CPU usage)
- Use **Apply Changes Now** sparingly (auto-update is more efficient)

---

## 🐛 Troubleshooting

### Overlay looks broken or messed up

**Symptom:** Theme appears corrupted, colors wrong, or UI elements broken

**Solution (Full Reset):**

1. **Disable Overlay**: Open CSS Gnomme settings → Turn OFF "Enable Overlay Theme"
2. **Choose Base Theme**: Go to Zorin Appearance settings → Select the theme you want
3. **Select in Extension**: Open CSS Gnomme settings → Choose same theme in "Base Theme" dropdown
4. **Enable Overlay**: Turn ON "Enable Overlay Theme"
5. **Recreate**: Click "Recreate Overlay Theme" button

**Also Try (if above doesn't help):**

- Try **Enable/Disable toggle** several times (sometimes one cycle is enough)
- Or use **Apply Changes Now** button to force refresh

### Colors not extracting

**Symptom:** "No background image found" notification

**Solution:**

1. Verify wallpaper is set in **Settings → Background**
2. Click **Extract Colors Now** (Page 1)
3. Enable **Auto-detect colors on wallpaper change**

### Blur not visible

**Symptom:** Transparency works but no blur effect

**Solution:**

1. Increase **Blur radius** to 30-40px (Page 3)
2. Lower **Menu Opacity** to 70-80% (Page 2)
3. Check **Blur opacity** is not 0.0 (Page 3)

### Theme reverts after reboot

**Symptom:** CSS Gnomme overlay resets to original theme

**Solution:**

1. Check **Enable Overlay Theme** is ON (Page 1)
2. Verify `~/.themes/CSSGnomme/` directory exists
3. Click **Recreate Overlay Theme** (Page 1)

### Settings not applying

**Symptom:** Changes made but no visual update

**Solution:**

1. Click **Apply Changes Now** (Page 1)
2. Restart GNOME Shell: `Alt+F2` → type `r` → Enter (X11 only)
3. On Wayland: Log out and log back in

### Shadow not visible (**NEW in v1.5.4**)

**Symptom:** Shadow strength slider doesn't change shadow appearance

**Solution:**

1. Increase **Shadow strength** to 0.5-1.0 (Page 3)
2. Check **Shadow color** is not transparent (Page 3)
3. Verify panel has sufficient transparency to see shadow (Page 2)
4. **Note:** v1.5.4 fixed dynamic shadow calculation bug (was hardcoded before)
5. Combine with Blur Opacity setting

### Wrong icon theme applied (**NEW in v1.5.4**)

**Symptom:** Icons don't match expected theme after overlay enable

**Solution:**

1. Page 4: ✅ Enable **Manual icon theme selection**
2. Page 4: Select correct icon theme from dropdown
3. Click **Apply Changes Now** (Page 1)
4. **Note:** v1.5.4 fixed icon theme detection bug

### Memory issues (GNOME 43 specific)

**Symptom:** High memory usage after wallpaper changes

**Solution:**

1. **Avoid frequent wallpaper changes** - known GNOME 43 bug
2. Restart GNOME Shell periodically: `Alt+F2` → type `r` → Enter
3. Disable auto-color extraction if you change wallpapers often

---

## 📚 Additional Resources

- **GitHub Repository**: [github.com/drdrummie/CSSGnomme-ZorinOS17](https://github.com/drdrummie/CSSGnomme-ZorinOS17)
- **Issue Tracker**: Report bugs or request features
- **Full Documentation**: See `README.md` for technical details
- **Known Issues**: See `docs/KNOWN_ISSUES.md` for detailed limitations

---

**Enjoy your customized GNOME Shell experience!** 🎨✨
