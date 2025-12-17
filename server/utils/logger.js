/**
 * Structured Logger Utility
 * Provides consistent, color-coded logging with configurable levels
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const COLORS = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    CYAN: '\x1b[36m',
    GREEN: '\x1b[32m',
    GRAY: '\x1b[90m'
};

class Logger {
    constructor() {
        // Set log level based on environment
        // Production: ERROR and WARN only
        // Development: All levels
        this.currentLevel = process.env.NODE_ENV === 'production'
            ? LOG_LEVELS.WARN
            : LOG_LEVELS.DEBUG;
    }

    /**
     * Format timestamp
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 19);
    }

    /**
     * Log error messages (always shown)
     */
    error(message, ...args) {
        if (this.currentLevel >= LOG_LEVELS.ERROR) {
            console.error(
                `${COLORS.RED}[ERROR]${COLORS.RESET} ${COLORS.GRAY}${this.getTimestamp()}${COLORS.RESET} ${message}`,
                ...args
            );
        }
    }

    /**
     * Log warning messages
     */
    warn(message, ...args) {
        if (this.currentLevel >= LOG_LEVELS.WARN) {
            console.warn(
                `${COLORS.YELLOW}[WARN]${COLORS.RESET} ${COLORS.GRAY}${this.getTimestamp()}${COLORS.RESET} ${message}`,
                ...args
            );
        }
    }

    /**
     * Log info messages (development only)
     */
    info(message, ...args) {
        if (this.currentLevel >= LOG_LEVELS.INFO) {
            console.log(
                `${COLORS.BLUE}[INFO]${COLORS.RESET} ${COLORS.GRAY}${this.getTimestamp()}${COLORS.RESET} ${message}`,
                ...args
            );
        }
    }

    /**
     * Log debug messages (development only)
     */
    debug(message, ...args) {
        if (this.currentLevel >= LOG_LEVELS.DEBUG) {
            console.log(
                `${COLORS.CYAN}[DEBUG]${COLORS.RESET} ${COLORS.GRAY}${this.getTimestamp()}${COLORS.RESET} ${message}`,
                ...args
            );
        }
    }

    /**
     * Log success messages
     */
    success(message, ...args) {
        if (this.currentLevel >= LOG_LEVELS.INFO) {
            console.log(
                `${COLORS.GREEN}[SUCCESS]${COLORS.RESET} ${COLORS.GRAY}${this.getTimestamp()}${COLORS.RESET} ${message}`,
                ...args
            );
        }
    }

    /**
     * Auth-specific logging (only errors in production)
     */
    auth(level, message, ...args) {
        if (level === 'error') {
            this.error(`[AUTH] ${message}`, ...args);
        } else if (level === 'warn') {
            this.warn(`[AUTH] ${message}`, ...args);
        } else {
            this.debug(`[AUTH] ${message}`, ...args);
        }
    }
}

// Export singleton instance
module.exports = new Logger();
