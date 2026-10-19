require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedAdmins() {
  const pwPlatform = await bcrypt.hash('superadmin2026', 10);
  const pinPlatform = await bcrypt.hash('8899', 10);

  const pwClient = await bcrypt.hash('baitybites2026', 10);
  const pinClient = await bcrypt.hash('1234', 10);

  // 1. Admin Platform (Owner Baitybites ORM)
  await pool.query(
    `INSERT INTO admins (id, username, display_name, password_hash, pin_hash, is_active, created_at, updated_at, created_by)
     VALUES ('adm-platform-01', 'superadmin', 'Platform Owner (Baitybites ORM)', $1, $2, true, NOW(), NOW(), 'SYSTEM')
     ON CONFLICT (username) DO UPDATE
     SET password_hash = $1, pin_hash = $2, display_name = 'Platform Owner (Baitybites ORM)', is_active = true, updated_at = NOW()`,
    [pwPlatform, pinPlatform]
  );

  // 2. Admin Client Demo Baitybites
  await pool.query(
    `INSERT INTO admins (id, username, display_name, password_hash, pin_hash, is_active, created_at, updated_at, created_by)
     VALUES ('adm-client-01', 'admin.baitybites', 'Admin Demo Toko Baitybites', $1, $2, true, NOW(), NOW(), 'PLATFORM')
     ON CONFLICT (username) DO UPDATE
     SET password_hash = $1, pin_hash = $2, display_name = 'Admin Demo Toko Baitybites', is_active = true, updated_at = NOW()`,
    [pwClient, pinClient]
  );

  console.log('✅ Berhasil mengupdate akun Superadmin Platform dan Admin Client!');
  const res = await pool.query('SELECT username, display_name, is_active FROM admins');
  console.log('DAFTAR AKUN AKTIF:', res.rows);
  await pool.end();
}

seedAdmins().catch((err) => {
  console.error('❌ Error seeding admins:', err);
  pool.end();
});
