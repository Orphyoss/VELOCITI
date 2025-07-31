import crypto from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly STRATEGIC_TTL = 60 * 60 * 1000; // 1 hour for strategic analysis
  
  constructor() {
    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  generateKey(prompt: string, provider: string, context?: any): string {
    const normalizedPrompt = prompt.toLowerCase().trim();
    const contextStr = context ? JSON.stringify(context) : '';
    const combinedString = `${normalizedPrompt}:${provider}:${contextStr}`;
    return crypto.createHash('md5').update(combinedString).digest('hex');
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`[Cache] Hit for key: ${key.substring(0, 8)}...`);
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    const actualTtl = ttl || this.DEFAULT_TTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTtl
    });
    console.log(`[Cache] Stored key: ${key.substring(0, 8)}... (TTL: ${actualTtl / 1000}s)`);
  }

  setStrategicAnalysis(key: string, data: any): void {
    this.set(key, data, this.STRATEGIC_TTL);
  }

  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[Cache] Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries. Current size: ${this.cache.size}`);
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map(k => k.substring(0, 8) + '...')
    };
  }

  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }
}

export const cacheService = new CacheService();