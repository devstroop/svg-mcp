import NodeCache from 'node-cache';

class CacheManager {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 3600) { // 1 hour default
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }

  // Generate cache key for icon requests
  generateIconKey(name: string, library: string, format: string, size?: number): string {
    return `icon:${library}:${name}:${format}:${size || 'default'}`;
  }

  // Generate cache key for search results
  generateSearchKey(query: string, libraries: string[], limit: number): string {
    return `search:${query}:${libraries.join(',')}:${limit}`;
  }
}

export const cacheManager = new CacheManager();
