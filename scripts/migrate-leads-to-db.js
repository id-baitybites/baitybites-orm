require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log("Migrating leads and provisioned clients into database table 'client_leads'...");

  // 1. Baca data existing dari data/leads.json
  const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
  let existingLeads = [];
  if (fs.existsSync(leadsPath)) {
    try {
      existingLeads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    } catch (e) {
      console.warn("Could not parse leads.json:", e.message);
    }
  }

  for (const lead of existingLeads) {
    const existing = await prisma.clientLead.findFirst({
      where: {
        OR: [
          { email: lead.email },
          { id: lead.id }
        ]
      }
    });

    if (!existing) {
      await prisma.clientLead.create({
        data: {
          id: lead.id || undefined,
          businessName: lead.businessName,
          contactName: lead.contactName,
          email: lead.email,
          phone: lead.phone,
          selectedPlan: lead.selectedPlan || "Business Pro",
          message: lead.message || null,
          status: lead.status || "BARU",
          internalNotes: lead.internalNotes || null,
          createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date(),
          updatedAt: lead.updatedAt ? new Date(lead.updatedAt) : new Date(),
        }
      });
      console.log(`✅ Migrated lead: ${lead.businessName} (${lead.email})`);
    } else {
      console.log(`ℹ️ Lead already exists: ${lead.businessName} (${lead.email})`);
    }
  }

  // 2. Catat juga instance aktif saat ini (Baitybites) sebagai tenant pertama yang berstatus PROVISIONED
  const baitybitesLead = await prisma.clientLead.findFirst({
    where: { businessName: "Baitybites" }
  });

  if (!baitybitesLead) {
    await prisma.clientLead.create({
      data: {
        id: "lead-client-baitybites",
        businessName: "Baitybites",
        contactName: "Admin Baitybites",
        email: "id.baitybites@gmail.com",
        phone: "+62 812 8888 2345",
        selectedPlan: "Enterprise Dedicated",
        brandSlug: "baitybites",
        message: "Exclusive White-Label E-Commerce & OMS flagship instance",
        status: "PROVISIONED",
        internalNotes: "Flagship reference instance — repository id-baitybites/baitybites-orm",
        invoiceNumber: "INV-BB-ORIGIN-001",
        invoiceAmount: 3900000,
        paidAt: new Date("2026-09-12T13:43:12.938Z"),
        repoUrl: "https://github.com/id-baitybites/baitybites-orm",
        deploymentUrl: "https://baitybites-orm.vercel.app",
        customDomain: "baitybites.site",
        dbSchemaName: "public",
        provisionedAt: new Date("2026-09-12T13:43:12.938Z"),
        createdAt: new Date("2026-09-12T13:43:12.938Z"),
        updatedAt: new Date(),
      }
    });
    console.log("✅ Seeded flagship tenant instance: Baitybites (Status: PROVISIONED)");
  } else {
    console.log("ℹ️ Flagship tenant Baitybites already recorded.");
  }

  const count = await prisma.clientLead.count();
  console.log(`Total records in 'client_leads': ${count}`);
}

migrate()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
