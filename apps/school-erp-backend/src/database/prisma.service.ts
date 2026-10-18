import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

/**
 * High-Concurrency PrismaService with Primary Write Pool + Read-Replica Round-Robin Load Balancer.
 *
 * Architecture:
 * - Primary Write Pool (`this`): Handles all INSERT / UPDATE / DELETE / $transaction operations.
 * - Read Replica Cluster (`this.read` / `this.getReadClient()`): Distributes concurrent SELECT /
 *   analytics / directory queries across N read-replica connection pools using Round-Robin
 *   load balancing, keeping PostgreSQL buffer/connection overhead low and preventing slowdowns.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: pg.Pool;
  private readonly readPools: pg.Pool[] = [];
  private readonly readClients: PrismaClient[] = [];
  private rrIndex = 0;
  private readQueryCount = 0;
  private replicaHitCounts: number[] = [];

  constructor() {
    const primaryUrl = (
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@127.0.0.1:5432/school_erp?schema=public'
    ).replace('localhost', '127.0.0.1');

    // Primary Write Pool — tuned with low idle memory footprint and fast connection recycling
    const writePool = new pg.Pool({
      connectionString: primaryUrl,
      max: Number(process.env.DB_WRITE_POOL_MAX || 20),
      idleTimeoutMillis: 10000, // Low 10s idle timeout so idle backends don't bloat PostgreSQL cache
      connectionTimeoutMillis: 5000,
      maxUses: 5000,
    });
    const writeAdapter = new PrismaPg(writePool as any);
    super({ adapter: writeAdapter });
    this.pool = writePool;

    // Configure Read-Replica Load Balancer Pools (supports comma-separated DATABASE_REPLICA_URLS)
    const rawReplicaUrls = process.env.DATABASE_REPLICA_URLS || process.env.DATABASE_READ_URL || '';
    const replicaUrls = rawReplicaUrls
      .split(',')
      .map((u) => u.trim().replace('localhost', '127.0.0.1'))
      .filter(Boolean);

    // Always provision at least 2 load-balanced read pools so heavy analytical reads never starve writes
    const effectiveReadUrls =
      replicaUrls.length > 0 ? replicaUrls : [primaryUrl, primaryUrl];

    for (const url of effectiveReadUrls) {
      const rPool = new pg.Pool({
        connectionString: url,
        max: Number(process.env.DB_READ_POOL_MAX || 15),
        idleTimeoutMillis: 8000, // Low idle cache retention
        connectionTimeoutMillis: 5000,
        maxUses: 5000,
        // Set low statement_timeout & work_mem per read session to keep Postgres cache lean
        options: '-c statement_timeout=15000 -c work_mem=4MB',
      });
      const rAdapter = new PrismaPg(rPool as any);
      const rClient = new PrismaClient({ adapter: rAdapter });
      this.readPools.push(rPool);
      this.readClients.push(rClient);
      this.replicaHitCounts.push(0);
    }
  }

  /**
   * Round-Robin Read-Replica Load Balancer accessor.
   * Use `this.prisma.read.<model>.findMany(...)` for high-concurrency read/analytics queries.
   */
  get read(): PrismaClient {
    return this.getReadClient();
  }

  getReadClient(): PrismaClient {
    if (this.readClients.length === 0) {
      return this;
    }
    const idx = this.rrIndex % this.readClients.length;
    this.rrIndex = (this.rrIndex + 1) % this.readClients.length;
    this.readQueryCount++;
    this.replicaHitCounts[idx] = (this.replicaHitCounts[idx] || 0) + 1;
    return this.readClients[idx];
  }

  getLoadBalancerStatus() {
    return {
      strategy: 'ROUND_ROBIN_READ_REPLICA',
      primaryPool: {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      },
      readReplicaCount: this.readPools.length,
      totalBalancedReadQueries: this.readQueryCount,
      replicaDistribution: this.readPools.map((p, idx) => ({
        replicaId: `replica-${idx + 1}`,
        queriesServed: this.replicaHitCounts[idx] || 0,
        totalConnections: p.totalCount,
        idleConnections: p.idleCount,
        waitingRequests: p.waitingCount,
      })),
    };
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await Promise.all(this.readClients.map((c) => c.$connect()));
      this.logger.log(
        `✅ [PrismaService] Connected Primary Write Pool + ${this.readClients.length} Round-Robin Read-Replica Pools`,
      );
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL database:', error);
    }
  }

  async onModuleDestroy() {
    await Promise.allSettled(this.readClients.map((c) => c.$disconnect()));
    await Promise.allSettled(this.readPools.map((p) => p.end()));
    await this.$disconnect();
    await this.pool.end();
  }
}
