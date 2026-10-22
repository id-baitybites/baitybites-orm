import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatcher";
import type { Channel, OrderStatus, Priority } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/orders
 * Mengambil daftar order dengan filter status, channel, dan pagination.
 * Autentikasi: Header 'x-api-key' atau 'Authorization: Bearer <token>'
 */
export async function GET(req: NextRequest) {
  const auth = validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as OrderStatus | null;
    const channel = searchParams.get("channel") as Channel | null;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mengambil data pesanan" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/orders
 * Membuat order baru secara programmatic dari POS eksternal, GrabFood/GoFood, atau app pihak ketiga.
 * Memicu webhook event 'order.created' secara otomatis.
 */
export async function POST(req: NextRequest) {
  const auth = validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      customer,
      customerPhone,
      customerEmail,
      deliveryAddr,
      channel = "Website",
      priority = "NORMAL",
      note,
      items,
      deliveryFee = 0,
      discount = 0,
    } = body;

    if (!customer || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload tidak valid. 'customer' dan daftar 'items' (minimal 1) wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Hitung subtotal
    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
    const totalAmount = Math.max(0, subtotal + Number(deliveryFee) - Number(discount));

    // Generate Order Ref e.g. #API-XXXX
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderRef = `#API-${randomHex}`;

    const createdOrder = await db.order.create({
      data: {
        orderRef,
        customer,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        deliveryAddr: deliveryAddr || null,
        channel: channel as Channel,
        priority: priority as Priority,
        note: note || null,
        subtotal,
        deliveryFee: Number(deliveryFee),
        discount: Number(discount),
        totalAmount,
        status: "MENUNGGU",
        items: {
          create: items.map((it: any) => ({
            name: String(it.name || "Item Menu"),
            price: Number(it.price) || 0,
            qty: Number(it.qty) || 1,
            notes: it.notes ? String(it.notes) : null,
            productId: it.productId || null,
            subtotal: (Number(it.price) || 0) * (Number(it.qty) || 1),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Otomatis dispatch webhook event 'order.created'
    dispatchWebhookEvent("order.created", createdOrder).catch((err) => {
      console.warn("Async webhook dispatch error:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: `Order '${orderRef}' berhasil dibuat via API.`,
        data: createdOrder,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal membuat pesanan via API" },
      { status: 500 }
    );
  }
}
