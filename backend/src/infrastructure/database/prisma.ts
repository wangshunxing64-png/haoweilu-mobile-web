import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

export interface PrismaConnectionOptions {
  max?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

export function createPrismaClient(
  connectionString = process.env.DATABASE_URL,
  options: PrismaConnectionOptions = {},
): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const adapter = new PrismaPg({
    connectionString,
    max: options.max ?? 10,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
  });

  return new PrismaClient({ adapter });
}
