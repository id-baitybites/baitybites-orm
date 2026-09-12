"use server";

import { db } from "@/lib/db";
import { getCurrentCustomer, setCustomerSession, clearCustomerSession } from "@/lib/customer-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Customer, OrderStatus } from "@prisma/client";

export interface CustomerOrderSummary {
  id: string;
  orderRef: string;
  channel: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  deliveryAddr: string | null;
  items: {
    name: string;
    qty: number;
    subtotal: number;
  }[];
}

export interface ProfileData {
  customer: Customer;
  orders: CustomerOrderSummary[];
  completenessPercent: number;
  missingFields: string[];
}

/**
 * Hitung persentase kelengkapan profil untuk kebutuhan transaksi:
 * Nama, Email, Nomor WhatsApp/Telepon, Alamat Pengiriman, Kota, Kecamatan, Kode Pos.
 */
function calculateCompleteness(customer: Customer): {
  percent: number;
  missing: string[];
} {
  const fields = [
    { label: "Nama Lengkap", value: customer.name },
    { label: "Nomor WhatsApp / HP", value: customer.phone },
    { label: "Alamat Lengkap Pengiriman", value: customer.address },
    { label: "Kota / Kabupaten", value: customer.city },
    { label: "Kecamatan / Kelurahan", value: customer.district },
  ];

  const missing: string[] = [];
  let filledCount = 0;

  for (const f of fields) {
    if (f.value && f.value.trim().length > 0) {
      filledCount++;
    } else {
      missing.push(f.label);
    }
  }

  const percent = Math.round((filledCount / fields.length) * 100);
  return { percent, missing };
}

/**
 * Ambil data profil pelanggan yang sedang login & riwayat pesanannya.
 */
export async function getProfileDataAction(): Promise<ProfileData | null> {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  // Ambil riwayat pesanan yang terkait (berdasarkan customerId, email, atau phone)
  const orConditions: Array<{ customerId?: string; customerEmail?: string; customerPhone?: string }> = [
    { customerId: customer.id },
  ];
  if (customer.email) orConditions.push({ customerEmail: customer.email });
  if (customer.phone) orConditions.push({ customerPhone: customer.phone });

  const orders = await db.order.findMany({
    where: {
      OR: orConditions,
    },
    include: {
      items: {
        select: {
          name: true,
          qty: true,
          subtotal: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const { percent, missing } = calculateCompleteness(customer);

  return {
    customer,
    orders: orders.map((o) => ({
      id: o.id,
      orderRef: o.orderRef,
      channel: o.channel,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      deliveryAddr: o.deliveryAddr,
      items: o.items,
    })),
    completenessPercent: percent,
    missingFields: missing,
  };
}

export interface UpdateProfileInput {
  name: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  postalCode: string;
  notes: string;
}

/**
 * Update data profil pelanggan untuk kelengkapan transaksi.
 */
export async function updateCustomerProfileAction(
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getCurrentCustomer();
    if (!current) {
      return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };
    }

    if (!input.name?.trim()) {
      return { success: false, error: "Nama lengkap penerima wajib diisi." };
    }

    // Validasi format nomor telepon/WhatsApp Indonesia
    const cleanPhone = input.phone?.trim();
    if (cleanPhone) {
      // Izinkan angka, tanda +, spasi, minus
      const phoneDigits = cleanPhone.replace(/\D/g, "");
      if (phoneDigits.length < 9 || phoneDigits.length > 15) {
        return {
          success: false,
          error: "Nomor telepon/WhatsApp harus terdiri dari 9 - 15 digit angka.",
        };
      }

      // Cek apakah nomor sudah dipakai customer lain
      const existingPhone = await db.customer.findFirst({
        where: {
          phone: cleanPhone,
          id: { not: current.id },
        },
      });
      if (existingPhone) {
        return {
          success: false,
          error: "Nomor telepon/WhatsApp ini sudah terdaftar untuk akun pelanggan lain.",
        };
      }
    }

    const updated = await db.customer.update({
      where: { id: current.id },
      data: {
        name: input.name.trim(),
        phone: cleanPhone || null,
        address: input.address?.trim() || null,
        district: input.district?.trim() || null,
        city: input.city?.trim() || "Jakarta",
        postalCode: input.postalCode?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    // Perbarui cookie info pelanggan
    await setCustomerSession(updated.id, {
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (err: unknown) {
    console.error("updateCustomerProfileAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui profil.",
    };
  }
}

/**
 * Logout pelanggan dari sesi saat ini.
 */
export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/");
}
