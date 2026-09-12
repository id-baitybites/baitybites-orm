/**
 * Script seed: Buat akun superadmin pertama dari env variable ke tabel `admins`.
 * Jalankan sekali: npx tsx prisma/seed-admin.ts
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.SUPERADMIN_USERNAME || "superadmin";
  const password = process.env.SUPERADMIN_PASSWORD || "baitybites2026";
  const pin = process.env.SUPERADMIN_PIN || "9988";

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`✓ Admin "${username}" sudah ada, seed dilewati.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const pinHash = await bcrypt.hash(pin, 10);

  await prisma.admin.create({
    data: {
      username,
      displayName: "Super Admin",
      passwordHash,
      pinHash,
      isActive: true,
      createdBy: "SYSTEM",
    },
  });

  console.log(`✓ Admin "${username}" berhasil dibuat dari env variables.`);
}

main()
  .catch((e) => {
    console.error("Seed gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect().then(() => pool.end()));
