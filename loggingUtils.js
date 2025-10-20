/* loggingUtils.js
 *
 * Centralized logging system for CSSGnomme
 * Provides standardized log formatting with module identification and debug filtering
 */

/* exported LogLevel, Logger */

const { GLib } = imports.gi;

/**
 * Log levels with filtering priority
 * ALWAYS: Critical messages that always appear (init, enable, disable, errors)
 * INFO: Important informational messages (shown when debug-logging=true)
 * WARN: Warning messages (always shown)
 * ERROR: Error messages (always shown)
 * DEBUG: Detailed debug messages (shown only when debug-logging=true)
 */
var LogLevel = {
    ALWAYS: 'ALWAYS',  // Critical lifecycle events (init, enable, disable)
    INFO: 'INFO',      // General information (shown with debug-logging)
    WARN: 'WARN',      // Warnings (always shown)
    ERROR: 'ERROR',    // Errors (always shown)
    DEBUG: 'DEBUG'     // Verbose debugging (shown with debug-logging)
};

/**
 * Centralized logger with standardized formatting
 * Format: [CSSGnomme:Module:LEVEL:HH:MM:SS.mmm] message
 *
 * Usage:
 *   const logger = new Logger('Extension', settings);
 *   logger.log(LogLevel.ALWAYS, 'Extension initialized');
 *   logger.log(LogLevel.INFO, 'Color extracted', {r: 100, g: 150, b: 200});
 *   logger.log(LogLevel.DEBUG, 'Detailed state', someObject);
 *
 * Reusable across projects - just change extension name in constants
 */
var Logger = class Logger {

    /**
     * Initialize logger
     * @param {string} module - Module name (Extension, ZorinStyler, ColorPalette, etc.)
     * @param {Gio.Settings} settings - Extension settings (optional, for debug-logging check)
     * @param {string} extensionName - Extension name prefix (default: 'CSSGnomme')
     */
    constructor(module = '', settings = null, extensionName = 'CSSGnomme') {
        this._module = module;
        this._settings = settings;
        this._extensionName = extensionName;

        // Cache debug state to avoid repeated GSettings lookups
        this._debugEnabled = settings ? settings.get_boolean('debug-logging') : false;
        this._debugSettingId = null;

        // Monitor debug setting changes
        if (settings) {
            this._debugSettingId = settings.connect('changed::debug-logging', () => {
                this._debugEnabled = settings.get_boolean('debug-logging');
            });
        }
    }

    /**
     * Main logging function with debug filtering
     * @param {string} level - LogLevel constant (ALWAYS, INFO, WARN, ERROR, DEBUG)
     * @param {string} message - Log message
     * @param {*} data - Optional data to append (will be stringified)
     */
    log(level, message, data = null) {
        // Check if message should be logged based on level and settings
        if (!this._shouldLog(level)) {
            return;
        }

        // Format: [CSSGnomme:Module:LEVEL:HH:MM:SS.mmm] message
        const formattedMessage = this._formatMessage(level, message, data);

        // Use standard GNOME log for all messages
        log(formattedMessage);
    }

    /**
     * Convenience methods for specific log levels
     */
    always(message, data = null) {
        this.log(LogLevel.ALWAYS, message, data);
    }

    info(message, data = null) {
        this.log(LogLevel.INFO, message, data);
    }

    warn(message, data = null) {
        this.log(LogLevel.WARN, message, data);
    }

    error(message, data = null) {
        this.log(LogLevel.ERROR, message, data);
    }

    debug(message, data = null) {
        this.log(LogLevel.DEBUG, message, data);
    }

    /**
     * Check if message should be logged based on level and debug setting
     * @param {string} level - LogLevel constant
     * @returns {boolean} True if should log
     * @private
     */
    _shouldLog(level) {
        // ALWAYS, WARN, ERROR always log regardless of settings
        if (level === LogLevel.ALWAYS || level === LogLevel.WARN || level === LogLevel.ERROR) {
            return true;
        }

        // INFO and DEBUG require debug-logging setting to be enabled
        if (level === LogLevel.INFO || level === LogLevel.DEBUG) {
            // Use cached debug state instead of GSettings lookup
            return this._debugEnabled;
        }

        return false;
    }

    /**
     * Format log message with timestamp and module info
     * @param {string} level - LogLevel constant
     * @param {string} message - Log message
     * @param {*} data - Optional data
     * @returns {string} Formatted message
     * @private
     */
    _formatMessage(level, message, data = null) {
        const timestamp = this._getTimestamp();

        // Build message parts
        const parts = [this._extensionName];

        // Add module if specified
        if (this._module && this._module.length > 0) {
            parts.push(this._module);
        }

        // Add level (but hide ALWAYS in output - it's internal only)
        const displayLevel = level === LogLevel.ALWAYS ? 'INFO' : level;
        parts.push(displayLevel);

        // Add timestamp
        parts.push(timestamp);

        // Format: [CSSGnomme:Module:LEVEL:HH:MM:SS.mmm] message
        let formatted = `[${parts.join(':')}] ${message}`;

        // Append data if provided
        if (data !== null && data !== undefined) {
            try {
                if (typeof data === 'object') {
                    formatted += ` ${JSON.stringify(data)}`;
                } else {
                    formatted += ` ${data}`;
                }
            } catch (e) {
                // If stringification fails, just append toString
                formatted += ` ${data.toString()}`;
            }
        }

        return formatted;
    }

    /**
     * Get current timestamp in HH:MM:SS.mmm format
     * @returns {string} Formatted timestamp
     * @private
     */
    _getTimestamp() {
        const now = GLib.DateTime.new_now_local();
        const hour = now.get_hour().toString().padStart(2, '0');
        const minute = now.get_minute().toString().padStart(2, '0');
        const second = now.get_second().toString().padStart(2, '0');
        const millisecond = (now.get_microsecond() / 1000).toFixed(0).padStart(3, '0');

        return `${hour}:${minute}:${second}.${millisecond}`;
    }

    /**
     * Update settings reference (useful if settings initialized after logger)
     * @param {Gio.Settings} settings - Extension settings
     */
    setSettings(settings) {
        // Disconnect old signal if exists
        if (this._debugSettingId && this._settings) {
            this._settings.disconnect(this._debugSettingId);
            this._debugSettingId = null;
        }

        this._settings = settings;

        // Update cached state and setup new monitoring
        if (settings) {
            this._debugEnabled = settings.get_boolean('debug-logging');
            this._debugSettingId = settings.connect('changed::debug-logging', () => {
                this._debugEnabled = settings.get_boolean('debug-logging');
            });
        }
    }

    /**
     * Create child logger with same settings but different module name
     * Useful for sub-components
     * @param {string} childModule - Child module name
     * @returns {Logger} New logger instance
     */
    createChild(childModule) {
        return new Logger(childModule, this._settings, this._extensionName);
    }

    /**
     * Cleanup logger resources
     * Disconnects signal handlers to prevent memory leaks
     */
    destroy() {
        if (this._debugSettingId && this._settings) {
            try {
                this._settings.disconnect(this._debugSettingId);
            } catch (e) {
                // Ignore disconnect errors during cleanup
            }
            this._debugSettingId = null;
        }
        this._settings = null;
    }
};
