"use server";

import { db } from "@/lib/db";

export interface DashboardStats {
  totalOrders: number;
  menunggu: number;
  diproses: number;
  selesai: number;
  dibatalkan: number;
  omzetHariIni: number;
  omzetBulanIni: number;
  totalPelanggan: number;
}

export interface DashboardHighlight {
  topSpender: { name: string; totalSpent: number } | null;
  topOrderer: { name: string; totalOrders: number } | null;
  topProduct: { name: string; totalQty: number } | null;
}

export interface DashboardOrderQueue {
  id: string;
  orderRef: string;
  customer: string;
  status: string;
  createdAt: Date;
  totalAmount: number;
}

export interface DashboardOrderFlow {
  menunggu: number;
  dikonfirmasi: number;
  dimasak: number;
  siapPickup: number;
  dikirim: number;
  selesai: number;
  dibatalkan: number;
}

export interface DashboardData {
  stats: DashboardStats;
  highlight: DashboardHighlight;
  recentOrders: DashboardOrderQueue[];
  orderFlow: DashboardOrderFlow;
}

export async function getDashboardDataAction(): Promise<DashboardData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Ambil semua data yang dibutuhkan secara paralel
    const [orders, totalPelanggan] = await Promise.all([
      db.order.findMany({
        include: {
          items: {
            select: { name: true, qty: true, productId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.customer.count(),
    ]);

    // ── Statistik Utama ───────────────────────────────────────────────────
    const diproses: string[] = ["DIKONFIRMASI", "DIMASAK", "SIAP_PICKUP", "DIKIRIM"];

    const stats: DashboardStats = {
      totalOrders: orders.length,
      menunggu: orders.filter((o) => o.status === "MENUNGGU").length,
      diproses: orders.filter((o) => diproses.includes(o.status)).length,
      selesai: orders.filter((o) => o.status === "SELESAI").length,
      dibatalkan: orders.filter((o) => o.status === "DIBATALKAN").length,
      omzetHariIni: orders
        .filter((o) => o.createdAt >= startOfDay && o.status !== "DIBATALKAN")
        .reduce((s, o) => s + o.totalAmount, 0),
      omzetBulanIni: orders
        .filter((o) => o.createdAt >= startOfMonth && o.status !== "DIBATALKAN")
        .reduce((s, o) => s + o.totalAmount, 0),
      totalPelanggan,
    };

    // ── Alur Pesanan ──────────────────────────────────────────────────────
    const orderFlow: DashboardOrderFlow = {
      menunggu: orders.filter((o) => o.status === "MENUNGGU").length,
      dikonfirmasi: orders.filter((o) => o.status === "DIKONFIRMASI").length,
      dimasak: orders.filter((o) => o.status === "DIMASAK").length,
      siapPickup: orders.filter((o) => o.status === "SIAP_PICKUP").length,
      dikirim: orders.filter((o) => o.status === "DIKIRIM").length,
      selesai: orders.filter((o) => o.status === "SELESAI").length,
      dibatalkan: orders.filter((o) => o.status === "DIBATALKAN").length,
    };

    // ── Highlight: Top Spender, Top Orderer ───────────────────────────────
    const customerMap = new Map<string, { name: string; spent: number; orders: number }>();
    for (const order of orders) {
      if (order.status === "DIBATALKAN") continue;
      const key = order.customerId ?? order.customer;
      const cur = customerMap.get(key) ?? { name: order.customer, spent: 0, orders: 0 };
      cur.spent += order.totalAmount;
      cur.orders += 1;
      customerMap.set(key, cur);
    }

    const customers = Array.from(customerMap.values());
    const topSpenderData = customers.sort((a, b) => b.spent - a.spent)[0] ?? null;
    const topOrdererData = customers.sort((a, b) => b.orders - a.orders)[0] ?? null;

    // ── Highlight: Produk Terlaris ────────────────────────────────────────
    const productMap = new Map<string, { name: string; qty: number }>();
    for (const order of orders) {
      if (order.status === "DIBATALKAN") continue;
      for (const item of order.items) {
        const key = item.productId ?? item.name;
        const cur = productMap.get(key) ?? { name: item.name, qty: 0 };
        cur.qty += item.qty;
        productMap.set(key, cur);
      }
    }
    const topProductData =
      Array.from(productMap.values()).sort((a, b) => b.qty - a.qty)[0] ?? null;

    const highlight: DashboardHighlight = {
      topSpender: topSpenderData
        ? { name: topSpenderData.name, totalSpent: topSpenderData.spent }
        : null,
      topOrderer: topOrdererData
        ? { name: topOrdererData.name, totalOrders: topOrdererData.orders }
        : null,
      topProduct: topProductData
        ? { name: topProductData.name, totalQty: topProductData.qty }
        : null,
    };

    // ── 5 Order Terbaru untuk Antrean ─────────────────────────────────────
    const recentOrders: DashboardOrderQueue[] = orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderRef: o.orderRef,
      customer: o.customer,
      status: o.status,
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
    }));

    return { stats, highlight, recentOrders, orderFlow };
  } catch (err) {
    console.error("getDashboardDataAction error:", err);
    return {
      stats: {
        totalOrders: 0, menunggu: 0, diproses: 0, selesai: 0,
        dibatalkan: 0, omzetHariIni: 0, omzetBulanIni: 0, totalPelanggan: 0,
      },
      highlight: { topSpender: null, topOrderer: null, topProduct: null },
      recentOrders: [],
      orderFlow: {
        menunggu: 0, dikonfirmasi: 0, dimasak: 0,
        siapPickup: 0, dikirim: 0, selesai: 0, dibatalkan: 0,
      },
    };
  }
}
