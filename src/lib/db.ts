import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const connectionString = process.env.DATABASE_URL;

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.pool = pool;
}
