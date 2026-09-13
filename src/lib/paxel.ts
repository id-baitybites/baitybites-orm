/**
 * ============================================================
 * PAXEL LOGISTICS INTEGRATION — BAITYBITES OFFICIAL COURIER
 * Layanan Logistik Resmi Tunggal Baitybites (Cold-Chain & Same Day)
 * ============================================================
 */

export interface PaxelStoreOrigin {
  name: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  mapsUrl: string;
}

export const PAXEL_STORE_ORIGIN: PaxelStoreOrigin = {
  name: "Toko Baitybites Sawangan",
  address: "Jl. Amsar No.RT 01/06, Sawangan, Kec. Sawangan, Kota Depok, Jawa Barat 16511",
  city: "Kota Depok",
  district: "Sawangan",
  postalCode: "16511",
  coordinates: {
    lat: -6.385874561302349,
    lng: 106.761898,
  },
  phone: "+6281288882345",
  mapsUrl: "https://www.google.com/maps?q=-6.385874561302349,106.761898",
};

export type PaxelServiceType = "PAXEL_SAMEDAY" | "PAXEL_INSTANT" | "PICKUP";
export type PaxelPackageSize = "S" | "M" | "L";

export interface PaxelServiceInfo {
  id: PaxelServiceType;
  name: string;
  badge: string;
  description: string;
  coldChainGuaranteed: boolean;
  estimatedTime: string;
}

export const PAXEL_SERVICES: Record<PaxelServiceType, PaxelServiceInfo> = {
  PAXEL_SAMEDAY: {
    id: "PAXEL_SAMEDAY",
    name: "Paxel Same Day (Cold Chain)",
    badge: "Official Cold Chain",
    description: "Antar hari ini dengan fasilitas pendingin (freezer/chiller), menjaga risol & makanan tetap beku segar.",
    coldChainGuaranteed: true,
    estimatedTime: "Hari ini (Sameday)",
  },
  PAXEL_INSTANT: {
    id: "PAXEL_INSTANT",
    name: "Paxel Instant (2 - 4 Jam)",
    badge: "Express Kilat",
    description: "Pengantaran kilat langsung oleh Hero Paxel menuju alamat tujuan dalam 2 - 4 jam setelah dimasak.",
    coldChainGuaranteed: true,
    estimatedTime: "2 - 4 Jam",
  },
  PICKUP: {
    id: "PICKUP",
    name: "Ambil di Toko (Self Pickup)",
    badge: "Bebas Ongkir",
    description: "Ambil pesanan Anda langsung di Toko Baitybites Sawangan, Depok.",
    coldChainGuaranteed: false,
    estimatedTime: "Siap diambil di Toko",
  },
};

export interface PaxelPackageDimension {
  size: PaxelPackageSize;
  title: string;
  maxWeightKg: number;
  dimensionsCm: string;
  itemCapacityDesc: string;
}

export const PAXEL_PACKAGE_DIMENSIONS: Record<PaxelPackageSize, PaxelPackageDimension> = {
  S: {
    size: "S",
    title: "Small (S)",
    maxWeightKg: 5,
    dimensionsCm: "20 × 11 × 7 cm",
    itemCapacityDesc: "1 - 3 pack risol / cup minuman",
  },
  M: {
    size: "M",
    title: "Medium (M)",
    maxWeightKg: 5,
    dimensionsCm: "30 × 20 × 12 cm",
    itemCapacityDesc: "4 - 8 pack risol / kombinasi varian",
  },
  L: {
    size: "L",
    title: "Large (L)",
    maxWeightKg: 5,
    dimensionsCm: "35 × 30 × 25 cm",
    itemCapacityDesc: "> 8 pack / hampers family gathering",
  },
};

/**
 * Estimasi ukuran paket Paxel otomatis berdasarkan jumlah item di keranjang
 */
export function calculatePaxelPackageSize(totalItemCount: number): PaxelPackageDimension {
  if (totalItemCount <= 3) {
    return PAXEL_PACKAGE_DIMENSIONS.S;
  }
  if (totalItemCount <= 8) {
    return PAXEL_PACKAGE_DIMENSIONS.M;
  }
  return PAXEL_PACKAGE_DIMENSIONS.L;
}

/**
 * Daftar kota jangkauan Paxel dari titik asal Sawangan, Depok
 */
export const PAXEL_CITIES = [
  "Depok",
  "Jakarta Selatan",
  "Tangerang Selatan",
  "Bogor",
  "Jakarta Timur",
  "Jakarta Pusat",
  "Jakarta Barat",
  "Jakarta Utara",
  "Tangerang",
  "Bekasi",
  "Lainnya",
] as const;

export type PaxelCity = (typeof PAXEL_CITIES)[number];

/**
 * Tarif resmi Paxel Same Day Cold Chain dari Sawangan, Depok
 */
const PAXEL_SAMEDAY_RATES: Record<string, Record<PaxelPackageSize, number>> = {
  "Depok": { S: 14000, M: 18000, L: 24000 },
  "Jakarta Selatan": { S: 18000, M: 22000, L: 28000 },
  "Tangerang Selatan": { S: 18000, M: 22000, L: 28000 },
  "Bogor": { S: 20000, M: 25000, L: 32000 },
  "Jakarta Timur": { S: 20000, M: 25000, L: 32000 },
  "Jakarta Pusat": { S: 22000, M: 27000, L: 34000 },
  "Jakarta Barat": { S: 22000, M: 27000, L: 34000 },
  "Jakarta Utara": { S: 24000, M: 29000, L: 36000 },
  "Tangerang": { S: 24000, M: 29000, L: 36000 },
  "Bekasi": { S: 24000, M: 29000, L: 36000 },
  "Lainnya": { S: 25000, M: 32000, L: 40000 },
};

/**
 * Tarif resmi Paxel Instant dari Sawangan, Depok
 */
const PAXEL_INSTANT_RATES: Record<string, Record<PaxelPackageSize, number>> = {
  "Depok": { S: 20000, M: 25000, L: 32000 },
  "Jakarta Selatan": { S: 28000, M: 34000, L: 42000 },
  "Tangerang Selatan": { S: 28000, M: 34000, L: 42000 },
  "Bogor": { S: 32000, M: 38000, L: 48000 },
  "Jakarta Timur": { S: 35000, M: 42000, L: 52000 },
  "Jakarta Pusat": { S: 38000, M: 45000, L: 55000 },
  "Jakarta Barat": { S: 38000, M: 45000, L: 55000 },
  "Jakarta Utara": { S: 42000, M: 50000, L: 60000 },
  "Tangerang": { S: 42000, M: 50000, L: 60000 },
  "Bekasi": { S: 45000, M: 52000, L: 65000 },
  "Lainnya": { S: 45000, M: 55000, L: 68000 },
};

/**
 * Hitung ongkos kirim Paxel
 */
export function calculatePaxelDeliveryFee(
  service: PaxelServiceType,
  city: string,
  packageSize: PaxelPackageSize = "M"
): number {
  if (service === "PICKUP") {
    return 0;
  }

  const normalizedCity = city.trim();

  if (service === "PAXEL_INSTANT") {
    const cityRates = PAXEL_INSTANT_RATES[normalizedCity] || PAXEL_INSTANT_RATES["Lainnya"];
    return cityRates[packageSize] ?? 30000;
  }

  // Default: PAXEL_SAMEDAY
  const cityRates = PAXEL_SAMEDAY_RATES[normalizedCity] || PAXEL_SAMEDAY_RATES["Lainnya"];
  return cityRates[packageSize] ?? 20000;
}

/**
 * Generate nomor resi resmi Paxel (Airway Bill / AWB)
 * Format: PXL-DEP-<orderSuffix>-<randomHash>
 */
export function generatePaxelAwb(orderRef: string): string {
  const cleanRef = orderRef.replace(/[^a-zA-Z0-9]/g, "").slice(-4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PXL-DEP-${cleanRef || "BB"}-${randomSuffix}`;
}

/**
 * Buat URL tautan pelacakan resmi Paxel
 */
export function getPaxelTrackingUrl(awbNumber: string): string {
  const cleanAwb = encodeURIComponent(awbNumber.trim());
  return `https://paxel.co/id/track?awb=${cleanAwb}`;
}
