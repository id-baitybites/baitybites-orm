"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

export type { OrderStatus };

export interface OrderListItem {
  id: string;
  orderRef: string;
  customer: string;
  customerPhone: string | null;
  channel: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  firstItemName: string;
  priority: "NORMAL" | "URGENT";
  createdAt: Date;
}

export interface OrderStats {
  total: number;
  menunggu: number;
  diproses: number;   // DIKONFIRMASI + DIMASAK + SIAP_PICKUP + DIKIRIM
  selesai: number;
  dibatalkan: number;
  omzetHariIni: number;
}

/**
 * Ambil semua orders dari PostgreSQL dengan info item & statistik
 */
export async function getOrdersAction(): Promise<{
  orders: OrderListItem[];
  stats: OrderStats;
}> {
  try {
    const orders = await db.order.findMany({
      include: {
        items: {
          select: { name: true },
          take: 1,
          orderBy: { id: "asc" },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const mapped: OrderListItem[] = orders.map((o) => ({
      id: o.id,
      orderRef: o.orderRef,
      customer: o.customer,
      customerPhone: o.customerPhone,
      channel: o.channel,
      status: o.status,
      totalAmount: o.totalAmount,
      itemCount: o._count.items,
      firstItemName: o.items[0]?.name ?? "–",
      priority: o.priority,
      createdAt: o.createdAt,
    }));

    const diproses: OrderStatus[] = [
      "DIKONFIRMASI",
      "DIMASAK",
      "SIAP_PICKUP",
      "DIKIRIM",
    ];

    const omzetHariIni = orders
      .filter((o) => o.createdAt >= startOfDay && o.status !== "DIBATALKAN")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      orders: mapped,
      stats: {
        total: orders.length,
        menunggu: orders.filter((o) => o.status === "MENUNGGU").length,
        diproses: orders.filter((o) => diproses.includes(o.status)).length,
        selesai: orders.filter((o) => o.status === "SELESAI").length,
        dibatalkan: orders.filter((o) => o.status === "DIBATALKAN").length,
        omzetHariIni,
      },
    };
  } catch (err) {
    console.error("getOrdersAction error:", err);
    return {
      orders: [],
      stats: {
        total: 0,
        menunggu: 0,
        diproses: 0,
        selesai: 0,
        dibatalkan: 0,
        omzetHariIni: 0,
      },
    };
  }
}

export interface OrderDetail {
  id: string;
  orderRef: string;
  customer: string;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddr: string | null;
  channel: string;
  status: OrderStatus;
  priority: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  note: string | null;
  createdAt: Date;
  cookStartedAt: Date | null;
  completedAt: Date | null;
  items: {
    id: string;
    name: string;
    price: number;
    qty: number;
    subtotal: number;
    notes: string | null;
  }[];
  payments: {
    id: string;
    paymentMethod: string;
    paymentStatus: string;
    amount: number;
    paidAt: Date | null;
    referenceCode: string | null;
  }[];
  statusHistory: {
    id: string;
    status: OrderStatus;
    note: string | null;
    actor: string | null;
    createdAt: Date;
  }[];
  clientRef: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    customerType: string;
  } | null;
}

/**
 * Ambil detail satu order berdasarkan orderRef (misal: "#WA-DIR-8908") atau ID
 */
export async function getOrderDetailAction(
  orderRefOrId: string
): Promise<{ order: OrderDetail | null; error?: string }> {
  try {
    // Coba cari berdasarkan orderRef dulu, fallback ke id
    const order = await db.order.findFirst({
      where: {
        OR: [{ orderRef: orderRefOrId }, { id: orderRefOrId }],
      },
      include: {
        items: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        clientRef: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            customerType: true,
          },
        },
      },
    });

    if (!order) {
      return { order: null, error: "Pesanan tidak ditemukan." };
    }

    return {
      order: {
        id: order.id,
        orderRef: order.orderRef,
        customer: order.customer,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryAddr: order.deliveryAddr,
        channel: order.channel,
        status: order.status,
        priority: order.priority,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        totalAmount: order.totalAmount,
        note: order.note,
        createdAt: order.createdAt,
        cookStartedAt: order.cookStartedAt,
        completedAt: order.completedAt,
        items: order.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          qty: it.qty,
          subtotal: it.subtotal,
          notes: it.notes,
        })),
        payments: order.payments.map((p) => ({
          id: p.id,
          paymentMethod: p.paymentMethod,
          paymentStatus: p.paymentStatus,
          amount: p.amount,
          paidAt: p.paidAt,
          referenceCode: p.referenceCode,
        })),
        statusHistory: order.statusHistory.map((h) => ({
          id: h.id,
          status: h.status,
          note: h.note,
          actor: h.actor,
          createdAt: h.createdAt,
        })),
        clientRef: order.clientRef
          ? {
              id: order.clientRef.id,
              name: order.clientRef.name,
              phone: order.clientRef.phone,
              email: order.clientRef.email,
              customerType: order.clientRef.customerType,
            }
          : null,
      },
    };
  } catch (err) {
    console.error("getOrderDetailAction error:", err);
    return { order: null, error: "Terjadi kesalahan saat memuat pesanan." };
  }
}

/**
 * Update status order dan catat ke history
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(newStatus === "DIMASAK" ? { cookStartedAt: new Date() } : {}),
          ...(newStatus === "SELESAI" ? { completedAt: new Date() } : {}),
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          note: note ?? null,
          actor: "ADMIN",
        },
      }),
    ]);

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/kitchen");

    return { success: true };
  } catch (err) {
    console.error("updateOrderStatusAction error:", err);
    return { success: false, error: "Gagal update status order." };
  }
}
