import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Menjalankan migrasi aman untuk tabel customers...");

    await client.query(`
      ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "google_id" TEXT;
      ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
      ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "district" TEXT;
      ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
      ALTER TABLE "customers" ALTER COLUMN "phone" DROP NOT NULL;
    `);

    // Tambahkan unique index jika belum ada
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'customers' AND indexname = 'customers_google_id_key'
        ) THEN
          CREATE UNIQUE INDEX "customers_google_id_key" ON "customers"("google_id");
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'customers' AND indexname = 'customers_email_key'
        ) THEN
          CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
        END IF;
      END $$;
    `);

    console.log("✓ Kolom & indeks berhasil ditambahkan ke tabel customers tanpa kehilangan data!");
  } catch (err) {
    console.error("Gagal melakukan migrasi:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
