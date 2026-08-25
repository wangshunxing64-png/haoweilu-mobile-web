import type { Redis } from "ioredis";

import { AppError } from "../errors/app-error.ts";

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

export class IdempotencyService {
  private readonly redis?: Redis;
  private readonly ttlSeconds: number;
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly inFlight = new Set<string>();

  constructor(redis?: Redis, ttlSeconds = 600) {
    this.redis = redis;
    this.ttlSeconds = ttlSeconds;
  }

  async run<T>(scope: string, idempotencyKey: string | undefined, operation: () => Promise<T>): Promise<T> {
    if (!idempotencyKey) return operation();
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
      throw new AppError("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key 格式不合法", 400);
    }

    const key = `idem:${scope}:${idempotencyKey}`;
    const localReplay = this.getMemory<T>(key);
    if (localReplay.hit) return localReplay.value as T;

    const redisResult = await this.tryRedis<T>(key, operation);
    if (redisResult.usedRedis) return redisResult.value as T;

    return this.runInMemory(key, operation);
  }

  private async tryRedis<T>(
    key: string,
    operation: () => Promise<T>,
  ): Promise<{ usedRedis: boolean; value?: T }> {
    if (!this.redis) return { usedRedis: false };

    const resultKey = `${key}:result`;
    const lockKey = `${key}:lock`;
    let cached: string | null;
    let lock: unknown;

    try {
      cached = await this.redis.get(resultKey);
      if (cached) return { usedRedis: true, value: JSON.parse(cached) as T };
      lock = await this.redis.set(lockKey, "1", "PX", 30_000, "NX");
    } catch {
      return { usedRedis: false };
    }

    if (lock !== "OK") {
      try {
        const replay = await this.redis.get(resultKey);
        if (replay) return { usedRedis: true, value: JSON.parse(replay) as T };
      } catch {
        return { usedRedis: false };
      }
      throw new AppError("IDEMPOTENCY_IN_PROGRESS", "相同请求正在处理中，请稍后重试", 409);
    }

    let resultPersisted = false;
    try {
      const value = await operation();
      this.rememberMemory(key, value);
      try {
        await this.redis.set(resultKey, JSON.stringify(value), "EX", this.ttlSeconds);
        resultPersisted = true;
      } catch {
        // The mutation already completed. Keep a local replay and retain the Redis lock
        // instead of reopening a window for an immediate duplicate mutation.
      }
      return { usedRedis: true, value };
    } finally {
      if (resultPersisted) {
        await this.redis.del(lockKey).catch(() => undefined);
      } else {
        await this.redis.pexpire(lockKey, this.ttlSeconds * 1000).catch(() => undefined);
      }
    }
  }

  private async runInMemory<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const cached = this.getMemory<T>(key);
    if (cached.hit) return cached.value as T;

    if (this.inFlight.has(key)) {
      throw new AppError("IDEMPOTENCY_IN_PROGRESS", "相同请求正在处理中，请稍后重试", 409);
    }

    this.inFlight.add(key);
    try {
      const value = await operation();
      this.rememberMemory(key, value);
      return value;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private getMemory<T>(key: string): { hit: boolean; value?: T } {
    const cached = this.memory.get(key);
    if (!cached) return { hit: false };
    if (cached.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return { hit: false };
    }
    return { hit: true, value: JSON.parse(cached.value) as T };
  }

  private rememberMemory<T>(key: string, value: T): void {
    this.memory.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

}
