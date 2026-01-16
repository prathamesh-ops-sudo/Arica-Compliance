import logger from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000;

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
    logger.debug(`[Cache] Set key: ${key}, expires in ${(ttlMs || this.defaultTTL) / 1000}s`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug(`[Cache] Key expired: ${key}`);
      return null;
    }

    logger.debug(`[Cache] Hit: ${key}`);
    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    logger.info('[Cache] Cleared all entries');
  }

  clearPattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    logger.debug(`[Cache] Cleared ${count} entries matching pattern: ${pattern}`);
    return count;
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`[Cache] Cleanup removed ${cleaned} expired entries`);
    }
  }
}

export const analyticsCache = new InMemoryCache();

setInterval(() => {
  analyticsCache.cleanup();
}, 60 * 1000);

export const getCacheKey = (userId: string, type: string, params?: Record<string, unknown>): string => {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${type}:${userId}:${paramStr}`;
};

export default analyticsCache;
