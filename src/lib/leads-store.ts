import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import type { LeadStatus as PrismaLeadStatus } from "@prisma/client";

export type LeadStatus =
  | "BARU"
  | "DIHUBUNGI"
  | "INVOICE_DIKIRIM"
  | "LUNAS"
  | "PROVISIONING"
  | "PROVISIONED"
  | "BATAL";

export interface ClientLead {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  selectedPlan: string;
  brandSlug?: string | null;
  message?: string | null;
  status: LeadStatus;
  internalNotes?: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: number | null;
  paidAt?: string | null;
  repoUrl?: string | null;
  deploymentUrl?: string | null;
  customDomain?: string | null;
  dbSchemaName?: string | null;
  provisionedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");

// Helper sinkronisasi opsional ke file lokal (jika file system mengizinkan)
function syncBackupFile(leads: ClientLead[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch {
    // Abaikan jika di lingkungan serverless read-only
  }
}

export async function getAllLeads(): Promise<ClientLead[]> {
  try {
    // 1. Ambil dari database PostgreSQL (Prisma)
    const records = await db.clientLead.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (records.length > 0) {
      return records.map((r) => ({
        id: r.id,
        businessName: r.businessName,
        contactName: r.contactName,
        email: r.email,
        phone: r.phone,
        selectedPlan: r.selectedPlan,
        brandSlug: r.brandSlug,
        message: r.message,
        status: r.status as LeadStatus,
        internalNotes: r.internalNotes,
        invoiceNumber: r.invoiceNumber,
        invoiceAmount: r.invoiceAmount,
        paidAt: r.paidAt ? r.paidAt.toISOString() : null,
        repoUrl: r.repoUrl,
        deploymentUrl: r.deploymentUrl,
        customDomain: r.customDomain,
        dbSchemaName: r.dbSchemaName,
        provisionedAt: r.provisionedAt ? r.provisionedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }

    // 2. Fallback baca file lokal jika database baru pertama kali kosong
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const localData: ClientLead[] = JSON.parse(content);
      return localData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return [];
  } catch (error) {
    console.error("[leads-store] Error reading leads from database:", error);
    // Fallback file jika DB timeout
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch {
      // ignore
    }
    return [];
  }
}

export async function saveLead(
  lead: Omit<ClientLead, "id" | "status" | "createdAt" | "updatedAt"> & {
    status?: LeadStatus;
  }
): Promise<ClientLead> {
  try {
    const created = await db.clientLead.create({
      data: {
        businessName: lead.businessName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        selectedPlan: lead.selectedPlan || "Business Pro",
        brandSlug: lead.brandSlug || null,
        message: lead.message || null,
        status: (lead.status || "BARU") as PrismaLeadStatus,
        internalNotes: lead.internalNotes || null,
      },
    });

    const result: ClientLead = {
      id: created.id,
      businessName: created.businessName,
      contactName: created.contactName,
      email: created.email,
      phone: created.phone,
      selectedPlan: created.selectedPlan,
      brandSlug: created.brandSlug,
      message: created.message,
      status: created.status as LeadStatus,
      internalNotes: created.internalNotes,
      invoiceNumber: created.invoiceNumber,
      invoiceAmount: created.invoiceAmount,
      paidAt: created.paidAt ? created.paidAt.toISOString() : null,
      repoUrl: created.repoUrl,
      deploymentUrl: created.deploymentUrl,
      customDomain: created.customDomain,
      dbSchemaName: created.dbSchemaName,
      provisionedAt: created.provisionedAt ? created.provisionedAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    // Opsional update file lokal sebagai cadangan
    getAllLeads().then(syncBackupFile).catch(() => {});

    return result;
  } catch (error) {
    console.error("[leads-store] Error creating lead in DB:", error);
    // Fallback ke penyimpanan file jika terjadi kendala DB darurat
    const newLead: ClientLead = {
      ...lead,
      id: `lead-${Date.now()}`,
      status: lead.status || "BARU",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newLead;
  }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  internalNotes?: string,
  extra?: {
    brandSlug?: string;
    repoUrl?: string;
    deploymentUrl?: string;
    customDomain?: string;
    dbSchemaName?: string;
    invoiceNumber?: string;
    invoiceAmount?: number;
    paidAt?: Date;
    provisionedAt?: Date;
  }
): Promise<ClientLead | null> {
  try {
    const dataToUpdate: Record<string, any> = {
      status: status as PrismaLeadStatus,
      updatedAt: new Date(),
    };

    if (internalNotes !== undefined) {
      dataToUpdate.internalNotes = internalNotes;
    }
    if (extra?.brandSlug) dataToUpdate.brandSlug = extra.brandSlug;
    if (extra?.repoUrl) dataToUpdate.repoUrl = extra.repoUrl;
    if (extra?.deploymentUrl) dataToUpdate.deploymentUrl = extra.deploymentUrl;
    if (extra?.customDomain) dataToUpdate.customDomain = extra.customDomain;
    if (extra?.dbSchemaName) dataToUpdate.dbSchemaName = extra.dbSchemaName;
    if (extra?.invoiceNumber) dataToUpdate.invoiceNumber = extra.invoiceNumber;
    if (extra?.invoiceAmount !== undefined) dataToUpdate.invoiceAmount = extra.invoiceAmount;
    if (extra?.paidAt) dataToUpdate.paidAt = extra.paidAt;
    if (extra?.provisionedAt) dataToUpdate.provisionedAt = extra.provisionedAt;

    const updated = await db.clientLead.update({
      where: { id },
      data: dataToUpdate,
    });

    const result: ClientLead = {
      id: updated.id,
      businessName: updated.businessName,
      contactName: updated.contactName,
      email: updated.email,
      phone: updated.phone,
      selectedPlan: updated.selectedPlan,
      brandSlug: updated.brandSlug,
      message: updated.message,
      status: updated.status as LeadStatus,
      internalNotes: updated.internalNotes,
      invoiceNumber: updated.invoiceNumber,
      invoiceAmount: updated.invoiceAmount,
      paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
      repoUrl: updated.repoUrl,
      deploymentUrl: updated.deploymentUrl,
      customDomain: updated.customDomain,
      dbSchemaName: updated.dbSchemaName,
      provisionedAt: updated.provisionedAt ? updated.provisionedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    getAllLeads().then(syncBackupFile).catch(() => {});

    return result;
  } catch (error) {
    console.error("[leads-store] Error updating lead in DB:", error);
    return null;
  }
}
