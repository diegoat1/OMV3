// Async Cache Service - Offline data caching with AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'omega_cache_';
const CACHE_EXPIRY_KEY = 'omega_cache_expiry_';

// Default cache duration: 24 hours
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000;

export const asyncCache = {
  async set<T>(key: string, data: T, expiryMs: number = DEFAULT_CACHE_DURATION): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_KEY}${key}`;
      const expiryTime = Date.now() + expiryMs;

      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      await AsyncStorage.setItem(expiryKey, expiryTime.toString());
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_KEY}${key}`;

      const expiryTime = await AsyncStorage.getItem(expiryKey);
      
      // Check if cache has expired
      if (expiryTime && Date.now() > parseInt(expiryTime, 10)) {
        await this.remove(key);
        return null;
      }

      const data = await AsyncStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_KEY}${key}`;

      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(expiryKey);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        key => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_KEY)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  // Get data with fallback to cache if fetch fails (offline support)
  async getWithFallback<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiryMs?: number
  ): Promise<{ data: T | null; fromCache: boolean }> {
    try {
      // Try to fetch fresh data
      const freshData = await fetchFn();
      
      // Cache the fresh data
      await this.set(key, freshData, expiryMs);
      
      return { data: freshData, fromCache: false };
    } catch (error) {
      // If fetch fails, try to get from cache
      const cachedData = await this.get<T>(key);
      
      if (cachedData) {
        return { data: cachedData, fromCache: true };
      }
      
      return { data: null, fromCache: false };
    }
  },

  // Queue data for sync when online
  async queueForSync(type: string, data: any): Promise<void> {
    try {
      const queueKey = 'omega_sync_queue';
      const existingQueue = await AsyncStorage.getItem(queueKey);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      queue.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: new Date().toISOString(),
      });
      
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Queue for sync error:', error);
    }
  },

  async getSyncQueue(): Promise<any[]> {
    try {
      const queueKey = 'omega_sync_queue';
      const queue = await AsyncStorage.getItem(queueKey);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Get sync queue error:', error);
      return [];
    }
  },

  async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem('omega_sync_queue');
    } catch (error) {
      console.error('Clear sync queue error:', error);
    }
  },
};
