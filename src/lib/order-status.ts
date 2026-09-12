export type SystemStatusType =
  | "MENUNGGU"
  | "CONFIRMED"
  | "DIMASAK"
  | "SIAP_PICKUP"
  | "PACKING"
  | "SHIPPING"
  | "SELESAI"
  | "DIBATALKAN";

export interface StatusStyleConfig {
  label: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  btnBg: string;
  btnHoverBg: string;
  btnColor: string;
  btnShadow: string;
}

/**
 * Standard Status Color Design Tokens Baitybites:
 * - MENUNGGU / NEW: Biru Safir (#2563eb / #eff6ff)
 * - CONFIRMED: Biru Cyan (#0284c7 / #f0f9ff)
 * - DIMASAK / PROCESSING: Hijau Emerald (#059669 / #ecfdf5)
 * - SIAP_PICKUP / READY / PACKING: Oranye Cerah Baitybites (#f97316 / #fff7ed)
 * - SHIPPING: Ungu / Violet (#7c3aed / #f5f3ff)
 * - SELESAI / COMPLETED: Slate Netral / Indigo (#475569 / #f1f5f9)
 * - DIBATALKAN: Merah Crimson (#dc2626 / #fef2f2)
 */
export const STATUS_PALETTE: Record<string, StatusStyleConfig> = {
  MENUNGGU: {
    label: "MENUNGGU",
    badgeBg: "#eff6ff",
    badgeColor: "#1d4ed8",
    badgeBorder: "#bfdbfe",
    btnBg: "#2563eb",
    btnHoverBg: "#1d4ed8",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
  },
  NEW: {
    label: "MENUNGGU",
    badgeBg: "#eff6ff",
    badgeColor: "#1d4ed8",
    badgeBorder: "#bfdbfe",
    btnBg: "#2563eb",
    btnHoverBg: "#1d4ed8",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
  },
  CONFIRMED: {
    label: "DIKONFIRMASI",
    badgeBg: "#f0f9ff",
    badgeColor: "#0284c7",
    badgeBorder: "#bae6fd",
    btnBg: "#0284c7",
    btnHoverBg: "#0369a1",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
  },
  DIMASAK: {
    label: "SEDANG DIMASAK",
    badgeBg: "#ecfdf5",
    badgeColor: "#047857",
    badgeBorder: "#a7f3d0",
    btnBg: "#059669",
    btnHoverBg: "#047857",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
  },
  PROCESSING: {
    label: "PRODUKSI",
    badgeBg: "#ecfdf5",
    badgeColor: "#047857",
    badgeBorder: "#a7f3d0",
    btnBg: "#059669",
    btnHoverBg: "#047857",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
  },
  SIAP_PICKUP: {
    label: "READY TO SHIP",
    badgeBg: "#fff7ed",
    badgeColor: "#c2410c",
    badgeBorder: "#fed7aa",
    btnBg: "#f97316",
    btnHoverBg: "#ea580c",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(249, 115, 22, 0.28)",
  },
  READY: {
    label: "READY TO SHIP",
    badgeBg: "#fff7ed",
    badgeColor: "#c2410c",
    badgeBorder: "#fed7aa",
    btnBg: "#f97316",
    btnHoverBg: "#ea580c",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(249, 115, 22, 0.28)",
  },
  PACKING: {
    label: "PENGEMASAN",
    badgeBg: "#fff7ed",
    badgeColor: "#c2410c",
    badgeBorder: "#fed7aa",
    btnBg: "#f97316",
    btnHoverBg: "#ea580c",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(249, 115, 22, 0.28)",
  },
  SHIPPING: {
    label: "PENGIRIMAN",
    badgeBg: "#f5f3ff",
    badgeColor: "#6d28d9",
    badgeBorder: "#ddd6fe",
    btnBg: "#7c3aed",
    btnHoverBg: "#6d28d9",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(124, 58, 237, 0.25)",
  },
  SELESAI: {
    label: "SELESAI",
    badgeBg: "#f1f5f9",
    badgeColor: "#334155",
    badgeBorder: "#cbd5e1",
    btnBg: "#475569",
    btnHoverBg: "#334155",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(71, 85, 105, 0.25)",
  },
  COMPLETED: {
    label: "SELESAI",
    badgeBg: "#f1f5f9",
    badgeColor: "#334155",
    badgeBorder: "#cbd5e1",
    btnBg: "#475569",
    btnHoverBg: "#334155",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(71, 85, 105, 0.25)",
  },
  DIBATALKAN: {
    label: "DIBATALKAN",
    badgeBg: "#fef2f2",
    badgeColor: "#b91c1c",
    badgeBorder: "#fecaca",
    btnBg: "#dc2626",
    btnHoverBg: "#b91c1c",
    btnColor: "#ffffff",
    btnShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
  },
};

export function getStatusStyle(status: string): StatusStyleConfig {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, "_") : "MENUNGGU";
  return (
    STATUS_PALETTE[normalized] || {
      label: status || "UNKNOWN",
      badgeBg: "#f1f5f9",
      badgeColor: "#475569",
      badgeBorder: "#cbd5e1",
      btnBg: "#475569",
      btnHoverBg: "#334155",
      btnColor: "#ffffff",
      btnShadow: "none",
    }
  );
}
