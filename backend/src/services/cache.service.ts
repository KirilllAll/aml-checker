import NodeCache from 'node-cache';
import { logger } from '../config/logger';

export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
    });

    // Log cache statistics periodically
    setInterval(() => {
      const stats = this.cache.getStats();
      logger.debug('Cache stats:', stats);
    }, 300000); // Every 5 minutes
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 300, // 5 minutes
  ): Promise<T> {
    const cachedData = this.cache.get<T>(key);
    if (cachedData !== undefined) {
      logger.debug(`Cache hit for key: ${key}`);
      return cachedData;
    }

    logger.debug(`Cache miss for key: ${key}`);
    const freshData = await fetchFn();
    this.cache.set(key, freshData, ttl);
    return freshData;
  }

  public del(key: string): void {
    this.cache.del(key);
  }

  public flush(): void {
    this.cache.flushAll();
  }
}
