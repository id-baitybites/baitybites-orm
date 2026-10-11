#!/usr/bin/env node
/**
 * Baitybites ORM — Database Backup Script
 *
 * Cara Penggunaan:
 *   node prisma/backup.js
 *
 * Atau via npm script (tambahkan ke package.json):
 *   "db:backup": "node prisma/backup.js"
 *
 * Environment Variables yang diperlukan:
 *   DATABASE_URL   — Connection string PostgreSQL (sama dengan .env)
 *   BACKUP_DIR     — (opsional) Direktori output, default: ./backups
 *
 * Untuk penjadwalan otomatis di Vercel/server, gunakan cron job
 * atau GitHub Actions (lihat .github/workflows/db-backup.yml).
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ── Konfigurasi ───────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || "30", 10); // Simpan 30 hari

if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL env var tidak ditemukan. Backup dibatalkan.");
  process.exit(1);
}

// ── Fungsi Utama ──────────────────────────────────────────────────────────────

function getTimestamp() {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁  Direktori backup dibuat: ${BACKUP_DIR}`);
  }
}

function rotateOldBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".sql") || f.endsWith(".sql.gz"))
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length >= MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS - 1);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, file.name));
      console.log(`🗑️   Backup lama dihapus: ${file.name}`);
    }
  }
}

function runBackup() {
  ensureBackupDir();
  rotateOldBackups();

  const timestamp = getTimestamp();
  const filename = `baitybites_backup_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  console.log(`\n🔄  Memulai backup database Baitybites ORM...`);
  console.log(`📅  Timestamp: ${new Date().toLocaleString("id-ID")}`);
  console.log(`📂  Output: ${filepath}\n`);

  try {
    // Gunakan pg_dump via DATABASE_URL
    // pg_dump harus tersedia di PATH (sudah include jika pakai PostgreSQL client)
    execSync(
      `pg_dump "${DATABASE_URL}" --no-owner --no-acl --clean --if-exists --format=plain > "${filepath}"`,
      { stdio: "inherit", shell: true }
    );

    const stats = fs.statSync(filepath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅  Backup berhasil!`);
    console.log(`📄  File: ${filename}`);
    console.log(`💾  Ukuran: ${sizeMb} MB`);
    console.log(`📁  Lokasi: ${filepath}`);
  } catch (err) {
    console.error("\n❌  Backup gagal:", err.message);
    // Hapus file parsial jika ada
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    process.exit(1);
  }
}

runBackup();
