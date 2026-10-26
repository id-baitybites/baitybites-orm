require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[Error] DATABASE_URL tidak ditemukan di environment.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function seedAdmins() {
  const pwPlatformRaw = process.env.SUPERADMIN_INITIAL_PASSWORD || 'superadmin2026';
  const pinPlatformRaw = process.env.SUPERADMIN_INITIAL_PIN || '8899';
  const pwClientRaw = process.env.CLIENT_DEMO_INITIAL_PASSWORD || 'baitybites2026';
  const pinClientRaw = process.env.CLIENT_DEMO_INITIAL_PIN || '1234';

  const pwPlatform = await bcrypt.hash(pwPlatformRaw, 10);
  const pinPlatform = await bcrypt.hash(pinPlatformRaw, 10);

  const pwClient = await bcrypt.hash(pwClientRaw, 10);
  const pinClient = await bcrypt.hash(pinClientRaw, 10);

  // 1. Admin Platform (Owner Baitybites ORM)
  await pool.query(
    `INSERT INTO admins (id, username, display_name, password_hash, pin_hash, role, is_active, created_at, updated_at, created_by)
     VALUES ('adm-platform-01', 'superadmin', 'Platform Owner (Baitybites ORM)', $1, $2, 'PLATFORM_OWNER', true, NOW(), NOW(), 'SYSTEM')
     ON CONFLICT (username) DO UPDATE
     SET password_hash = $1, pin_hash = $2, role = 'PLATFORM_OWNER', display_name = 'Platform Owner (Baitybites ORM)', is_active = true, updated_at = NOW()`,
    [pwPlatform, pinPlatform]
  );

  // 2. Admin Client Demo Baitybites
  await pool.query(
    `INSERT INTO admins (id, username, display_name, password_hash, pin_hash, role, is_active, created_at, updated_at, created_by)
     VALUES ('adm-client-01', 'admin.baitybites', 'Admin Demo Toko Baitybites', $1, $2, 'SUPER_ADMIN', true, NOW(), NOW(), 'PLATFORM')
     ON CONFLICT (username) DO UPDATE
     SET password_hash = $1, pin_hash = $2, role = 'SUPER_ADMIN', display_name = 'Admin Demo Toko Baitybites', is_active = true, updated_at = NOW()`,
    [pwClient, pinClient]
  );

  console.log('[Success] Berhasil mengupdate akun Superadmin Platform dan Admin Client.');
  const res = await pool.query('SELECT username, display_name, role, is_active FROM admins');
  console.log('Daftar Akun Aktif:', res.rows);
  await pool.end();
}

seedAdmins().catch((err) => {
  console.error('[Error] Gagal seeding admins:', err?.message || err);
  pool.end();
});
