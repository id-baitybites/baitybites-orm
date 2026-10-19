import fs from "fs";
import path from "path";

export type LeadStatus =
  | "BARU"
  | "DIHUBUNGI"
  | "INVOICE_DIKIRIM"
  | "LUNAS"
  | "PROVISIONED"
  | "BATAL";

export interface ClientLead {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  selectedPlan: string;
  message?: string;
  status: LeadStatus;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");

// Ensure data folder and initial file exist
function initStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initialLeads: ClientLead[] = [
      {
        id: "lead-001",
        businessName: "Toko Kue Ibu Lestari",
        contactName: "Lestari Rahayu",
        email: "lestari.test@gmail.com",
        phone: "081298765432",
        selectedPlan: "Starter Instance",
        message: "Uji coba pengiriman via Resend API Key",
        status: "BARU",
        internalNotes: "Permintaan pertama via platform landing page",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "lead-002",
        businessName: "Kopi Seduh Nusantara",
        contactName: "Rian Pratama",
        email: "rian.pratama@kopinusantara.id",
        phone: "081388776655",
        selectedPlan: "Business Pro",
        message: "Membutuhkan custom domain & sistem display dapur untuk 2 cabang kami di Bandung.",
        status: "DIHUBUNGI",
        internalNotes: "Sudah dihubungi via WA tgl 12 Okt, meminta draft penawaran resmi.",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialLeads, null, 2), "utf-8");
  }
}

export function getAllLeads(): ClientLead[] {
  try {
    initStore();
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const data: ClientLead[] = JSON.parse(content);
    return data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("[leads-store] Error reading leads:", error);
    return [];
  }
}

export function saveLead(lead: Omit<ClientLead, "id" | "status" | "createdAt" | "updatedAt">): ClientLead {
  initStore();
  const leads = getAllLeads();
  const newLead: ClientLead = {
    ...lead,
    id: `lead-${Date.now()}`,
    status: "BARU",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  leads.unshift(newLead);
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), "utf-8");
  return newLead;
}

export function updateLeadStatus(
  id: string,
  status: LeadStatus,
  internalNotes?: string
): ClientLead | null {
  initStore();
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  leads[idx] = {
    ...leads[idx],
    status,
    internalNotes: internalNotes !== undefined ? internalNotes : leads[idx].internalNotes,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), "utf-8");
  return leads[idx];
}
