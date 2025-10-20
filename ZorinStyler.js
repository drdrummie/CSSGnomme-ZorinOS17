const { St, GObject, Clutter, Gio, Meta, GLib, Gtk, Gdk } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

/**
 * ZorinStyler - Manages Zorin OS taskbar panel styling
 * Integrates with Zorin OS Taskbar extension for transparency control
 * Only active when enable-zorin-integration setting is enabled
 */
var ZorinStyler = GObject.registerClass(
    class ZorinStyler extends GObject.Object {
        /**
         * Initialize ZorinStyler
         * @param {Gio.Settings} settings - Extension settings object
         * @param {Logger} logger - Logger instance for standardized logging
         */
        _init(settings, logger = null) {
            super._init();

            this._settings = settings;
            this._zorinSettings = null;
            this._isConnected = false;
            this._originalIntellihideState = undefined; // Track original intellihide state

            // Use provided logger or create fallback log function
            if (logger) {
                this._logger = logger;
            } else {
                // Fallback if no logger provided (shouldn't happen but safe)
                this._logger = {
                    info: (msg) => log(`[CSSGnomme:ZorinStyler:INFO] ${msg}`),
                    warn: (msg) => log(`[CSSGnomme:ZorinStyler:WARN] ${msg}`),
                    error: (msg) => log(`[CSSGnomme:ZorinStyler:ERROR] ${msg}`),
                    debug: (msg) => log(`[CSSGnomme:ZorinStyler:DEBUG] ${msg}`)
                };
            }

            this._connectToZorinSettings();
        }

        /**
         * Attempts to connect to Zorin Taskbar settings via GSettings
         */
        _connectToZorinSettings() {
            try {
                this._zorinSettings = ExtensionUtils.getSettings('org.gnome.shell.extensions.zorin-taskbar');

                if (this._zorinSettings) {
                    this._isConnected = true;
                    this._logger.info('Successfully connected to Zorin Taskbar settings via GSettings');
                } else {
                    this._logger.warn('Could not access Zorin Taskbar GSettings');
                }
            } catch (error) {
                this._logger.error(`Error accessing Zorin Taskbar GSettings: ${error}`);
            }
        }

        /**
         * Updates panel opacity on Zorin Taskbar
         * @param {number} opacity - Opacity value (0.0 - 1.0)
         */
        updateOpacity(opacity) {
            if (!this._isConnected) return;

            this._zorinSettings.set_boolean('trans-use-custom-opacity', true);
            this._zorinSettings.set_double('trans-panel-opacity', opacity);

            this._logger.debug(`Panel opacity updated to: ${opacity}`);
        }

        /**
         * Sets dynamic opacity settings
         * @private
         */
        _updateDynamicOpacity() {
            if (!this._isConnected) return;

            this._zorinSettings.set_boolean('trans-use-dynamic-opacity', false);
        }

        /**
         * Sets base opacity settings
         * @private
         */
        _updateOpacity() {
            if (!this._isConnected) return;

            this._zorinSettings.set_boolean('trans-use-custom-opacity', true);
            const defaultOpacity = this._settings.get_double('panel-opacity');
            this._zorinSettings.set_double('trans-panel-opacity', defaultOpacity);
        }

        /**
         * Check if Zorin Taskbar has intellihide enabled
         * When intellihide is ON, Zorin manages floating/hiding behavior
         * When intellihide is OFF, CSSGnomme can safely add horizontal margin for floating effect
         * @returns {boolean} True if intellihide is active
         */
        isIntellihideEnabled() {
            if (!this._isConnected) {
                return false;
            }

            try {
                return this._zorinSettings.get_boolean('intellihide');
            } catch (e) {
                this._logger.warn(`Could not read Zorin intellihide state: ${e.message}`);
                return false;
            }
        }

        /**
         * Manage Zorin intellihide to create floating panel effect
         * When user enables panel radius, we enable Zorin's intellihide for floating effect
         * Stores original intellihide state for restoration
         * @param {boolean} enableFloating - Enable floating panel via intellihide
         */
        manageFloatingPanel(enableFloating) {
            if (!this._isConnected) {
                this._logger.warn('Zorin Taskbar not connected - cannot manage floating panel');
                return;
            }

            try {
                if (enableFloating) {
                    // Save original intellihide state (if not already saved)
                    if (!this._originalIntellihideState !== undefined) {
                        this._originalIntellihideState = this._zorinSettings.get_boolean('intellihide');
                        this._logger.debug(`Saved original intellihide state: ${this._originalIntellihideState}`);
                    }

                    // Enable intellihide for floating effect
                    if (!this._originalIntellihideState) {
                        this._zorinSettings.set_boolean('intellihide', true);
                        this._logger.info('Enabled Zorin intellihide for floating panel effect');
                    } else {
                        this._logger.debug('Intellihide already enabled by user - preserving');
                    }
                } else {
                    // Restore original intellihide state
                    if (this._originalIntellihideState !== undefined) {
                        this._zorinSettings.set_boolean('intellihide', this._originalIntellihideState);
                        this._logger.info(`Restored Zorin intellihide to original state: ${this._originalIntellihideState}`);
                        this._originalIntellihideState = undefined;
                    }
                }
            } catch (e) {
                this._logger.error(`Error managing floating panel: ${e.message}`);
            }
        }

        /**
         * Destroys the ZorinStyler instance
         */
        destroy() {
            if (this._zorinSettings) {
                this._zorinSettings.run_dispose();
                this._zorinSettings = null;
            }
            this._isConnected = false;

            this._logger.info('ZorinStyler destroyed');
        }
    }
);
