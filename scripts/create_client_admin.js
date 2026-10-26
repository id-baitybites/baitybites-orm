require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[Error] DATABASE_URL tidak ditemukan di environment variables.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createClientAdmin() {
  const args = process.argv.slice(2);
  const username = args[0] || process.env.CLIENT_ADMIN_USERNAME || "admin.demo";
  const displayName = args[1] || process.env.CLIENT_ADMIN_NAME || "Client Super Admin";
  const email = args[2] || process.env.CLIENT_ADMIN_EMAIL || null;
  const rawPassword = args[3] || process.env.CLIENT_ADMIN_PASSWORD || "ClientAdmin2026!#";
  const pin = args[4] || process.env.CLIENT_ADMIN_PIN || "1234";

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const pinHash = await bcrypt.hash(pin, 10);

  const existing = await prisma.admin.findUnique({
    where: { username }
  });

  let admin;
  const adminId = `adm-client-${username.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

  if (!existing) {
    admin = await prisma.admin.create({
      data: {
        id: adminId,
        username,
        displayName,
        passwordHash,
        pinHash,
        role: "SUPER_ADMIN",
        isActive: true,
        createdBy: "PLATFORM_OWNER",
      }
    });
    console.log(`[Success] Client Admin created: ${admin.username} (ID: ${admin.id})`);
  } else {
    admin = await prisma.admin.update({
      where: { username },
      data: {
        displayName,
        passwordHash,
        pinHash,
        isActive: true,
      }
    });
    console.log(`[Success] Client Admin credentials updated: ${admin.username}`);
  }

  // Update lead in client_leads table if email provided
  if (email) {
    await prisma.clientLead.updateMany({
      where: { email },
      data: {
        internalNotes: `Kredensial Client Admin telah disiapkan (${username}). Status otentikasi aktif.`,
        updatedAt: new Date(),
      }
    });
    console.log(`[Info] Updated lead records for email: ${email}`);
  }

  // Do not log raw credentials to stdout; only confirm completion
  return { username, role: "SUPER_ADMIN", isActive: true };
}

createClientAdmin()
  .then(res => {
    console.log(`[Done] Akun ${res.username} siap digunakan (Role: ${res.role}).`);
  })
  .catch((err) => {
    console.error("[Error] Gagal membuat client admin:", err?.message || err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
