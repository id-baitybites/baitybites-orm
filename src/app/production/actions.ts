"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

export interface ProductionItemData {
  id: string;
  orderRef: string;
  productName: string;
  qty: number;
  customerName: string;
  channel: string;
  status: OrderStatus;
  orderCreatedAt: string;
  cookStartedAt?: string | null;
  targetTime: string;
  durationText: string;
  breakdownText: string;
  timelineTimes: {
    orderPlaced: string;
    cookStarted?: string | null;
    readyPickup?: string | null;
  };
}

/**
 * Mengambil antrean produksi dari database (dengan fallback data lengkap)
 */
export async function getProductionQueueAction(): Promise<ProductionItemData[]> {
  try {
    const orders = await db.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (orders.length === 0) {
      return getFallbackProductionData();
    }

    const result: ProductionItemData[] = [];

    orders.forEach((o) => {
      // Hanya tampilkan order yang sedang aktif dalam siklus produksi (MENUNGGU, DIMASAK, SIAP_PICKUP, DIKIRIM)
      const isProductionOrder = ["MENUNGGU", "DIMASAK", "SIAP_PICKUP", "DIKIRIM"].includes(o.status);
      if (!isProductionOrder) return;

      const orderDate = new Date(o.createdAt);
      const timeStr = orderDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
      
      const cookTime = o.cookStartedAt 
        ? new Date(o.cookStartedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".")
        : null;

      // Target waktu estimasi: +60 menit dari order dibuat
      const targetDate = new Date(orderDate.getTime() + 60 * 60 * 1000);
      const targetStr = targetDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");

      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          result.push({
            id: `${o.id}-${item.id}`,
            orderRef: o.orderRef.replace(/^#/, ""),
            productName: item.name,
            qty: item.qty,
            customerName: o.customer,
            channel: o.channel,
            status: o.status,
            orderCreatedAt: o.createdAt.toISOString(),
            cookStartedAt: o.cookStartedAt?.toISOString() || null,
            targetTime: targetStr,
            durationText: "60 menit",
            breakdownText: "30m Prod + 15m Pack + 15m Pickup",
            timelineTimes: {
              orderPlaced: timeStr,
              cookStarted: cookTime,
              readyPickup: o.status === "SIAP_PICKUP" || o.status === "DIKIRIM" ? targetStr : null,
            },
          });
        });
      } else {
        result.push({
          id: o.id,
          orderRef: o.orderRef.replace(/^#/, ""),
          productName: "Risol Mix Assorted",
          qty: 1,
          customerName: o.customer,
          channel: o.channel,
          status: o.status,
          orderCreatedAt: o.createdAt.toISOString(),
          cookStartedAt: o.cookStartedAt?.toISOString() || null,
          targetTime: targetStr,
          durationText: "60 menit",
          breakdownText: "30m Prod + 15m Pack + 15m Pickup",
          timelineTimes: {
            orderPlaced: timeStr,
            cookStarted: cookTime,
            readyPickup: o.status === "SIAP_PICKUP" ? targetStr : null,
          },
        });
      }
    });

    return result.length > 0 ? result : getFallbackProductionData();
  } catch (err) {
    console.error("Error getProductionQueueAction:", err);
    return getFallbackProductionData();
  }
}

/**
 * Update status tahap produksi
 */
export async function updateProductionStatusAction(
  orderRefWithOrWithoutHash: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanRef = orderRefWithOrWithoutHash.trim();
    const refs = [cleanRef, cleanRef.startsWith("#") ? cleanRef.slice(1) : `#${cleanRef}`];

    const foundOrder = await db.order.findFirst({
      where: {
        OR: refs.map((r) => ({ orderRef: r })),
      },
    });

    if (!foundOrder) {
      return { success: false, error: "Pesanan tidak ditemukan di database." };
    }

    await db.order.update({
      where: { id: foundOrder.id },
      data: {
        status: newStatus,
        ...(newStatus === "DIMASAK" && !foundOrder.cookStartedAt ? { cookStartedAt: new Date() } : {}),
        ...(newStatus === "SELESAI" ? { completedAt: new Date() } : {}),
      },
    });

    await db.orderStatusHistory.create({
      data: {
        orderId: foundOrder.id,
        status: newStatus,
        actor: "PRODUCTION",
        note: `Status diperbarui ke ${newStatus} dari dashboard antrean produksi`,
      },
    });

    revalidatePath("/production");
    revalidatePath("/kitchen");
    revalidatePath("/orders");
    return { success: true };
  } catch (err: unknown) {
    console.error("updateProductionStatusAction error:", err);
    const message = err instanceof Error ? err.message : "Gagal memperbarui status produksi.";
    return { success: false, error: message };
  }
}

function getFallbackProductionData(): ProductionItemData[] {
  return [
    {
      id: "prod-demo-1",
      orderRef: "WA-DIR-2722",
      productName: "Risol Chocolate Cheese",
      qty: 3,
      customerName: "Mak Warsih",
      channel: "WhatsApp",
      status: "SIAP_PICKUP",
      orderCreatedAt: new Date().toISOString(),
      targetTime: "11.30",
      durationText: "60 menit",
      breakdownText: "30m Prod + 15m Pack + 15m Pickup",
      timelineTimes: {
        orderPlaced: "07.45",
        cookStarted: "10.30",
        readyPickup: "09.05",
      },
    },
    {
      id: "prod-demo-2",
      orderRef: "WA-DIR-8908",
      productName: "Risol Mayo Beef Double Cheese",
      qty: 5,
      customerName: "Adelwy Saputri",
      channel: "WhatsApp",
      status: "DIMASAK",
      orderCreatedAt: new Date().toISOString(),
      targetTime: "12.00",
      durationText: "45 menit",
      breakdownText: "25m Goreng + 10m Pack + 10m Pickup",
      timelineTimes: {
        orderPlaced: "09.15",
        cookStarted: "11.15",
        readyPickup: null,
      },
    },
    {
      id: "prod-demo-3",
      orderRef: "WA-DIR-3319",
      productName: "Hampers Family Gathering Box",
      qty: 2,
      customerName: "Merlin Oktaviana",
      channel: "WhatsApp",
      status: "SIAP_PICKUP",
      orderCreatedAt: new Date().toISOString(),
      targetTime: "13.45",
      durationText: "90 menit",
      breakdownText: "45m Prep + 25m Pack + 20m Pickup",
      timelineTimes: {
        orderPlaced: "10.00",
        cookStarted: "12.15",
        readyPickup: "13.20",
      },
    },
    {
      id: "prod-demo-4",
      orderRef: "WA-DIR-0230",
      productName: "Risol Mayo Beef Double Cheese",
      qty: 4,
      customerName: "Dinda Rahayu",
      channel: "WhatsApp",
      status: "MENUNGGU",
      orderCreatedAt: new Date().toISOString(),
      targetTime: "14.15",
      durationText: "30 menit",
      breakdownText: "15m Frozen Prep + 15m Pickup",
      timelineTimes: {
        orderPlaced: "13.30",
        cookStarted: null,
        readyPickup: null,
      },
    },
  ];
}
