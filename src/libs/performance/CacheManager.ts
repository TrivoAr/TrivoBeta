'use client';

import { LRUCache } from 'lru-cache';

/**
 * Cache Strategy Types
 */
export type CacheStrategy =
  | 'memory'
  | 'memory-lru'
  | 'session-storage'
  | 'local-storage'
  | 'indexed-db';

export type CacheInvalidationStrategy =
  | 'ttl'
  | 'tags'
  | 'dependency'
  | 'manual';

/**
 * Cache Entry Interface
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  dependencies: string[];
  version: number;
  metadata?: Record<string, any>;
}

/**
 * Cache Configuration
 */
export interface CacheConfig {
  strategy: CacheStrategy;
  defaultTtl: number;
  maxEntries: number;
  cleanupInterval: number;
  enableMetrics: boolean;
  serialization: {
    enabled: boolean;
    compress: boolean;
  };
}

/**
 * Cache Metrics
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  memoryUsage: number;
  lastAccess: number;
}

/**
 * Advanced Cache Manager with Multiple Strategies
 */
export class CacheManager {
  private strategies: Map<CacheStrategy, CacheStorage>;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private tagIndex: Map<string, Set<string>> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      strategy: 'memory-lru',
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      enableMetrics: true,
      serialization: {
        enabled: true,
        compress: false
      },
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      memoryUsage: 0,
      lastAccess: Date.now()
    };

    this.strategies = new Map();
    this.initializeStrategies();
    this.startCleanupInterval();
  }

  /**
   * Initialize cache storage strategies
   */
  private initializeStrategies(): void {
    // Memory LRU Cache
    this.strategies.set('memory-lru', new LRUCacheStorage(this.config));

    // Simple Memory Cache
    this.strategies.set('memory', new MemoryCacheStorage(this.config));

    // Browser Storage
    if (typeof window !== 'undefined') {
      this.strategies.set('session-storage', new SessionStorageCache(this.config));
      this.strategies.set('local-storage', new LocalStorageCache(this.config));
      this.strategies.set('indexed-db', new IndexedDBCache(this.config));
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string, strategy?: CacheStrategy): Promise<T | null> {
    const storage = this.getStorage(strategy);
    const entry = await storage.get(key);

    if (!entry) {
      this.updateMetrics('miss');
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      await this.delete(key, strategy);
      this.updateMetrics('miss');
      return null;
    }

    // Update last access
    entry.metadata = { ...entry.metadata, lastAccess: Date.now() };
    await storage.set(key, entry);

    this.updateMetrics('hit');
    return entry.data;
  }

  /**
   * Set cached value
   */
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
      strategy?: CacheStrategy;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const {
      ttl = this.config.defaultTtl,
      tags = [],
      dependencies = [],
      strategy,
      metadata = {}
    } = options;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      dependencies,
      version: 1,
      metadata: {
        ...metadata,
        lastAccess: Date.now()
      }
    };

    const storage = this.getStorage(strategy);
    await storage.set(key, entry);

    // Update tag index
    this.updateTagIndex(key, tags);

    // Update dependency graph
    this.updateDependencyGraph(key, dependencies);

    this.updateMetrics('set');
  }

  /**
   * Delete cached value
   */
  async delete(key: string, strategy?: CacheStrategy): Promise<boolean> {
    const storage = this.getStorage(strategy);
    const result = await storage.delete(key);

    if (result) {
      this.cleanupIndices(key);
      this.updateMetrics('delete');
    }

    return result;
  }

  /**
   * Clear cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToInvalidate = new Set<string>();

    for (const tag of tags) {
      const taggedKeys = this.tagIndex.get(tag);
      if (taggedKeys) {
        taggedKeys.forEach(key => keysToInvalidate.add(key));
      }
    }

    const deletePromises = Array.from(keysToInvalidate).map(key =>
      this.delete(key)
    );

    await Promise.all(deletePromises);
  }

  /**
   * Invalidate by dependencies
   */
  async invalidateByDependencies(dependencies: string[]): Promise<void> {
    const keysToInvalidate = new Set<string>();

    for (const dependency of dependencies) {
      const dependentKeys = this.dependencyGraph.get(dependency);
      if (dependentKeys) {
        dependentKeys.forEach(key => keysToInvalidate.add(key));
      }
    }

    const deletePromises = Array.from(keysToInvalidate).map(key =>
      this.delete(key)
    );

    await Promise.all(deletePromises);
  }

  /**
   * Clear all cache
   */
  async clear(strategy?: CacheStrategy): Promise<void> {
    if (strategy) {
      const storage = this.getStorage(strategy);
      await storage.clear();
    } else {
      const clearPromises = Array.from(this.strategies.values()).map(storage =>
        storage.clear()
      );
      await Promise.all(clearPromises);
    }

    this.tagIndex.clear();
    this.dependencyGraph.clear();
    this.resetMetrics();
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? this.metrics.hits / (this.metrics.hits + this.metrics.misses)
      : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Warm up cache with data
   */
  async warmUp<T>(
    entries: Array<{
      key: string;
      data: T;
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
    }>
  ): Promise<void> {
    const setPromises = entries.map(entry =>
      this.set(entry.key, entry.data, {
        ttl: entry.ttl,
        tags: entry.tags,
        dependencies: entry.dependencies
      })
    );

    await Promise.all(setPromises);
  }

  /**
   * Cleanup expired entries
   */
  private async cleanup(): Promise<void> {
    for (const [strategyName, storage] of Array.from(this.strategies)) {
      if (storage.cleanup) {
        await storage.cleanup();
      }
    }

    // Update memory usage
    this.updateMemoryUsage();
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get storage by strategy
   */
  private getStorage(strategy?: CacheStrategy): CacheStorage {
    const strategyToUse = strategy || this.config.strategy;
    const storage = this.strategies.get(strategyToUse);

    if (!storage) {
      throw new Error(`Cache strategy '${strategyToUse}' not available`);
    }

    return storage;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Update tag index
   */
  private updateTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(key: string, dependencies: string[]): void {
    for (const dependency of dependencies) {
      if (!this.dependencyGraph.has(dependency)) {
        this.dependencyGraph.set(dependency, new Set());
      }
      this.dependencyGraph.get(dependency)!.add(key);
    }
  }

  /**
   * Cleanup indices when key is deleted
   */
  private cleanupIndices(key: string): void {
    // Remove from tag index
    for (const [tag, keys] of Array.from(this.tagIndex)) {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagIndex.delete(tag);
      }
    }

    // Remove from dependency graph
    for (const [dependency, keys] of Array.from(this.dependencyGraph)) {
      keys.delete(key);
      if (keys.size === 0) {
        this.dependencyGraph.delete(dependency);
      }
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(type: 'hit' | 'miss' | 'set' | 'delete'): void {
    if (!this.config.enableMetrics) return;

    this.metrics[type === 'hit' ? 'hits' :
                  type === 'miss' ? 'misses' :
                  type === 'set' ? 'sets' : 'deletes']++;
    this.metrics.lastAccess = Date.now();
  }

  /**
   * Reset metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      memoryUsage: 0,
      lastAccess: Date.now()
    };
  }

  /**
   * Update memory usage estimation
   */
  private updateMemoryUsage(): void {
    if (!this.config.enableMetrics) return;

    // Rough estimation of memory usage
    let totalSize = 0;

    // Add size of tag index
    totalSize += this.tagIndex.size * 50; // rough estimate

    // Add size of dependency graph
    totalSize += this.dependencyGraph.size * 50; // rough estimate

    this.metrics.memoryUsage = totalSize;
  }
}

/**
 * Cache Storage Interface
 */
export interface CacheStorage {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  cleanup?(): Promise<void>;
}

/**
 * LRU Cache Storage Implementation
 */
class LRUCacheStorage implements CacheStorage {
  private cache: LRUCache<string, CacheEntry>;

  constructor(config: CacheConfig) {
    this.cache = new LRUCache({
      max: config.maxEntries,
      ttl: config.defaultTtl,
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });
  }

  async get(key: string): Promise<CacheEntry | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    this.cache.set(key, entry, { ttl: entry.ttl });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async cleanup(): Promise<void> {
    // LRU cache handles cleanup automatically
    this.cache.purgeStale();
  }
}

/**
 * Memory Cache Storage Implementation
 */
class MemoryCacheStorage implements CacheStorage {
  private cache: Map<string, CacheEntry> = new Map();

  constructor(private config: CacheConfig) {}

  async get(key: string): Promise<CacheEntry | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Session Storage Cache Implementation
 */
class SessionStorageCache implements CacheStorage {
  constructor(private config: CacheConfig) {}

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const data = sessionStorage.getItem(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    try {
      sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch {
      // Storage full or not available
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      sessionStorage.removeItem(`cache:${key}`);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(sessionStorage).filter(key =>
        key.startsWith('cache:')
      );
      keys.forEach(key => sessionStorage.removeItem(key));
    } catch {
      // Storage not available
    }
  }
}

/**
 * Local Storage Cache Implementation
 */
class LocalStorageCache implements CacheStorage {
  constructor(private config: CacheConfig) {}

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const data = localStorage.getItem(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch {
      // Storage full or not available
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(`cache:${key}`);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith('cache:')
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch {
      // Storage not available
    }
  }
}

/**
 * IndexedDB Cache Implementation
 */
class IndexedDBCache implements CacheStorage {
  private db: IDBDatabase | null = null;
  private dbName = 'axios-cache';
  private storeName = 'cache-entries';

  constructor(private config: CacheConfig) {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: string): Promise<CacheEntry | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<boolean> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * Global Cache Manager Instance
 */
export const cacheManager = new CacheManager({
  strategy: 'memory-lru',
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 1000,
  cleanupInterval: 60 * 1000, // 1 minute
  enableMetrics: true
});

/**
 * Cache Hook for React Components
 */
export function useCache() {
  return {
    get: cacheManager.get.bind(cacheManager),
    set: cacheManager.set.bind(cacheManager),
    delete: cacheManager.delete.bind(cacheManager),
    invalidateByTags: cacheManager.invalidateByTags.bind(cacheManager),
    invalidateByDependencies: cacheManager.invalidateByDependencies.bind(cacheManager),
    clear: cacheManager.clear.bind(cacheManager),
    metrics: cacheManager.getMetrics.bind(cacheManager)
  };
}