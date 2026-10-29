import localforage from 'localforage';

// Initialize localforage store for Alumni Association non-sensitive offline cache
const alumniStorage = localforage.createInstance({
  name: 'AlumniAssociationCache',
  storeName: 'alumni_offline_data',
  description: 'IndexedDB cache for non-sensitive public feed, member directory, and branding logo'
});

// Explicit list of forbidden sensitive keys that must NEVER be written to local storage
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /hash/i,
  /otp/i,
  /secret/i,
  /credential/i,
  /token/i,
  /private_key/i
];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
}

export const CacheService = {
  /**
   * Safe set item: Rejects sensitive keys
   */
  async setItem<T>(key: string, value: T): Promise<T | null> {
    if (isSensitiveKey(key)) {
      console.warn(`[CacheService] Blocked caching attempt for sensitive key: ${key}`);
      return null;
    }
    try {
      return await alumniStorage.setItem<T>(key, value);
    } catch (err) {
      console.error(`[CacheService] Error setting cache for key ${key}:`, err);
      return null;
    }
  },

  /**
   * Safe get item
   */
  async getItem<T>(key: string): Promise<T | null> {
    if (isSensitiveKey(key)) {
      return null;
    }
    try {
      return await alumniStorage.getItem<T>(key);
    } catch (err) {
      console.error(`[CacheService] Error reading cache for key ${key}:`, err);
      return null;
    }
  },

  /**
   * Remove item
   */
  async removeItem(key: string): Promise<void> {
    try {
      await alumniStorage.removeItem(key);
    } catch (err) {
      console.error(`[CacheService] Error removing key ${key}:`, err);
    }
  },

  /**
   * Clear all non-sensitive cached data
   */
  async clearAll(): Promise<void> {
    try {
      await alumniStorage.clear();
    } catch (err) {
      console.error('[CacheService] Error clearing cache:', err);
    }
  }
};
