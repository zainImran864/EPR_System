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
          this.logger.log(`Connected to Redis at ${redisUrl}`);
        })
        .catch((err) => {
          this.isConnected = false;
          this.logger.warn(`Redis not available (${err.message}). Using high-speed in-memory fallback cache.`);
        });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.debug(`Redis client error: ${err.message}`);
      });
    } catch (err) {
      this.isConnected = false;
      this.logger.warn(`Redis init failed: ${(err as Error).message}. Using in-memory fallback.`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        // Fall back to memory cache
      }
    }

    const entry = this.memoryFallback.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, serialized);
        }
        return;
      } catch {
        // Fall back to memory cache
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryFallback.set(key, { value: serialized, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {}
    }
    this.memoryFallback.delete(key);
  }

  async publish(channel: string, message: any): Promise<void> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.isConnected && this.client) {
      try {
        await this.client.publish(channel, payload);
      } catch (err) {
        this.logger.warn(`Redis publish failed: ${(err as Error).message}`);
      }
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
