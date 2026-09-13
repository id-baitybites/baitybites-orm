"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  Channel,
  OrderStatus,
  Priority,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { generatePaxelAwb } from "@/lib/paxel";

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
  category?: string;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: "DELIVERY" | "PICKUP";
  deliveryAddress?: string;
  deliveryDistrict?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  orderNotes?: string;
  paymentMethod: "QRIS" | "BANK_TRANSFER" | "COD";
  items: CheckoutItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount?: number;
  discount?: number;
  paxelAwb?: string;
  paxelService?: string;
}

export interface CheckoutResult {
  success: boolean;
  orderRef?: string;
  orderId?: string;
  paxelAwb?: string;
  error?: string;
}

/**
 * Generate nomor pesanan acak berbasis channel Website
 * Format: #WB-DIR-XXXX (contoh: #WB-DIR-4821)
 */
async function generateUniqueOrderRef(): Promise<string> {
  let isUnique = false;
  let candidate = "";
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    candidate = `#WB-DIR-${randomNum}`;

    const existing = await db.order.findUnique({
      where: { orderRef: candidate },
      select: { id: true },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    candidate = `#WB-DIR-${Date.now().toString().slice(-4)}`;
  }

  return candidate;
}

/**
 * Server Action untuk menyimpan pesanan checkout dari customer web
 */
export async function createCustomerOrderAction(
  payload: CheckoutPayload
): Promise<CheckoutResult> {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Keranjang belanja Anda masih kosong." };
    }

    if (!payload.customerName.trim()) {
      return { success: false, error: "Nama pemesan wajib diisi." };
    }

    if (!payload.customerPhone.trim()) {
      return { success: false, error: "Nomor WhatsApp aktif wajib diisi untuk konfirmasi." };
    }

    if (payload.deliveryType === "DELIVERY" && !payload.deliveryAddress?.trim()) {
      return { success: false, error: "Alamat pengiriman wajib diisi untuk opsi Delivery." };
    }

    // 1. Cek apakah customer sedang login
    const currentCustomer = await getCurrentCustomer();
    let customerId = currentCustomer?.id || null;

    // Jika customer login, update nomor HP & alamatnya jika sebelumnya belum lengkap
    if (currentCustomer) {
      try {
        await db.customer.update({
          where: { id: currentCustomer.id },
          data: {
            phone: currentCustomer.phone || payload.customerPhone.trim(),
            address: currentCustomer.address || payload.deliveryAddress?.trim() || null,
            city: currentCustomer.city || payload.deliveryCity?.trim() || "Jakarta Selatan",
            district: currentCustomer.district || payload.deliveryDistrict?.trim() || null,
            postalCode: currentCustomer.postalCode || payload.deliveryPostalCode?.trim() || null,
          },
        });
      } catch {
        // Abaikan jika ada konflik nomor unik
      }
    }

    // 2. Generate nomor referensi pesanan unik
    const orderRef = await generateUniqueOrderRef();

    // 3. Format alamat pengiriman & Paxel AWB
    const paxelAwb = payload.paxelAwb || (payload.deliveryType !== "PICKUP" ? generatePaxelAwb(orderRef) : undefined);

    const deliveryAddressFormatted =
      payload.deliveryType === "PICKUP"
        ? "Ambil Sendiri di Toko Baitybites (Jl. Amsar No.RT 01/06, Sawangan, Depok)"
        : [
            payload.deliveryAddress?.trim(),
            payload.deliveryDistrict?.trim(),
            payload.deliveryCity?.trim(),
            payload.deliveryPostalCode?.trim(),
            paxelAwb ? `[Paxel AWB: ${paxelAwb}]` : null,
          ]
            .filter(Boolean)
            .join(", ");

    // 4. Susun catatan pesanan
    const orderNoteHeader =
      payload.deliveryType === "PICKUP"
        ? "[PICKUP / TOKO SAWANGAN]"
        : `[PAXEL OFFICIAL COURIER${paxelAwb ? ` | AWB: ${paxelAwb}` : ""}]`;
    const fullNote = payload.orderNotes?.trim()
      ? `${orderNoteHeader} ${payload.orderNotes.trim()}`
      : orderNoteHeader;

    // 5. Mapping metode pembayaran
    let dbPaymentMethod: PaymentMethod = PaymentMethod.BANK_TRANSFER;
    if (payload.paymentMethod === "QRIS") {
      dbPaymentMethod = PaymentMethod.QRIS;
    } else if (payload.paymentMethod === "COD") {
      dbPaymentMethod = PaymentMethod.COD;
    }

    const finalDeliveryFee = payload.deliveryType === "PICKUP" ? 0 : payload.deliveryFee;
    const finalDiscount = payload.discount || 0;
    const finalTotal = payload.totalAmount ?? (payload.subtotal + finalDeliveryFee - finalDiscount);

    // 6. Buat pesanan secara transaksional di database
    const order = await db.order.create({
      data: {
        orderRef,
        customer: payload.customerName.trim(),
        customerPhone: payload.customerPhone.trim(),
        customerEmail: payload.customerEmail?.trim() || currentCustomer?.email || null,
        customerId,
        channel: Channel.Website,
        status: OrderStatus.MENUNGGU,
        priority: Priority.NORMAL,
        note: fullNote,
        deliveryAddr: deliveryAddressFormatted,
        deliveryFee: finalDeliveryFee,
        discount: finalDiscount,
        subtotal: payload.subtotal,
        totalAmount: finalTotal,
        items: {
          create: payload.items.map((item) => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
            subtotal: item.price * item.qty,
            notes: item.notes?.trim() || null,
          })),
        },
        payments: {
          create: {
            paymentMethod: dbPaymentMethod,
            paymentStatus: PaymentStatus.PENDING,
            amount: finalTotal,
            referenceCode: `PAY-${orderRef.replace(/[^a-zA-Z0-9]/g, "")}`,
          },
        },
        statusHistory: {
          create: {
            status: OrderStatus.MENUNGGU,
            note: `Pesanan baru dibuat online via Website oleh ${payload.customerName}`,
            actor: "CUSTOMER",
          },
        },
      },
    });

    // 7. Revalidasi halaman terkait di Next.js cache
    revalidatePath("/orders");
    revalidatePath("/kitchen");
    revalidatePath("/profile");
    revalidatePath("/tracking");
    revalidatePath("/");

    return {
      success: true,
      orderRef: order.orderRef,
      orderId: order.id,
      paxelAwb,
    };
  } catch (error) {
    console.error("Gagal membuat pesanan checkout customer:", error);
    return {
      success: false,
      error: "Terjadi gangguan saat memproses pesanan Anda. Silakan coba kembali atau hubungi WhatsApp Baitybites.",
    };
  }
}
