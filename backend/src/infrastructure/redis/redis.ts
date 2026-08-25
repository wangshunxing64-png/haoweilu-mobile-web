import { Redis } from "ioredis";

export function createRedisClient(url: string): Redis {
  return new Redis(url, {
    lazyConnect: true,
    connectTimeout: 1_000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
}
