"use server";

import { GoogleGenAI } from "@google/genai";

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
