import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/products
 * Mengambil katalog menu dan produk aktif beserta stok dan harga.
 * Autentikasi: Header 'x-api-key' atau 'Authorization: Bearer <token>'
 */
export async function GET(req: NextRequest) {
  const auth = validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const isAvailable = searchParams.get("available");

    const where: any = {};
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (isAvailable !== null && isAvailable !== undefined) {
      where.isAvailable = isAvailable === "true";
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mengambil katalog produk" },
      { status: 500 }
    );
  }
}
