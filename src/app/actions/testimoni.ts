"use server";

import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { revalidatePath } from "next/cache";

export interface SubmitTestimoniPayload {
  quote: string;
  rating: number;
}

export interface PendingTestimoniData {
  id: string;
  author: string;
  role: string | null;
  city: string | null;
  quote: string;
  rating: number;
  avatarUrl: string | null;
  createdAt: Date;
  isFeatured: boolean;
}

export interface SubmitTestimoniResult {
  success: boolean;
  error?: string;
  data?: PendingTestimoniData;
}

export async function submitTestimoniAction(
  payload: SubmitTestimoniPayload
): Promise<SubmitTestimoniResult> {
  // Hanya pelanggan yang sudah login yang dapat memberikan testimoni
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { success: false, error: "Anda harus masuk terlebih dahulu untuk memberikan ulasan." };
  }

  const quote = payload.quote.trim();
  if (!quote || quote.length < 10) {
    return { success: false, error: "Ulasan minimal 10 karakter." };
  }
  if (quote.length > 500) {
    return { success: false, error: "Ulasan maksimal 500 karakter." };
  }

  const rating = Math.min(5, Math.max(1, Math.round(payload.rating)));

  // Cek apakah pelanggan ini sudah pernah submit testimoni sebelumnya (dalam 7 hari)
  const recentTestimoni = await db.customerTestimonial.findFirst({
    where: {
      author: customer.name,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  if (recentTestimoni) {
    return {
      success: false,
      error: "Anda sudah memberikan ulasan dalam 7 hari terakhir. Terima kasih atas feedback Anda!",
    };
  }

  const created = await db.customerTestimonial.create({
    data: {
      author: customer.name,
      role: customer.customerType === "VIP" ? "Pelanggan VIP Baitybites" : "Pelanggan Setia",
      city: customer.city || "Indonesia",
      quote,
      rating,
      avatarUrl: customer.avatarUrl || null,
      isFeatured: false, // Admin yang akan kurasi dan menampilkan
      displayOrder: 0,
    },
  });

  // Revalidasi halaman utama agar testimoni yang terpilih admin tampil
  revalidatePath("/");

  return {
    success: true,
    data: {
      id: created.id,
      author: created.author,
      role: created.role,
      city: created.city,
      quote: created.quote,
      rating: created.rating,
      avatarUrl: created.avatarUrl,
      createdAt: created.createdAt,
      isFeatured: created.isFeatured,
    },
  };
}

/**
 * Mengambil testimoni milik pelanggan yang saat ini login yang belum disetujui (isFeatured: false).
 */
export async function getPendingTestimoniAction(): Promise<PendingTestimoniData | null> {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const pending = await db.customerTestimonial.findFirst({
    where: {
      author: customer.name,
      isFeatured: false,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      author: true,
      role: true,
      city: true,
      quote: true,
      rating: true,
      avatarUrl: true,
      createdAt: true,
      isFeatured: true,
    },
  });

  return pending;
}

