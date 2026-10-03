import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryCacheEntry {
  value: string;
  expiresAt: number | null;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memoryFallback = new Map<string, MemoryCacheEntry>();
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // don't hang if offline
      });

      this.client
        .connect()
        .then(() => {
          this.isConnected = true;
          this.logger.log(`✅ [RedisService] Connected to Redis server at ${redisUrl}`);
        })
        .catch((err) => {
          this.isConnected = false;
          this.logger.warn(`⚠️ [RedisService] Redis server not reachable (${err.message}). Using high-speed in-memory fallback cache.`);
        });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`⚠️ [RedisService] Redis client error: ${err.message}`);
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`⚡ [RedisService] Connection established`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err) {
      this.isConnected = false;
      this.logger.warn(`⚠️ [RedisService] Redis init failed: ${(err as Error).message}. Using in-memory fallback.`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        if (!raw) {
          this.logger.debug(`[Redis GET] Key "${key}" -> MISS (Redis)`);
          return null;
        }
        this.logger.debug(`[Redis GET] Key "${key}" -> HIT (Redis)`);
        return JSON.parse(raw) as T;
      } catch (err: any) {
        this.logger.warn(`[Redis GET] Error reading key "${key}": ${err.message}. Falling back to memory.`);
      }
    }

    const entry = this.memoryFallback.get(key);
    if (!entry) {
      this.logger.debug(`[Redis GET] Key "${key}" -> MISS (Memory)`);
      return null;
    }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryFallback.delete(key);
      this.logger.debug(`[Redis GET] Key "${key}" -> EXPIRED (Memory)`);
      return null;
    }
    this.logger.debug(`[Redis GET] Key "${key}" -> HIT (Memory)`);
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, serialized, 'EX', ttlSeconds);
          this.logger.debug(`[Redis SET] Key "${key}" stored (TTL: ${ttlSeconds}s)`);
        } else {
          await this.client.set(key, serialized);
          this.logger.debug(`[Redis SET] Key "${key}" stored (Permanent)`);
        }
        return;
      } catch (err: any) {
        this.logger.warn(`[Redis SET] Error writing key "${key}": ${err.message}. Storing in memory.`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryFallback.set(key, { value: serialized, expiresAt });
    this.logger.debug(`[Redis SET] Key "${key}" stored in memory (TTL: ${ttlSeconds || 'Permanent'}s)`);
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        this.logger.debug(`[Redis DEL] Key "${key}" deleted from Redis`);
      } catch (err: any) {
        this.logger.warn(`[Redis DEL] Error deleting key "${key}": ${err.message}`);
      }
    }
    this.memoryFallback.delete(key);
    this.logger.debug(`[Redis DEL] Key "${key}" purged from cache`);
  }

  async delPattern(pattern: string): Promise<number> {
    let deletedCount = 0;

    // 1. Purge matching keys from Redis
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
          deletedCount += keys.length;
          this.logger.log(`[Redis DEL-PATTERN] Purged ${keys.length} keys matching "${pattern}" from Redis`);
        }
      } catch (err: any) {
        this.logger.warn(`[Redis DEL-PATTERN] Error with pattern "${pattern}": ${err.message}`);
      }
    }

    // 2. Purge matching keys from in-memory fallback
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of Array.from(this.memoryFallback.keys())) {
      if (regex.test(key)) {
        this.memoryFallback.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async flushAll(): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.flushall();
        this.logger.log(`[Redis FLUSH] All Redis cache keys flushed`);
      } catch (err: any) {
        this.logger.warn(`[Redis FLUSH] Error flushing Redis: ${err.message}`);
      }
    }
    this.memoryFallback.clear();
    this.logger.log(`[Redis FLUSH] In-memory cache cleared`);
  }

  async publish(channel: string, message: any): Promise<void> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.isConnected && this.client) {
      try {
        await this.client.publish(channel, payload);
        this.logger.debug(`[Redis PUBLISH] Broadcasted message to channel "${channel}"`);
      } catch (err) {
        this.logger.warn(`[Redis PUBLISH] Failed on channel "${channel}": ${(err as Error).message}`);
      }
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
