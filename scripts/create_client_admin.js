require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createClientAdmin() {
  const username = "admin.sidrrevive";
  const rawPassword = "SidrRevive2026!#";
  const pin = "1234";
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const pinHash = await bcrypt.hash(pin, 10);

  const existing = await prisma.admin.findUnique({
    where: { username }
  });

  let admin;
  if (!existing) {
    admin = await prisma.admin.create({
      data: {
        id: "adm-client-sidrrevive",
        username,
        displayName: "Admin Sidr Revive (kmp)",
        passwordHash,
        pinHash,
        role: "SUPER_ADMIN",
        isActive: true,
        createdBy: "PLATFORM_OWNER",
      }
    });
    console.log("✅ Client Admin created successfully:", admin.username);
  } else {
    admin = await prisma.admin.update({
      where: { username },
      data: {
        passwordHash,
        pinHash,
        isActive: true,
      }
    });
    console.log("✅ Client Admin password/pin updated:", admin.username);
  }

  // Update lead in client_leads table
  await prisma.clientLead.updateMany({
    where: { email: "edukmp51@gmail.com" },
    data: {
      internalNotes: "Kredensial Client Admin telah dibuat (admin.sidrrevive). Status otentikasi aktif.",
      updatedAt: new Date(),
    }
  });

  return { username, rawPassword, pin };
}

createClientAdmin()
  .then(res => console.log("Credentials ready:", res))
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
