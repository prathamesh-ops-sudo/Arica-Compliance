/**
 * Production-safe logger utility
 * Disables console logging in production builds
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log("[AricaInsights]", ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info("[AricaInsights]", ...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn("[AricaInsights]", ...args);
    }
  },

  error: (...args: unknown[]): void => {
    // Always log errors, but sanitize in production
    if (isDev) {
      console.error("[AricaInsights]", ...args);
    } else {
      // In production, log error message only (no stack traces)
      const sanitizedArgs = args.map((arg) =>
        arg instanceof Error ? arg.message : arg
      );
      console.error("[AricaInsights Error]", ...sanitizedArgs);
    }
  },

  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug("[AricaInsights]", ...args);
    }
  },
};

/**
 * Disable dev tools in production
 */
export function initProductionSecurity(): void {
  if (import.meta.env.PROD) {
    // Disable right-click context menu in production (optional)
    // document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Clear console on load
    console.clear();

    // Override console methods to prevent accidental logging
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    // Keep console.error and console.warn for critical issues
  }
}
