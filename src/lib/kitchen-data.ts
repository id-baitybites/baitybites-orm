// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductionStatus =
  | "menunggu"
  | "dimasak"
  | "siap_pickup";

export type ProductionItem = {
  name: string;
  qty: number;
  notes?: string;
};

export type ProductionOrder = {
  id: string;
  orderRef: string;       // e.g. #WA-DIR-8908
  customer: string;
  channel: "WhatsApp" | "Tokopedia" | "Shopee" | "Walk-in";
  items: ProductionItem[];
  status: ProductionStatus;
  /** ISO timestamp when the order was placed */
  createdAt: string;
  /** ISO timestamp when cooking actually started (status changed to "dimasak") */
  cookStartedAt?: string;
  priority: "normal" | "urgent";
  note?: string;
};

// ─── Status helpers ───────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ProductionStatus, string> = {
  menunggu:    "Menunggu",
  dimasak:     "Sedang Dimasak",
  siap_pickup: "Siap Pickup",
};

export const STATUS_NEXT: Record<ProductionStatus, ProductionStatus | null> = {
  menunggu:    "dimasak",
  dimasak:     "siap_pickup",
  siap_pickup: null,
};

export const STATUS_NEXT_LABEL: Record<ProductionStatus, string | null> = {
  menunggu:    "Mulai Masak",
  dimasak:     "Tandai Siap",
  siap_pickup: null,
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const now = new Date();
const ago = (minutes: number) =>
  new Date(now.getTime() - minutes * 60 * 1000).toISOString();

export const INITIAL_ORDERS: ProductionOrder[] = [
  // ── MENUNGGU ────────────────────────────────────────────────────
  {
    id: "ord-001",
    orderRef: "#WA-DIR-0230",
    customer: "Dinda Rahayu",
    channel: "WhatsApp",
    items: [
      { name: "Risol Mayo Beef Double Cheese", qty: 4 },
      { name: "Risol Sayur Original", qty: 2 },
    ],
    status: "menunggu",
    createdAt: ago(3),
    priority: "normal",
  },
  {
    id: "ord-002",
    orderRef: "#WA-DIR-5512",
    customer: "Merlin Oktaviana",
    channel: "WhatsApp",
    items: [
      { name: "Risol Mayo Spicy Tuna", qty: 6 },
    ],
    status: "menunggu",
    createdAt: ago(7),
    priority: "urgent",
    note: "Alergi kacang, pastikan wajan bersih!",
  },
  {
    id: "ord-003",
    orderRef: "#TKP-2291",
    customer: "Bintang Wijaya",
    channel: "Tokopedia",
    items: [
      { name: "Risol Mayo Beef Double Cheese", qty: 2 },
      { name: "Risol Smoked Beef Mozza", qty: 3 },
      { name: "Risol Sayur Original", qty: 1 },
    ],
    status: "menunggu",
    createdAt: ago(12),
    priority: "normal",
  },

  // ── DIMASAK ─────────────────────────────────────────────────────
  {
    id: "ord-004",
    orderRef: "#WA-DIR-8908",
    customer: "Adelwy Saputri",
    channel: "WhatsApp",
    items: [
      { name: "Risol Mayo Beef Double Cheese", qty: 5 },
      { name: "Risol Spicy Tuna", qty: 3 },
    ],
    status: "dimasak",
    createdAt: ago(25),
    cookStartedAt: ago(18),
    priority: "normal",
  },
  {
    id: "ord-005",
    orderRef: "#SHP-7734",
    customer: "Rizki Aditya",
    channel: "Shopee",
    items: [
      { name: "Risol Smoked Beef Mozza", qty: 8 },
    ],
    status: "dimasak",
    createdAt: ago(40),
    cookStartedAt: ago(28), // > 20 mnt → urgent!
    priority: "urgent",
    note: "Pesanan ulang tahun, rapikan plating",
  },
  {
    id: "ord-006",
    orderRef: "#WA-DIR-4810",
    customer: "Siti Nuraini",
    channel: "WhatsApp",
    items: [
      { name: "Risol Mayo Beef Double Cheese", qty: 2 },
    ],
    status: "dimasak",
    createdAt: ago(20),
    cookStartedAt: ago(8),
    priority: "normal",
  },

  // ── SIAP PICKUP ─────────────────────────────────────────────────
  {
    id: "ord-007",
    orderRef: "#WA-DIR-3319",
    customer: "Lina Sumarni",
    channel: "WhatsApp",
    items: [
      { name: "Risol Sayur Original", qty: 4 },
      { name: "Risol Mayo Spicy Tuna", qty: 2 },
    ],
    status: "siap_pickup",
    createdAt: ago(55),
    cookStartedAt: ago(42),
    priority: "normal",
  },
  {
    id: "ord-008",
    orderRef: "#WLK-0019",
    customer: "Pak Hendra",
    channel: "Walk-in",
    items: [
      { name: "Risol Mayo Beef Double Cheese", qty: 10 },
    ],
    status: "siap_pickup",
    createdAt: ago(80),
    cookStartedAt: ago(65),
    priority: "normal",
  },
];
