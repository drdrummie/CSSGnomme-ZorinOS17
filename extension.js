/**
 * CSS Gnomme Extension for Zorin OS 17.3 / GNOME Shell 43/44- drdrummie
 */

const { St, GObject, Clutter, Gio, Meta, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;
const Config = imports.misc.config;
const Me = ExtensionUtils.getCurrentExtension();
const ZorinStyler = Me.imports.ZorinStyler;
const ThemeUtils = Me.imports.themeUtils.ThemeUtils;
const ColorPalette = Me.imports.colorPalette.ColorPalette;
const OverlayThemeManager = Me.imports.overlayThemeManager.OverlayThemeManager;
const Constants = Me.imports.constants.Constants;
const { LogLevel, Logger } = Me.imports.loggingUtils;

const _ = ExtensionUtils.gettext;

/**
 * Main extension class
 * Manages transparency, blur effects, and styling of Zorin OS 17.3 / GNOME Shell elements
 */
const CSSGnomeExtension = GObject.registerClass(
    class CSSGnomeExtension extends PanelMenu.Button {
        _init() {
            super._init(0.5, Me.metadata.name); // 0.5 = center alignment for system tray popup

            this._settings = ExtensionUtils.getSettings();
            this._settingsConnections = [];
            this._menuItemConnections = [];
            this._isEnabled = false;

            // Timer for debouncing user settings updates (prevents UI freezes)
            this._userSettingsUpdateTimer = null;

            // Initialize logger (no settings yet, will be set after defaults)
            this._logger = new Logger("Extension", null);

            // Initialize defaults first to ensure settings exist
            this._initializeDefaults();

            // Now that settings exist, attach them to logger
            this._logger.setSettings(this._settings);

            // Initialize styling modules (pass logger to sub-modules)
            this._zorinStyler = new ZorinStyler.ZorinStyler(this._settings, this._logger.createChild("ZorinStyler"));

            // Initialize interface settings FIRST (needed by ColorPalette for color-scheme detection)
            this._interfaceSettings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });

            // Initialize shell theme settings (for user-theme extension)
            try {
                this._shellSettings = new Gio.Settings({ schema: "org.gnome.shell.extensions.user-theme" });
                this._logger.debug("Shell theme settings initialized successfully");
            } catch (e) {
                this._logger.warn("User-theme extension not available, shell theme support disabled: " + e.message);
                this._shellSettings = null;
            }

            // Initialize color palette module with settings for overlay source theme detection
            this._colorPalette = new ColorPalette(this._logger.createChild("ColorPalette"), this._settings, this._interfaceSettings);

            // Initialize overlay theme manager
            this._overlayManager = new OverlayThemeManager("CSSGnomme", this._logger.createChild("OverlayTheme"));
            this._updateOverlayTimer = null;
            this._colorSchemeMonitorId = null;

            // Throttle tracking for rapid color-scheme changes
            this._lastColorSchemeChange = null;

            // Guard flag to prevent concurrent overlay recreations
            this._overlayRecreationInProgress = false;

            // OPTIMIZATION: Track color-scheme and wallpaper to skip redundant processing
            this._lastColorScheme = null;
            this._lastColorSchemeTime = null;
            this._lastWallpaperUri = null;

            // Initialize components
            this._initializeComponents();
            this._createPanelButton();
            this._createMenu();
            this._connectSettings();

            this._logger.always("Extension initialized successfully");
        }

        /**
         * Initializes components directly in the class (future expansion point)
         */
        _initializeComponents() {
            // Future components can be initialized here
        }

        /**
         * Creates the panel button with hide-tray-icon
         */
        _createPanelButton() {
            this._icon = new St.Icon({
                icon_name: "preferences-desktop-theme-symbolic",
                style_class: "system-status-icon"
            });
            this.add_child(this._icon);
            // Use inverted logic for Cinnamon compatibility
            this.visible = !this._settings.get_boolean("hide-tray-icon");
        }

        /**
         * Creates the panel menu with simple content
         */
        _createMenu() {
            // Extract colors from background
            let extractColorsItem = new PopupMenu.PopupMenuItem(_("Extract Colors from Background"));
            const extractColorsId = extractColorsItem.connect("activate", () => {
                this._handleColorSchemeChange('manual-extraction', true); // Force extraction
            });
            this._menuItemConnections.push({ item: extractColorsItem, id: extractColorsId });
            this.menu.addMenuItem(extractColorsItem);

            // Overlay theme toggle (converted to standard item with state indicator for consistent height)
            const overlayState = this._settings.get_boolean("enable-overlay-theme");
            let overlayToggleItem = new PopupMenu.PopupMenuItem(
                _("Enable GTK Theme Overlay") + (overlayState ? Constants.UI_INDICATORS.enabled : Constants.UI_INDICATORS.disabled)
            );
            const overlayToggleId = overlayToggleItem.connect("activate", () => {
                const currentState = this._settings.get_boolean("enable-overlay-theme");
                this._settings.set_boolean("enable-overlay-theme", !currentState);
            });
            this._menuItemConnections.push({ item: overlayToggleItem, id: overlayToggleId });
            this.menu.addMenuItem(overlayToggleItem);

            // Apply overlay changes (only show if overlay enabled)
            let applyOverlayItem = new PopupMenu.PopupMenuItem(_("Apply Overlay Changes"));
            const applyOverlayId = applyOverlayItem.connect("activate", () => {
                this._applyOverlayChanges();
            });
            this._menuItemConnections.push({ item: applyOverlayItem, id: applyOverlayId });
            this.menu.addMenuItem(applyOverlayItem);

            // Update overlay toggle text and apply button sensitivity when state changes
            const overlayStateId = this._settings.connect("changed::enable-overlay-theme", () => {
                const newState = this._settings.get_boolean("enable-overlay-theme");
                overlayToggleItem.label.text = _("Enable GTK Theme Overlay") + (newState ? Constants.UI_INDICATORS.enabled : Constants.UI_INDICATORS.disabled);
                applyOverlayItem.setSensitive(newState);
            });
            this._settingsConnections.push(overlayStateId);
            applyOverlayItem.setSensitive(this._settings.get_boolean("enable-overlay-theme"));

            // Separator
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Settings
            let settingsItem = new PopupMenu.PopupMenuItem(_("Open Settings"));
            const settingsId = settingsItem.connect("activate", () => {
                this._openPreferences();
            });
            this._menuItemConnections.push({ item: settingsItem, id: settingsId });
            this.menu.addMenuItem(settingsItem);
        }

        /**
         * Initializes default values with settings
         */
        _initializeDefaults() {
            // Set defaults if not already set
            if (!this._settings.get_boolean("initialized")) {
                // Use direct log since logger doesn't have settings yet
                log("[CSSGnomme:Extension:INFO] Initializing default settings for first run");

                // Basic transparency settings
                this._settings.set_double("panel-opacity", 0.6);
                this._settings.set_double("menu-opacity", 0.8);

                // Color override settings
                this._settings.set_boolean("override-panel-color", false);
                this._settings.set_string("choose-override-panel-color", "rgba(46, 52, 64, 0.8)");
                this._settings.set_boolean("override-popup-color", false);
                this._settings.set_string("choose-override-popup-color", "rgba(255, 255, 255, 0.9)");

                // Border radius settings
                this._settings.set_int("border-radius", 12);
                this._settings.set_boolean("apply-panel-radius", false);
                this._settings.set_boolean("auto-detect-radius", true);

                // Blur effects settings
                this._settings.set_int("blur-radius", 22);
                this._settings.set_double("blur-saturate", 0.95);
                this._settings.set_double("blur-contrast", 0.75);
                this._settings.set_double("blur-brightness", 0.65);
                this._settings.set_string("blur-background", "rgba(0, 0, 0, 0.3)");
                this._settings.set_string("blur-border-color", "rgba(255, 255, 255, 0.15)");
                this._settings.set_int("blur-border-width", 1);
                this._settings.set_double("shadow-strength", 0.3);
                this._settings.set_double("blur-opacity", 0.8);

                // Extended UI styling settings
                this._settings.set_boolean("enable-alttab-styling", false);

                // System tray indicator settings
                this._settings.set_boolean("hide-tray-icon", false);

                // Notifications settings
                this._settings.set_boolean("notifications-enabled", true);

                // Auto color-scheme switching
                this._settings.set_boolean("auto-switch-color-scheme", true);

                // Mark as initialized to prevent overwriting user settings on subsequent runs
                this._settings.set_boolean("initialized", true);
                log("[CSSGnomme:Extension:INFO] Default settings initialized successfully");
            }
        }

        /**
         * Connects settings changes to callback functions
         */
        _connectSettings() {
            // Settings that affect CSS and trigger overlay update
            const cssAffectingSettings = [
                "menu-opacity", // panel-opacity has custom handler below
                "border-radius",
                "apply-panel-radius",
                "auto-detect-radius",
                "blur-radius",
                "blur-saturate",
                "blur-contrast",
                "blur-brightness",
                "blur-background",
                "blur-border-color",
                "blur-border-width",
                "shadow-strength",
                "shadow-color",
                "blur-opacity",
                "override-panel-color",
                "choose-override-panel-color",
                "override-popup-color",
                "choose-override-popup-color"
            ];

            // Connect CSS-affecting settings with generic handler
            cssAffectingSettings.forEach(setting => {
                const id = this._settings.connect(`changed::${setting}`, () => {
                    this._onCssSettingChanged(setting);
                });
                this._settingsConnections.push(id);
            });

            // Special handlers for settings with custom logic
            const specialHandlers = [
                [
                    "panel-opacity",
                    () => {
                        if (!this._isEnabled) return;
                        // Update Zorin Taskbar + overlay
                        const opacity = this._settings.get_double("panel-opacity");
                        this._zorinStyler.updateOpacity(opacity);
                        this._onCssSettingChanged("panel-opacity");
                    }
                ],
                [
                    "hide-tray-icon",
                    () => {
                        // Use inverted logic for Cinnamon compatibility
                        this.visible = !this._settings.get_boolean("hide-tray-icon");
                        this._logger.info(`Icon visibility changed to: ${this.visible}`);
                    }
                ],
                [
                    "enable-zorin-integration",
                    () => {
                        const enabled = this._settings.get_boolean("enable-zorin-integration");
                        this._logger.info(`Zorin Integration changed to: ${enabled}`);
                        // Recreate overlay to apply/remove Fluent enhancements
                        if (this._settings.get_boolean("enable-overlay-theme")) {
                            this._recreateOverlayTheme();
                        }
                    }
                ],
                [
                    "enable-overlay-theme",
                    () => {
                        const enabled = this._settings.get_boolean("enable-overlay-theme");
                        this._logger.info(`Overlay theme toggled to: ${enabled}`);
                        enabled ? this._enableOverlayTheme() : this._disableOverlayTheme();
                    }
                ],
                [
                    "overlay-source-theme",
                    () => {
                        const sourceTheme = this._settings.get_string("overlay-source-theme");
                        this._logger.info(`Overlay source theme changed to: ${sourceTheme}`);

                        // ← FIX: Recreate overlay when source theme changes in prefs dropdown
                        const overlayEnabled = this._settings.get_boolean("enable-overlay-theme");
                        if (overlayEnabled) {
                            this._logger.info("Source theme changed - recreating overlay...");
                            this._recreateOverlayTheme();
                        } else {
                            this._logger.info("Overlay disabled - source theme change queued for next enable");
                        }

                        // Auto-detect border-radius from selected theme if enabled
                        if (this._settings.get_boolean("auto-detect-radius") && sourceTheme) {
                            this._detectAndApplyBorderRadius(sourceTheme);
                        }

                        // Extract colors from wallpaper if auto-extraction enabled
                        if (this._settings.get_boolean("auto-color-extraction")) {
                            this._logger.info("Auto-extracting colors from wallpaper");
                            this._handleColorSchemeChange('theme-source-change');
                        }

                        // NOTE: Shadow color is auto-set by theme extraction in recreateOverlay()
                        // No need to call _autoSetShadowColor() here - it would overwrite accent-based shadow
                    }
                ],
                [
                    "manual-apply-trigger",
                    () => {
                        this._logger.info("Manual apply triggered from preferences");
                        this._applyOverlayChanges();
                    }
                ],
                [
                    "trigger-color-extraction",
                    () => {
                        this._logger.info("Manual color extraction triggered from preferences - FORCED");
                        this._handleColorSchemeChange('preference-trigger', true); // Force extraction
                    }
                ],
                [
                    "trigger-recreate-overlay",
                    () => {
                        this._logger.info("Overlay recreation triggered from preferences");
                        this._recreateOverlayTheme();
                    }
                ],
                [
                    "auto-color-extraction",
                    () => {
                        const enabled = this._settings.get_boolean("auto-color-extraction");
                        this._logger.info(`Auto color extraction ${enabled ? "enabled" : "disabled"}`);
                        enabled ? this._setupWallpaperMonitoring() : this._cleanupWallpaperMonitoring();
                    }
                ],
                [
                    "debug-logging",
                    () => {
                        const enabled = this._settings.get_boolean("debug-logging");
                        this._logger.always(`Debug logging ${enabled ? "enabled" : "disabled"}`);
                        if (enabled) {
                            this._logger.info("Debug logging is now active");
                            this._logger.debug(
                                `State - isEnabled: ${this._isEnabled}, connections: ${this._settingsConnections.length}, visible: ${this.visible}`
                            );
                        }
                    }
                ],
                [
                    "enable-alttab-styling",
                    () => {
                        if (!this._isEnabled) return;
                        const enabled = this._settings.get_boolean("enable-alttab-styling");
                        this._logger.info(`Alt-Tab styling changed to: ${enabled}`);
                    }
                ],
                [
                    "auto-switch-color-scheme",
                    () => {
                        const enabled = this._settings.get_boolean("auto-switch-color-scheme");
                        this._logger.info(`Auto theme variant switching ${enabled ? "enabled" : "disabled"}`);

                        if (enabled) {
                            // Setup color-scheme monitoring
                            this._setupColorSchemeMonitoring();

                            // Sync color-scheme with current theme
                            const sourceTheme = this._settings.get_string("overlay-source-theme");
                            if (sourceTheme) {
                                const isDarkTheme = sourceTheme.toLowerCase().includes('dark');
                                const newScheme = isDarkTheme ? 'prefer-dark' : 'default';
                                this._interfaceSettings.set_string('color-scheme', newScheme);
                                this._logger.info(`Synced color-scheme to: ${newScheme} (based on theme: ${sourceTheme})`);
                            }
                        } else {
                            // Cleanup monitoring when disabled
                            this._cleanupColorSchemeMonitoring();
                        }
                    }
                ]
            ];

            specialHandlers.forEach(([setting, handler]) => {
                const id = this._settings.connect(`changed::${setting}`, handler);
                this._settingsConnections.push(id);
            });
        }

        /**
         * Find matching theme variant based on color-scheme preference
         * Handles patterns like: ZorinPurple-Light, Fluent-round-purple-Dark-compact
         * @private
         * @param {string} currentTheme - Current theme name
         * @param {boolean} preferDark - Whether dark variant is preferred
         * @returns {string|null} Matching theme variant or null if not found
         */
        _findMatchingThemeVariant(currentTheme, preferDark) {
            // Pattern: base-(Dark|Light)-modifiers
            const pattern = /^(.+)-(Dark|Light)((?:-\w+)*)$/i;
            const match = currentTheme.match(pattern);

            if (!match) {
                this._logger.debug(`Theme ${currentTheme} doesn't follow Dark/Light variant pattern`);
                return null;
            }

            const [, baseName, currentVariant, trailingModifiers] = match;
            const isDark = currentVariant.toLowerCase() === 'dark';

            // Already matches preference
            if (isDark === preferDark) {
                this._logger.debug(`Theme ${currentTheme} already matches color-scheme preference`);
                return currentTheme;
            }

            // Build target variant name
            const targetVariant = preferDark ? 'Dark' : 'Light';
            const targetTheme = `${baseName}-${targetVariant}${trailingModifiers}`;

            // Verify target theme exists using discoverSourceTheme
            const themePath = this._overlayManager.discoverSourceTheme(targetTheme);
            if (themePath) {
                this._logger.info(`Found matching variant: ${currentTheme} → ${targetTheme}`);
                return targetTheme;
            } else {
                this._logger.debug(`Target theme ${targetTheme} not found in installed themes`);
                return null;
            }
        }

        /**
         * Setup color-scheme monitoring for automatic theme variant switching
         * Monitors Quick Settings Dark/Light toggle
         * @private
         */
        _setupColorSchemeMonitoring() {
            // Only setup if auto-switch is enabled
            if (!this._settings.get_boolean('auto-switch-color-scheme')) {
                this._logger.debug('Auto-switch disabled, skipping color-scheme monitoring');
                return;
            }

            // Guard against duplicate setup
            if (this._colorSchemeMonitorId) {
                this._logger.debug('Color-scheme monitoring already active');
                return;
            }

            try {
                this._logger.info('Setting up color-scheme monitoring for theme variant switching');

                this._colorSchemeMonitorId = this._interfaceSettings.connect('changed::color-scheme', async () => {
                    const colorScheme = this._interfaceSettings.get_string('color-scheme');
                    const preferDark = colorScheme === 'prefer-dark';
                    const currentTheme = this._settings.get_string('overlay-source-theme');

                    // OPTIMIZATION: Skip redundant triggers within 5s window
                    const now = Date.now();
                    if (this._lastColorScheme === colorScheme &&
                        this._lastColorSchemeTime &&
                        (now - this._lastColorSchemeTime) < 5000) {
                        this._logger.debug(`Skipping redundant color-scheme trigger: ${colorScheme} (within 5s window)`);
                        return;
                    }
                    this._lastColorScheme = colorScheme;
                    this._lastColorSchemeTime = now;

                    this._logger.info(`Color-scheme changed to: ${colorScheme} (current theme: ${currentTheme})`);

                    // Find matching theme variant
                    const matchingVariant = this._findMatchingThemeVariant(currentTheme, preferDark);

                    if (matchingVariant && matchingVariant !== currentTheme) {
                        this._logger.info(`Auto-switching theme variant: ${currentTheme} → ${matchingVariant}`);

                        // SUSPEND auto-color-extraction during theme recreation to avoid duplicate processing
                        const autoExtractEnabled = this._settings.get_boolean('auto-color-extraction');
                        if (autoExtractEnabled) {
                            this._settings.set_boolean('auto-color-extraction', false);
                            this._logger.debug('Temporarily suspended auto-color-extraction for theme switch');
                        }

                        try {
                            // Switch to matching variant (triggers overlay recreation via callback)
                            this._settings.set_string('overlay-source-theme', matchingVariant);

                            // Wait for overlay recreation to complete (give it time to process)
                            // The overlay-source-theme callback will trigger _recreateOverlayTheme
                            await new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                                resolve();
                                return GLib.SOURCE_REMOVE;
                            }));

                        } finally {
                            // RESTORE auto-extraction after theme switch completes
                            if (autoExtractEnabled) {
                                this._settings.set_boolean('auto-color-extraction', true);
                                this._logger.debug('Restored auto-color-extraction after theme switch');
                            }
                        }

                        // NOW extract colors (single pass after theme switch complete)
                        if (autoExtractEnabled) {
                            this._handleColorSchemeChange('color-scheme-complete');
                        }

                    } else if (!matchingVariant) {
                        this._logger.info(`No matching ${preferDark ? 'dark' : 'light'} variant found for ${currentTheme}`);
                        // Still handle color extraction for non-variant-switching themes
                        this._handleColorSchemeChange('color-scheme-switch');
                    } else {
                        this._logger.debug(`Theme ${currentTheme} already matches color-scheme preference`);
                        // Handle color extraction for already-matched themes
                        this._handleColorSchemeChange('color-scheme-switch');
                    }
                });

                this._logger.info('Color-scheme monitoring active');
            } catch (error) {
                this._logger.error('Failed to setup color-scheme monitoring', error.toString());
            }
        }

        /**
         * Cleanup color-scheme monitoring
         * @private
         */
        _cleanupColorSchemeMonitoring() {
            if (this._colorSchemeMonitorId && this._interfaceSettings) {
                this._logger.info('Cleaning up color-scheme monitoring');
                try {
                    this._interfaceSettings.disconnect(this._colorSchemeMonitorId);
                } catch (e) {
                    this._logger.debug('Color-scheme monitor already disconnected');
                }
                this._colorSchemeMonitorId = null;
            }
        }

        /**
         * Generic handler for CSS-affecting settings
         * Automatically schedules overlay update if overlay is enabled
         * @private
         * @param {string} settingName - Name of the changed setting
         */
        _onCssSettingChanged(settingName) {
            // Guard against calls after extension is disabled
            if (!this._isEnabled) {
                return;
            }

            this._logger.debug(`CSS setting changed: ${settingName}`);

            // Manage Zorin intellihide when user toggles apply-panel-radius
            if (settingName === 'apply-panel-radius') {
                const applyRadius = this._settings.get_boolean('apply-panel-radius');
                const enableZorin = this._settings.get_boolean('enable-zorin-integration');

                if (enableZorin) {
                    // Enable/disable Zorin intellihide for floating effect
                    this._zorinStyler.manageFloatingPanel(applyRadius);
                }
            }

            // Schedule overlay update if overlay theme is active (use userSettings debounce)
            if (this._settings.get_boolean("enable-overlay-theme")) {
                this._scheduleOverlayUpdate('user-settings');
            }
        }

        /**
         * Enable the extension and apply all styling
         */
        enable() {
            this._isEnabled = true;
            this._logger.always("Enabling extension...");

            // ZorinStyler handles Zorin Taskbar transparency automatically via GSettings
            // No manual styling application needed - settings handlers are already connected

            try {
                // Initialize overlay theme if enabled
                if (this._settings.get_boolean("enable-overlay-theme")) {
                    this._enableOverlayTheme();
                }

                // Manage Zorin intellihide for floating panel effect (if needed)
                const applyRadius = this._settings.get_boolean('apply-panel-radius');
                const enableZorin = this._settings.get_boolean('enable-zorin-integration');

                if (enableZorin && applyRadius) {
                    this._logger.debug(`Managing Zorin intellihide for floating panel on extension enable`);
                    this._zorinStyler.manageFloatingPanel(true);
                }

                // Setup auto color extraction if enabled
                if (this._settings.get_boolean("auto-color-extraction")) {
                    this._setupWallpaperMonitoring();
                }

                // Setup color-scheme monitoring if auto-switch enabled
                if (this._settings.get_boolean("auto-switch-color-scheme")) {
                    this._setupColorSchemeMonitoring();
                }

                this._logger.always("Extension enabled successfully");
            } catch (error) {
                this._logger.error("Error enabling extension", error.toString());
            }
        }

        /**
         * Disable the extension and cleanup
         * MEMORY LEAK FIX: Enhanced cleanup with proper module destruction order
         */
        disable() {
            this._isEnabled = false;
            this._logger.always("Disabling extension...");

            // Clear recreation guard on disable
            this._overlayRecreationInProgress = false;

            // Restore Zorin's original intellihide state
            if (this._zorinStyler) {
                this._logger.debug("Restoring Zorin original intellihide state");
                this._zorinStyler.manageFloatingPanel(false);
            }

            // PHASE 1: Stop monitoring and timers
            this._cleanupWallpaperMonitoring();
            this._cleanupColorSchemeMonitoring();

            // Clear overlay update timer
            if (this._updateOverlayTimer) {
                GLib.source_remove(this._updateOverlayTimer);
                this._updateOverlayTimer = null;
            }

            // PHASE 2: Disconnect all settings connections
            this._disconnectAllSettings();

            // PHASE 3: Cleanup modules in CRITICAL ORDER
            // ColorPalette FIRST (contains GdkPixbuf resources and pending GC timers)
            if (this._colorPalette) {
                try {
                    // PERSISTENCE: Save cache to disk before cleanup
                    if (Constants.CACHE_PERSISTENCE.enabled) {
                        this._colorPalette._savePersistentCache();
                        this._logger.debug("Persistent cache saved before cleanup");
                    }

                    this._colorPalette.destroy();
                    this._logger.debug("ColorPalette destroyed");
                } catch (e) {
                    this._logger.warn(`Error destroying ColorPalette: ${e.message}`);
                }
                this._colorPalette = null;
            }

            // OverlayManager cleanup (file handles and theme state)
            if (this._overlayManager) {
                try {
                    this._overlayManager.destroy();
                    this._logger.debug("OverlayManager destroyed");
                } catch (e) {
                    this._logger.warn(`Error destroying OverlayManager: ${e.message}`);
                }
                this._overlayManager = null;
            }

            // ZorinStyler cleanup (GSettings references)
            if (this._zorinStyler) {
                try {
                    this._zorinStyler.destroy();
                    this._logger.debug("ZorinStyler destroyed");
                } catch (e) {
                    this._logger.warn(`Error destroying ZorinStyler: ${e.message}`);
                }
                this._zorinStyler = null;
            }

            // PHASE 4: Settings cleanup
            if (this._interfaceSettings) {
                try {
                    // Dispose GSettings to prevent signal leak and memory accumulation.
                    // GSettings objects maintain signal connections that persist without explicit disposal.
                    this._interfaceSettings.run_dispose();
                } catch (e) {
                    this._logger.debug("Interface settings already disposed");
                }
                this._interfaceSettings = null;
            }

            if (this._settings) {
                try {
                    // Dispose GSettings to prevent signal leak and memory accumulation.
                    // GSettings objects maintain signal connections that persist without explicit disposal.
                    this._settings.run_dispose();
                } catch (e) {
                    this._logger.debug("Settings already disposed");
                }
                this._settings = null;
            }

            // PHASE 5: Clear remaining references
            this._bgSettings = null;
            this._wallpaperSignals = null;

            // PHASE 6: AGGRESSIVE GARBAGE COLLECTION (multi-phase)
            // Force GC multiple times to ensure native memory cleanup
            try {
                imports.system.gc(); // First GC pass

                // Schedule additional GC passes with delays
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                    try {
                        imports.system.gc(); // Second GC pass
                        this._logger.debug("Multi-phase GC completed after disable");
                    } catch (e) {
                        this._logger.debug("GC not available in second pass");
                    }
                    return GLib.SOURCE_REMOVE;
                });
            } catch (e) {
                this._logger.debug("GC not available");
            }

            try {
                this._logger.always("Extension disabled successfully with enhanced cleanup");
            } catch (error) {
                this._logger.error("Error disabling extension", error.toString());
            }
        }

        /**
         * Disconnect all settings signal handlers
         * Safe to call multiple times (guards against double disconnect)
         * @private
         */
        _disconnectAllSettings() {
            if (this._settingsConnections && this._settingsConnections.length > 0) {
                this._logger.debug(`Disconnecting ${this._settingsConnections.length} settings handlers`);

                this._settingsConnections.forEach(id => {
                    if (this._settings) {
                        try {
                            this._settings.disconnect(id);
                        } catch (e) {
                            // Already disconnected or invalid id - ignore
                        }
                    }
                });

                this._settingsConnections = [];
                this._logger.debug("All settings connections disconnected");
            }
        }

        // === UTILITY METHODS ===

        /**
         * Set default panel/popup colors based on theme brightness
         * Uses fallback colors from Constants when wallpaper extraction is disabled or fails
         * @private
         */
        _setDefaultPanelColors() {
            try {
                // Determine if current theme is dark or light
                const sourceTheme = this._settings.get_string('overlay-source-theme');
                const sourcePath = this._overlayManager.discoverSourceTheme(sourceTheme);

                if (!sourcePath) {
                    this._logger.warn("Cannot determine theme brightness, using dark theme defaults");
                    // Fallback to dark theme colors
                    const panelColor = ThemeUtils.rgbaToCss(...Constants.FALLBACK_COLORS.darkPanel, 0.8);
                    const popupColor = ThemeUtils.rgbaToCss(...Constants.FALLBACK_COLORS.darkPopup, 0.9);

                    this._settings.set_string('choose-override-panel-color', panelColor);
                    this._settings.set_string('choose-override-popup-color', popupColor);
                    return;
                }

                // Detect theme brightness
                const isLightTheme = this._overlayManager._isLightTheme(sourcePath);

                // Set appropriate default colors based on theme brightness
                if (isLightTheme) {
                    const panelColor = ThemeUtils.rgbaToCss(...Constants.FALLBACK_COLORS.lightPanel, 0.8);
                    const popupColor = ThemeUtils.rgbaToCss(...Constants.FALLBACK_COLORS.lightPopup, 0.9);
                    this._settings.set_string('choose-override-panel-color', panelColor);
                    this._settings.set_string('choose-override-popup-color', popupColor);
                    this._logger.info("Applied light theme default colors from constants");
                } else {
                    const panelColor = ThemeUtils.rgbaToCss(...Constants.FALLBACK_COLORS.darkPanel, 0.8);
                    const popupColor = ThemeUtils.rgbaToCss(...Constants.FALLBACK_COLORS.darkPopup, 0.9);
                    this._settings.set_string('choose-override-panel-color', panelColor);
                    this._settings.set_string('choose-override-popup-color', popupColor);
                    this._logger.info("Applied dark theme default colors from constants");
                }
            } catch (error) {
                this._logger.error("Error setting default panel colors", error.toString());
            }
        }

        /**
         * Extract colors from background and apply to settings
         * OPTIMIZATION: Skips extraction if wallpaper hasn't changed (unless forced)
         * @param {boolean} forceExtraction - Skip cache check and force fresh extraction
         */
        _extractAndApplyColors(forceExtraction = false) {
            try {
                // OPTIMIZATION: Get current wallpaper URI and check if it changed
                const backgroundSettings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });

                // Detect current color-scheme to check correct wallpaper field
                const currentColorScheme = this._interfaceSettings.get_string('color-scheme');
                const isDarkMode = currentColorScheme === 'prefer-dark';
                const wallpaperKey = isDarkMode ? 'picture-uri-dark' : 'picture-uri';
                const currentWallpaperUri = backgroundSettings.get_string(wallpaperKey);

                // Skip extraction if wallpaper hasn't changed (prevents redundant processing on color-scheme toggle)
                // UNLESS forceExtraction is true (manual "Extract from Wallpaper" button click)
                if (!forceExtraction && this._lastWallpaperUri && this._lastWallpaperUri === currentWallpaperUri) {
                    this._logger.debug(`Skipping color extraction - wallpaper unchanged [${wallpaperKey}]: ${currentWallpaperUri}`);
                    return;
                }
                this._lastWallpaperUri = currentWallpaperUri;

                if (forceExtraction) {
                    this._logger.info(`Force extraction requested - bypassing cache for ${wallpaperKey}`);
                }

                this._logger.info(`Extracting colors from background [${wallpaperKey}]...`);

                // Extract colors using gtk-theme suffix as primary detection method
                // Propagate forceExtraction flag to bypass cache when manual extraction requested
                const colorScheme = this._colorPalette.extractFromCurrentBackground(forceExtraction);

                if (colorScheme) {
                    this._colorPalette.applyColorsToSettings(this._settings, colorScheme);

                    // Show notification
                    this._notify("CSSGnomme", _("Colors extracted and applied from background image"));

                    this._logger.info("Color extraction successful", {
                        accent: colorScheme.accent,
                        background: colorScheme.background
                    });
                } else {
                    this._notify("CSSGnomme", _("No background image found or unable to extract colors"));
                    this._logger.info("Color extraction failed - no background image");
                }
            } catch (error) {
                this._logger.error("Error extracting colors", error.toString());
                this._notify("CSSGnomme", _("Error extracting colors: ") + error.message);
            }
        }

        /**
         * Centralized handler for color-scheme and wallpaper changes
         * Prevents duplicate regenerations by queuing operations
         * @param {string} triggerReason - Reason for activation (e.g., 'wallpaper-change', 'color-scheme-switch')
         * @param {boolean} forceExtraction - Skip cache check and force fresh extraction
         */
        _handleColorSchemeChange(triggerReason, forceExtraction = false) {
            if (!this._isEnabled) return;

            const now = Date.now();

            // Throttle rapid triggers (e.g., wallpaper slideshow, multiple monitors)
            // UNLESS forceExtraction is true (manual button click)
            if (!forceExtraction && this._lastColorSchemeChange && (now - this._lastColorSchemeChange) < 1000) {
                this._logger.debug(`Throttling color-scheme change: ${triggerReason} (< 1s since last)`);
                return;
            }
            this._lastColorSchemeChange = now;

            this._logger.info(`Color scheme change triggered by: ${triggerReason}${forceExtraction ? ' (FORCED)' : ''}`);

            // Queue color extraction if auto-extraction enabled OR forced
            if (this._settings.get_boolean('auto-color-extraction') || forceExtraction) {
                this._extractAndApplyColors(forceExtraction);
            }

            // Note: Overlay recreation is handled by overlay-source-theme setting callback
            // when auto-switching changes the theme variant
        }

        /**
         * Setup wallpaper monitoring for auto color extraction
         */
        _setupWallpaperMonitoring() {
            // Guard against concurrent setup (race condition protection)
            if (this._wallpaperSignals) {
                this._logger.debug("Wallpaper monitoring already active, skipping setup");
                return; // Already setup
            }

            try {
                this._logger.info("Setting up wallpaper monitoring for auto color extraction");

                // Get background settings
                this._bgSettings = new Gio.Settings({
                    schema_id: "org.gnome.desktop.background"
                });

                // Monitor wallpaper changes
                this._wallpaperSignals = [
                    this._bgSettings.connect("changed::picture-uri", () => {
                        this._logger.info("Wallpaper changed (light mode)");
                        this._handleColorSchemeChange('wallpaper-change-light');
                    }),
                    this._bgSettings.connect("changed::picture-uri-dark", () => {
                        this._logger.info("Wallpaper changed (dark mode)");
                        this._handleColorSchemeChange('wallpaper-change-dark');
                    })
                ];

                this._logger.info("Wallpaper monitoring active");
            } catch (error) {
                this._logger.error("Error setting up wallpaper monitoring", error.toString());
            }
        }

        /**
         * Cleanup wallpaper monitoring
         */
        _cleanupWallpaperMonitoring() {
            if (this._wallpaperSignals && this._bgSettings) {
                this._logger.info("Cleaning up wallpaper monitoring");

                this._wallpaperSignals.forEach(id => {
                    try {
                        this._bgSettings.disconnect(id);
                    } catch (e) {
                        // Already disconnected - ignore
                        this._logger.debug(`Signal ${id} already disconnected`);
                    }
                });

                // Dispose GSettings to prevent signal leak and memory accumulation.
                // GSettings objects maintain signal connections that persist without explicit disposal.
                this._bgSettings.run_dispose();
                this._wallpaperSignals = null;
                this._bgSettings = null;

                this._logger.debug("Wallpaper monitoring cleanup complete");
            }
        }

        _resetToDefaults() {
            this._logger.info("Resetting to defaults");
        }

        /**
         * Apply overlay theme changes (manual trigger)
         */
        _applyOverlayChanges() {
            if (!this._settings.get_boolean("enable-overlay-theme")) {
                this._notify("CSSGnomme", _("Overlay theme is not enabled"));
                return;
            }

            try {
                this._logger.info("Manually applying overlay changes");

                // Extract wallpaper colors if auto-extraction is enabled
                const autoExtract = this._settings.get_boolean('auto-color-extraction');
                if (autoExtract) {
                    this._logger.info("Auto color extraction enabled, extracting from wallpaper");
                    const colorScheme = this._colorPalette.extractFromCurrentBackground();
                    if (colorScheme) {
                        this._colorPalette.applyColorsToSettings(this._settings, colorScheme);
                        this._logger.info("Applied wallpaper colors: panel and popup backgrounds");
                    } else {
                        this._logger.info("No wallpaper found, applying theme-based default colors");
                        this._setDefaultPanelColors();
                    }
                } else {
                    this._logger.info("Auto color extraction disabled, applying theme-based default colors");
                    this._setDefaultPanelColors();
                }

                // Update overlay CSS with accent color detection
                if (this._overlayManager.updateOverlayCss(this._settings, true, this._interfaceSettings)) {
                    this._overlayManager.refreshTheme(this._interfaceSettings);

                    this._notify("CSSGnomme", _("Overlay theme updated successfully"));
                    this._logger.info("Overlay manually updated and refreshed");
                } else {
                    this._notify("CSSGnomme", _("Failed to update overlay theme"));
                    this._logger.warn("Overlay update failed");
                }
            } catch (error) {
                this._logger.error("Error applying overlay changes", error.toString());
                this._notify("CSSGnomme", _("Error: ") + error.message);
            }
        }

        /**
         * Enable overlay theme system
         * Creates overlay synchronously for predictable performance
         */
        _enableOverlayTheme() {
            try {
                let sourceTheme = this._settings.get_string("overlay-source-theme");
                const currentGtkTheme = this._overlayManager.getCurrentTheme(this._interfaceSettings);

                // P1-1: Sync dropdown with actual GTK theme when enabling overlay
                // Handles case: user changed theme externally while overlay was disabled
                if (!sourceTheme || sourceTheme === "") {
                    // No theme selected in dropdown - use current GTK theme
                    sourceTheme = currentGtkTheme;
                    this._settings.set_string("overlay-source-theme", sourceTheme);
                    this._logger.info(`No source theme set, using current GTK theme: ${sourceTheme}`);
                } else if (sourceTheme !== currentGtkTheme && currentGtkTheme !== "CSSGnomme") {
                    // Dropdown selection differs from actual GTK theme (and it's not our overlay)
                    // User likely changed theme externally - sync dropdown to reality
                    this._logger.info(`GTK theme changed externally: dropdown=${sourceTheme}, actual=${currentGtkTheme}`);
                    this._logger.info(`Syncing overlay-source-theme to match current GTK theme: ${currentGtkTheme}`);
                    sourceTheme = currentGtkTheme;
                    this._settings.set_string("overlay-source-theme", sourceTheme);
                }

                // ← FIX: Check if overlay needs recreation (source theme changed)
                if (this._overlayManager.needsRecreation(this._settings)) {
                    this._logger.info(`Creating/recreating overlay from: ${sourceTheme}`);

                    // Create overlay synchronously (simpler, faster)
                    const success = this._overlayManager.createOverlayTheme(
                        sourceTheme,
                        this._settings,
                        this._interfaceSettings
                    );

                    if (success) {
                        // Activate overlay after creation completes
                        this._overlayManager.activateOverlay(this._interfaceSettings, this._settings);
                        this._overlayManager.logOverlayInfo();

                        this._notify("CSSGnomme", _("Overlay theme created and activated"));
                    } else {
                        this._settings.set_boolean("enable-overlay-theme", false);
                        this._notify("CSSGnomme", _("Failed to create overlay theme"));
                    }
                } else {
                    // Overlay exists and source theme matches - just activate
                    this._logger.info("Overlay already exists and up-to-date, activating");
                    this._overlayManager.activateOverlay(this._interfaceSettings, this._settings);
                }

                // Setup auto-update if enabled
                if (this._settings.get_boolean("overlay-auto-update")) {
                    this._setupOverlayAutoUpdate();
                }

                // ZorinStyler only handles Zorin Taskbar transparency (no CSS injection)
                this._logger.info("ZorinStyler manages Zorin Taskbar transparency only");
            } catch (error) {
                this._logger.error("Error enabling overlay theme", error.toString());
                this._settings.set_boolean("enable-overlay-theme", false);
                this._notify("CSSGnomme", _("Error enabling overlay: ") + error.message);
            }
        }

        /**
         * Disable overlay theme system
         */
        _disableOverlayTheme() {
            try {
                this._logger.info("Disabling overlay theme");

                // Restore original theme
                this._overlayManager.restoreOriginalTheme(this._interfaceSettings, this._settings);

                // Restore Zorin's original intellihide state if it was modified
                if (this._zorinStyler && this._settings.get_boolean('enable-zorin-integration')) {
                    this._logger.debug("Restoring Zorin intellihide on overlay disable");
                    this._zorinStyler.manageFloatingPanel(false);
                }

                // ZorinStyler only handles transparency - no CSS re-injection needed

                // Clear update timer if exists
                if (this._updateOverlayTimer) {
                    GLib.source_remove(this._updateOverlayTimer);
                    this._updateOverlayTimer = null;
                }

                this._notify("CSSGnomme", _("Overlay theme disabled"));
            } catch (error) {
                this._logger.error("Error disabling overlay theme", error.toString());
                this._notify("CSSGnomme", _("Error disabling overlay: ") + error.message);
            }
        }

        /**
         * Recreate overlay theme
         * Synchronously rebuilds overlay structure, applies theme only if enabled
         * GUARDED: Prevents concurrent recreations
         */
        _recreateOverlayTheme() {
            // Guard against concurrent recreations
            if (this._overlayRecreationInProgress) {
                this._logger.debug("Overlay recreation already in progress, skipping duplicate request");
                return;
            }

            this._overlayRecreationInProgress = true;

            try {
                this._logger.info("Recreating overlay theme");

                // Use current colors from settings - color extraction handled by _handleColorSchemeChange
                this._logger.info("Using current colors from settings for overlay recreation");

                // Recreate overlay
                // Pass interfaceSettings to preserve original icon theme
                const success = this._overlayManager.recreateOverlay(
                    this._settings,
                    this._interfaceSettings
                );

                if (success) {
                    // Auto-apply overlay if enabled (recreate → apply flow)
                    // This ensures theme switches on dropdown change & dark/light toggle
                    const overlayEnabled = this._settings.get_boolean('enable-overlay-theme');
                    if (overlayEnabled) {
                        this._logger.info("Auto-applying overlay after recreate (overlay is enabled)");

                        // Apply overlay theme (set gtk-theme to CSSGnomme)
                        this._interfaceSettings.set_string("gtk-theme", this._overlayManager.overlayName);

                        // Force Shell theme reload (clear + set trick to bypass cache)
                        if (this._shellSettings) {
                            try {
                                const currentShellTheme = this._shellSettings.get_string("name");

                                if (currentShellTheme === this._overlayManager.overlayName) {
                                    // Already using overlay → force reload via temporary switch
                                    this._logger.info("Forcing Shell theme reload (already active, using clear+set trick)");
                                    this._shellSettings.set_string("name", "");

                                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                                        this._shellSettings.set_string("name", this._overlayManager.overlayName);
                                        this._logger.debug("Shell theme reloaded successfully");
                                        return GLib.SOURCE_REMOVE;
                                    });
                                } else {
                                    // Different theme → normal set triggers reload
                                    this._shellSettings.set_string("name", this._overlayManager.overlayName);
                                    this._logger.info("Shell theme set to overlay (first-time apply)");
                                }
                            } catch (e) {
                                this._logger.error("Failed to set shell theme: " + e.message);
                            }
                        } else {
                            this._logger.warn("Shell theme settings not available (user-theme extension not installed)");
                        }
                    }                    // Get newly detected accent color to show in notification
                    const borderColor = this._settings.get_string("blur-border-color");
                    const match = borderColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    const colorHint = match ? ` (accent: rgb(${match[1]}, ${match[2]}, ${match[3]}))` : "";

                    // Show appropriate status message
                    const statusMsg = overlayEnabled
                        ? _("Overlay theme recreated and applied")
                        : _("Overlay theme recreated (enable to apply)");

                    this._notify("CSSGnomme", statusMsg); // + colorHint);
                } else {
                    this._notify("CSSGnomme", _("Failed to recreate overlay"));
                    this._logger.warn("Overlay recreation returned false");
                }
            } catch (error) {
                this._logger.error("Error recreating overlay", error.toString());
                this._notify("CSSGnomme", _("Error: ") + error.message);
            } finally {
                // Always clear flag, even on error
                this._overlayRecreationInProgress = false;
            }
        }

        /**
         * Detect and apply border-radius from theme
         * Called when overlay-source-theme changes and auto-detect-radius is enabled
         * @param {string} themeName - Name of the theme to analyze
         */
        _detectAndApplyBorderRadius(themeName) {
            if (!this._overlayManager) {
                this._logger.warn("OverlayManager not initialized, cannot detect border-radius");
                return;
            }

            this._logger.info(`Auto-detecting border-radius from theme: ${themeName}`);

            try {
                const detectedRadius = this._overlayManager.detectThemeBorderRadius(themeName);

                if (detectedRadius !== null) {
                    const currentRadius = this._settings.get_int("border-radius");
                    if (detectedRadius !== currentRadius) {
                        this._settings.set_int("border-radius", detectedRadius);
                        this._logger.info(`Border-radius updated: ${currentRadius}px → ${detectedRadius}px`);
                        this._notify("CSS Gnomme", _(`Detected border-radius: ${detectedRadius}px from ${themeName}`));
                    } else {
                        this._logger.info(`Border-radius already set to detected value: ${detectedRadius}px`);
                    }
                } else {
                    this._logger.info(`Could not detect border-radius from ${themeName}, keeping current value`);
                }
            } catch (error) {
                this._logger.error(`Failed to detect border-radius: ${error.message}`);
            }
        }

        /**
         * Auto-set shadow color based on theme brightness (light/dark)
         * @private
         * @param {string} sourceTheme - Name of the source theme
         */
        _autoSetShadowColor(sourceTheme) {
            try {
                const sourcePath = this._overlayManager.discoverSourceTheme(sourceTheme);
                if (!sourcePath) {
                    this._logger.warn(`Cannot auto-set shadow color: theme ${sourceTheme} not found`);
                    return;
                }

                const isLightTheme = this._overlayManager._isLightTheme(sourcePath);
                const defaultOpacity = this._settings.get_double('shadow-strength') || 0.7;
                const rgbValues = isLightTheme ? Constants.SHADOW_COLOR_RGB.light : Constants.SHADOW_COLOR_RGB.dark;
                const rgbaString = `rgba(${rgbValues.join(', ')}, ${defaultOpacity})`;

                this._settings.set_string('shadow-color', rgbaString);
                this._logger.info(`Auto-set shadow color to: ${rgbaString} (${isLightTheme ? 'light' : 'dark'} theme)`);
            } catch (e) {
                this._logger.error(`Error auto-setting shadow color: ${e.message}`);
                // Fallback to white shadow
                this._settings.set_string('shadow-color', 'rgba(255, 255, 255, 0.7)');
            }
        }

        /**
         * Setup overlay theme debounced auto-update
         * Note: Individual setting callbacks (_onPanelOpacityChanged, etc.) now handle
         * calling _scheduleOverlayUpdate(), so this method is no longer needed for
         * duplicate tracking. Keeping it for future expansion or non-tracked settings.
         */
        _setupOverlayAutoUpdate() {
            if (!this._settings.get_boolean("overlay-auto-update")) {
                return;
            }

            // All overlay-affecting settings are now tracked in their respective callbacks
            // (_onPanelOpacityChanged, _onMenuOpacityChanged, _onBorderRadiusChanged, etc.)
            // This prevents duplicate signal connections and ensures proper debouncing

            this._logger.info("Overlay auto-update configured (via setting callbacks)");
        }

        /**
         * Schedule overlay update with optional debouncing for user settings
         * MERGED VERSION: Combines guard checks + inline debounce logic
         * @param {string} triggerContext - Context: 'user-settings', 'color-scheme', 'wallpaper', or 'generic'
         */
        _scheduleOverlayUpdate(triggerContext = 'generic') {
            // Guard: Don't schedule updates when extension is disabled
            if (!this._isEnabled) {
                this._logger.debug("Overlay update skipped - extension disabled");
                return;
            }

            if (!this._settings.get_boolean("enable-overlay-theme")) {
                this._logger.info("Overlay update skipped - overlay theme disabled");
                return;
            }

            // For user-settings changes, use debounce to prevent UI freezes
            if (triggerContext === 'user-settings') {
                // Only log first call in debounce window to reduce log spam
                if (!this._userSettingsUpdateTimer) {
                    this._logger.debug(`_scheduleOverlayUpdate called with trigger: ${triggerContext}`);
                }

                // Clear existing timer if any (extend debounce)
                if (this._userSettingsUpdateTimer) {
                    GLib.source_remove(this._userSettingsUpdateTimer);
                    this._userSettingsUpdateTimer = null;
                }

                // Set new debounce timer
                this._userSettingsUpdateTimer = GLib.timeout_add(
                    GLib.PRIORITY_DEFAULT,
                    Constants.OVERLAY_UPDATE_DEBOUNCE.userSettings,
                    () => {
                        this._logger.info("Performing debounced overlay update [user-settings]...");
                        this._userSettingsUpdateTimer = null;

                        // Perform the actual update
                        if (
                            this._overlayManager &&
                            this._overlayManager.updateOverlayCss(this._settings, false, this._interfaceSettings)
                        ) {
                            this._overlayManager.refreshTheme(this._interfaceSettings);
                            this._logger.info("Debounced overlay updated successfully");
                        } else {
                            this._logger.info("Debounced overlay update failed or manager not initialized");
                        }

                        return GLib.SOURCE_REMOVE;
                    }
                );
                return;
            }

            // Log non-debounced updates
            this._logger.debug(`_scheduleOverlayUpdate called with trigger: ${triggerContext}`);

            this._logger.info(`Performing overlay update [${triggerContext}] (immediate)...`);

            // Perform update immediately (sync operations are fast)
            if (
                this._overlayManager &&
                this._overlayManager.updateOverlayCss(this._settings, false, this._interfaceSettings)
            ) {
                this._overlayManager.refreshTheme(this._interfaceSettings);
                this._logger.info("Overlay updated successfully");
            } else {
                this._logger.info("Overlay update failed or manager not initialized");
            }
        }

        /**
         * Opens the extension preferences window
         */
        _openPreferences() {
            try {
                // For GNOME Shell 43.9 compatibility, use subprocess approach
                Util.spawn(["gnome-extensions", "prefs", Me.metadata.uuid]);
            } catch (error) {
                this._logger.error("Failed to open preferences", error.toString());
            }
        }

        /**
         * Show desktop notification (if enabled in settings)
         * Centralized notification control respects notifications-enabled setting
         * @private
         * @param {string} title - Notification title
         * @param {string} message - Notification message
         */
        _notify(title, message) {
            // Guard against calls before settings initialized
            if (!this._settings) {
                return;
            }

            // Check if notifications are enabled
            if (!this._settings.get_boolean('notifications-enabled')) {
                this._logger.debug(`Notification suppressed (disabled): ${title} - ${message}`);
                return;
            }

            try {
                Main.notify(title, message);
            } catch (error) {
                this._logger.error(`Failed to show notification: ${error.message}`);
            }
        }

        /**
         * Cleanup and destroy
         */
        destroy() {
            this._logger.info("Destroying extension");

            // Disable extension functionality (includes settings disconnect)
            this.disable();

            // Disconnect menu item signals
            this._menuItemConnections.forEach(({ item, id }) => {
                if (item) {
                    try {
                        item.disconnect(id);
                    } catch (e) {
                        // Already disconnected - ignore
                    }
                }
            });
            this._menuItemConnections = [];

            // Settings already disconnected in disable() - just dispose
            // Guard against double disconnect already handled in _disconnectAllSettings()

            // Cleanup styling modules
            if (this._zorinStyler) {
                this._zorinStyler.destroy();
                this._zorinStyler = null;
            }

            // Cleanup color palette
            if (this._colorPalette) {
                this._colorPalette.destroy();
                this._colorPalette = null;
            }

            // Cleanup interface settings
            if (this._interfaceSettings) {
                // Dispose GSettings to prevent signal leak and memory accumulation.
                // GSettings objects maintain signal connections that persist without explicit disposal.
                this._interfaceSettings.run_dispose();
                this._interfaceSettings = null;
            }

            // Cleanup overlay manager
            if (this._overlayManager) {
                this._overlayManager.destroy();
                this._overlayManager = null;
            }

            // Cleanup logger (disconnect debug-logging signal)
            if (this._logger && this._logger.destroy) {
                this._logger.destroy();
            }

            // Cleanup settings
            if (this._settings) {
                // Dispose GSettings to prevent signal leak and memory accumulation.
                // GSettings objects maintain signal connections that persist without explicit disposal.
                this._settings.run_dispose();
                this._settings = null;
            }

            super.destroy();
        }
    }
);

// === EXTENSION LIFECYCLE ===

var extension = null;

/**
 * Extension initialization function
 */
function init(metadata) {
    ExtensionUtils.initTranslations();

    // Check GNOME Shell version for compatibility
    // Use Config.PACKAGE_VERSION instead of Util.getGnomeVersion() which doesn't exist
    const packageVersion = Config.PACKAGE_VERSION.split(".").map(s => parseInt(s));
    const majorVersion = packageVersion[0];
    const minorVersion = packageVersion[1];

    // Create temporary logger without settings for init phase
    const initLogger = new Logger("", null);
    initLogger.always(`Initializing extension for GNOME Shell ${majorVersion}.${minorVersion}`);

    // Check minimum supported version
    if (majorVersion < 42) {
        initLogger.error(`GNOME Shell ${majorVersion}.${minorVersion} is not supported. Minimum required: 42.0`);
        return;
    } else if (majorVersion > 45) {
        initLogger.warn(
            `GNOME Shell ${majorVersion}.${minorVersion} detected. This extension hasn't been tested on versions newer than 45.`
        );
    }

    // Version info logged for debugging (stored in Me.metadata.version if needed)
    initLogger.always("Extension initialized");
}

/**
 * Extension enable function
 */
function enable() {
    try {
        extension = new CSSGnomeExtension();
        Main.panel.addToStatusArea(Me.uuid, extension);
        extension.enable();
        const enableLogger = new Logger("", null);
        enableLogger.always("Extension enabled successfully");
    } catch (error) {
        const enableLogger = new Logger("", null);
        enableLogger.error(`Failed to enable extension: ${error}`);
    }
}

/**
 * Extension disable function
 */
function disable() {
    try {
        if (extension) {
            extension.destroy();
            extension = null;
        }
        const disableLogger = new Logger("", null);
        disableLogger.always("Extension disabled successfully");
    } catch (error) {
        const disableLogger = new Logger("", null);
        disableLogger.error(`Error disabling extension: ${error}`);
    }
}
