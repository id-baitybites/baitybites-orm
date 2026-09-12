"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CustomerDisplay {
  id: string;
  title: string;          // nama
  subtitle: string;       // phone / email
  value: string;          // jumlah order
  status: string;         // VIP / REGULAR / WHOLESALE
  tone: "success" | "info" | "warning" | "danger";
  totalSpent: number;
  lastOrderAt: Date | null;
}

export interface CustomerStats {
  total: number;
  vip: number;
  regular: number;
  newThisMonth: number;
}

/**
 * Mengambil semua pelanggan beserta jumlah pesanan mereka dari PostgreSQL
 */
export async function getCustomersAction(): Promise<{
  customers: CustomerDisplay[];
  stats: CustomerStats;
}> {
  try {
    const customers = await db.customer.findMany({
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const mapped: CustomerDisplay[] = customers.map((c) => {
      const orderCount = c.orders.length;
      const totalSpent = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const lastOrder = c.orders[0] ?? null;

      const tone: "success" | "info" | "warning" | "danger" =
        c.customerType === "VIP"
          ? "success"
          : c.customerType === "WHOLESALE"
          ? "warning"
          : "info";

      return {
        id: c.id,
        title: c.name,
        subtitle: c.phone
          ? `${c.phone}${c.email ? ` · ${c.email}` : ""}`
          : c.email || "Belum ada kontak",
        value: `${orderCount} order`,
        status:
          c.customerType === "VIP"
            ? "VIP"
            : c.customerType === "WHOLESALE"
            ? "Grosir"
            : "Regular",
        tone,
        totalSpent,
        lastOrderAt: lastOrder ? lastOrder.createdAt : null,
      };
    });

    const vipCount = customers.filter((c) => c.customerType === "VIP").length;
    const regularCount = customers.filter(
      (c) => c.customerType === "REGULAR"
    ).length;
    const newThisMonth = customers.filter(
      (c) => c.createdAt >= startOfMonth
    ).length;

    return {
      customers: mapped,
      stats: {
        total: customers.length,
        vip: vipCount,
        regular: regularCount,
        newThisMonth,
      },
    };
  } catch (err) {
    console.error("getCustomersAction error:", err);
    return {
      customers: [],
      stats: { total: 0, vip: 0, regular: 0, newThisMonth: 0 },
    };
  }
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  customerType?: "REGULAR" | "VIP" | "WHOLESALE";
  notes?: string;
}

/**
 * Membuat pelanggan baru di database PostgreSQL
 */
export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: "Nama pelanggan wajib diisi." };
    }
    if (!input.phone?.trim()) {
      return { success: false, error: "Nomor telepon wajib diisi." };
    }

    await db.customer.create({
      data: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || "Jakarta",
        customerType: input.customerType || "REGULAR",
        notes: input.notes?.trim() || null,
      },
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (err: unknown) {
    console.error("createCustomerAction error:", err);
    const message =
      err instanceof Error ? err.message : "Gagal menambahkan pelanggan.";
    // Unique constraint phone
    if (message.includes("Unique constraint")) {
      return {
        success: false,
        error: "Nomor telepon sudah terdaftar untuk pelanggan lain.",
      };
    }
    return { success: false, error: message };
  }
}
