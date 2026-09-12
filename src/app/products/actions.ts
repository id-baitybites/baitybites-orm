"use server";

import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

/**
 * Memperbaiki (enhance) deskripsi produk yang ditulis oleh staf agar lebih menggoda selera,
 * profesional, dan ringkas tanpa membebani AI untuk men-generate keseluruhan formulir.
 */
export async function enhanceDescriptionWithAi(params: {
  productName?: string;
  category?: string;
  draftDescription: string;
}): Promise<{ success: boolean; description?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY belum dikonfigurasi di environment.",
    };
  }

  const { productName, category, draftDescription } = params;

  if (!draftDescription || draftDescription.trim().length === 0) {
    return {
      success: false,
      error: "Tuliskan deskripsi awal terlebih dahulu sebelum menggunakan AI Magic.",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Kamu adalah copywriter kuliner profesional untuk brand "Baitybites" (spesialis Risol Mayo/Gourmet premium dan minuman tradisional Cendol).

Tugasmu:
Perbaiki dan poles teks deskripsi produk berikut agar terdengar lebih lezat, menggoda selera (appetizing), dan profesional, namun tetap mempertahankan inti poin bahan/rasa yang ditulis staf.
Panjang hasil: maksimal 2 hingga 3 kalimat ringkas padat.
Jangan tambahkan tanda kutip, jangan gunakan format bullet, dan jangan ada teks pengantar apapun. Langsung tuliskan teks deskripsi hasil polesan.

Informasi Produk:
- Nama Produk: ${productName?.trim() || "Produk Baitybites"}
- Kategori: ${category || "Kuliner"}
- Draft dari Staf: "${draftDescription.trim()}"
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 180,
        temperature: 0.7,
      },
    });

    const enhanced = (response.text || "").trim().replace(/^["']|["']$/g, "");

    return {
      success: true,
      description: enhanced,
    };
  } catch (err: unknown) {
    console.error("Gemini AI enhancement error:", err);
    const message = err instanceof Error ? err.message : "Gagal memproses dengan AI";
    return {
      success: false,
      error: message,
    };
  }
}

export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  initialStock: number;
  imageBase64?: string | null;
}

export interface ProductItemDisplay {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  status: "Tersedia" | "Menipis" | "Habis";
  tone: "success" | "warning" | "danger";
  imageUrl?: string | null;
}

/**
 * Mengambil seluruh produk dari database PostgreSQL
 */
export async function getProductsAction(): Promise<ProductItemDisplay[]> {
  try {
    const products = await db.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => {
      const status: "Tersedia" | "Menipis" | "Habis" =
        p.stock > 10 ? "Tersedia" : p.stock > 0 ? "Menipis" : "Habis";
      const tone: "success" | "warning" | "danger" =
        status === "Tersedia" ? "success" : status === "Menipis" ? "warning" : "danger";

      return {
        id: p.id,
        title: p.name,
        subtitle: `${p.code} / ${p.category.name} • Rp ${p.price.toLocaleString("id-ID")}`,
        value: `${p.stock} ${p.unit}`,
        status,
        tone,
        imageUrl: p.imageUrl,
      };
    });
  } catch (err) {
    console.error("Error getProductsAction:", err);
    return [];
  }
}

/**
 * Membuat produk baru: upload foto ke Cloudinary dan simpan ke database PostgreSQL
 */
export async function createProductAction(input: CreateProductInput): Promise<{
  success: boolean;
  product?: ProductItemDisplay;
  error?: string;
}> {
  try {
    const { name, description, category: categoryName, price, unit, initialStock, imageBase64 } = input;

    if (!name || !name.trim()) {
      return { success: false, error: "Nama produk wajib diisi." };
    }

    // 1. Upload ke Cloudinary jika ada gambar
    let uploadedImageUrl: string | null = null;
    if (imageBase64 && imageBase64.startsWith("data:image")) {
      const uploadRes = await uploadToCloudinary(imageBase64, "products");
      if (uploadRes.success && uploadRes.url) {
        uploadedImageUrl = uploadRes.url;
      } else {
        console.warn("Cloudinary upload failed, proceeding with null imageUrl:", uploadRes.error);
      }
    }

    // 2. Cari atau buat Kategori yang sesuai
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let category = await db.category.findFirst({
      where: {
        OR: [{ name: categoryName }, { slug: categorySlug }],
      },
    });

    if (!category) {
      category = await db.category.create({
        data: {
          name: categoryName,
          slug: categorySlug,
          description: `Kategori ${categoryName}`,
        },
      });
    }

    // 3. Generate Kode SKU Produk
    const productCount = await db.product.count();
    const productCode = `PRD-${String(productCount + 1).padStart(3, "0")}`;
    const productSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    // 4. Simpan ke database PostgreSQL via Prisma
    const newProduct = await db.product.create({
      data: {
        categoryId: category.id,
        code: productCode,
        name: name.trim(),
        slug: productSlug,
        description: description?.trim() || null,
        price: Number(price) || 0,
        unit: unit || "Pack",
        stock: Number(initialStock) || 0,
        imageUrl: uploadedImageUrl,
        isAvailable: Number(initialStock) > 0,
      },
      include: {
        category: true,
      },
    });

    const status: "Tersedia" | "Menipis" | "Habis" =
      newProduct.stock > 10 ? "Tersedia" : newProduct.stock > 0 ? "Menipis" : "Habis";
    const tone: "success" | "warning" | "danger" =
      status === "Tersedia" ? "success" : status === "Menipis" ? "warning" : "danger";

    revalidatePath("/products");
    revalidatePath("/");

    return {
      success: true,
      product: {
        id: newProduct.id,
        title: newProduct.name,
        subtitle: `${newProduct.code} / ${newProduct.category.name} • Rp ${newProduct.price.toLocaleString("id-ID")}`,
        value: `${newProduct.stock} ${newProduct.unit}`,
        status,
        tone,
        imageUrl: newProduct.imageUrl,
      },
    };
  } catch (err: unknown) {
    console.error("createProductAction error:", err);
    const message = err instanceof Error ? err.message : "Gagal menambahkan produk ke database.";
    return {
      success: false,
      error: message,
    };
  }
}
