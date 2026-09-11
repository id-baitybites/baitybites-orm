"use server";

import { db } from "@/lib/db";

export interface TrackedOrderItem {
  name: string;
  qty: number;
  notes?: string | null;
}

export interface TrackedOrderResult {
  id: string;
  orderRef: string;
  customer: string;
  channel: string;
  status: "MENUNGGU" | "DIMASAK" | "SIAP_PICKUP";
  priority: "NORMAL" | "URGENT";
  createdAt: string;
  cookStartedAt?: string | null;
  items: TrackedOrderItem[];
  note?: string | null;
}

export async function trackOrderAction(
  orderNumber: string
): Promise<{ success: boolean; data?: TrackedOrderResult; error?: string }> {
  const cleanNumber = orderNumber.trim();

  if (!cleanNumber) {
    return { success: false, error: "Silakan masukkan nomor pesanan Anda." };
  }

  try {
    // Cari di DB Neon terlebih dahulu (baik dengan atau tanpa tanda '#')
    const searchVariants = [
      cleanNumber,
      cleanNumber.startsWith("#") ? cleanNumber.slice(1) : `#${cleanNumber}`,
      cleanNumber.toUpperCase(),
      `#${cleanNumber.replace(/^#/, "").toUpperCase()}`,
    ];

    const foundInDb = await db.order.findFirst({
      where: {
        OR: searchVariants.map((ref) => ({ orderRef: ref })),
      },
      include: {
        items: true,
      },
    });

    if (foundInDb) {
      return {
        success: true,
        data: {
          id: foundInDb.id,
          orderRef: foundInDb.orderRef,
          customer: foundInDb.customer,
          channel: foundInDb.channel,
          status: foundInDb.status as "MENUNGGU" | "DIMASAK" | "SIAP_PICKUP",
          priority: foundInDb.priority as "NORMAL" | "URGENT",
          createdAt: foundInDb.createdAt.toISOString(),
          cookStartedAt: foundInDb.cookStartedAt ? foundInDb.cookStartedAt.toISOString() : null,
          note: foundInDb.note,
          items: foundInDb.items.map((i) => ({
            name: i.name,
            qty: i.qty,
            notes: i.notes,
          })),
        },
      };
    }

    // Mock fallback jika user memasukkan nomor sample seperti #WA-DIR-8908, #WA-DIR-0230, dsb
    const normalized = cleanNumber.toUpperCase();
    if (normalized.includes("8908")) {
      return {
        success: true,
        data: {
          id: "mock-8908",
          orderRef: "#WA-DIR-8908",
          customer: "Adelwy",
          channel: "WhatsApp",
          status: "DIMASAK",
          priority: "NORMAL",
          createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
          cookStartedAt: new Date(Date.now() - 15 * 60000).toISOString(),
          items: [
            { name: "Risol Mayo Beef Double Cheese", qty: 5 },
            { name: "Risol Spicy Tuna", qty: 3 },
          ],
        },
      };
    }

    if (normalized.includes("0230")) {
      return {
        success: true,
        data: {
          id: "mock-0230",
          orderRef: "#WA-DIR-0230",
          customer: "Dinda",
          channel: "WhatsApp",
          status: "MENUNGGU",
          priority: "NORMAL",
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          items: [
            { name: "Risol Mayo Beef Double Cheese", qty: 4 },
            { name: "Risol Sayur Original", qty: 2 },
          ],
        },
      };
    }

    if (normalized.includes("3319")) {
      return {
        success: true,
        data: {
          id: "mock-3319",
          orderRef: "#WA-DIR-3319",
          customer: "Merlin",
          channel: "WhatsApp",
          status: "SIAP_PICKUP",
          priority: "NORMAL",
          createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
          cookStartedAt: new Date(Date.now() - 40 * 60000).toISOString(),
          items: [
            { name: "Risol Sayur Original", qty: 4 },
            { name: "Cendol Matcha Cup", qty: 2 },
          ],
        },
      };
    }

    return {
      success: false,
      error: `Pesanan dengan nomor "${cleanNumber}" tidak ditemukan. Pastikan format nomor order sudah benar (contoh: #WA-DIR-8908).`,
    };
  } catch (err) {
    console.error("Tracking order error:", err);
    return {
      success: false,
      error: "Gagal mengambil data pesanan. Silakan coba lagi beberapa saat.",
    };
  }
}
