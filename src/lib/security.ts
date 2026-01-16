/**
 * Security utilities for AricaInsights
 * Provides XSS protection, input validation, and secure storage patterns
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this whenever rendering dynamic HTML content
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "span"],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize text content (strips all HTML)
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Validate and sanitize URL to prevent javascript: protocol attacks
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return url;
    }
    return "#";
  } catch {
    // Invalid URL, return safe default
    return "#";
  }
}

/**
 * Secure in-memory storage for sensitive data like tokens
 * Never use localStorage for JWTs - this keeps them in memory only
 */
class SecureMemoryStorage {
  private storage: Map<string, string> = new Map();

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  get(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

export const secureStorage = new SecureMemoryStorage();

/**
 * Input validation utilities using Zod-like patterns
 */
export const validators = {
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) && value.length <= 255;
  },

  password: (value: string): boolean => {
    return value.length >= 8 && value.length <= 128;
  },

  keyword: (value: string): boolean => {
    return value.length >= 2 && value.length <= 50 && /^[a-zA-Z0-9\s-]+$/.test(value);
  },

  reportName: (value: string): boolean => {
    return value.length >= 1 && value.length <= 100;
  },
};

/**
 * Encode user input for safe URL usage
 */
export function encodeForUrl(value: string): string {
  return encodeURIComponent(sanitizeText(value));
}
