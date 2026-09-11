"use server";

import { GoogleGenAI } from "@google/genai";

export interface GeneratedProduct {
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  initialStock: number;
}

const CATEGORIES = [
  "Risol Frozen",
  "Risol Ready to Eat",
  "Minuman Tradisional",
  "Cendol Cup",
  "Paket Hampers & Snack Box",
];

export async function generateProductWithAi(
  promptHint?: string
): Promise<{ success: boolean; data?: GeneratedProduct; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY belum dikonfigurasi di environment.",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
Kamu adalah spesialis chef kuliner dan branding copywriter untuk "Baitybites", brand kuliner yang memproduksi Risol Mayo/Gourmet premium dan minuman tradisional Cendol segar.

Tugasmu:
Buatlah satu ide produk inovatif baru.
${promptHint ? `Petunjuk atau ide awal dari user: "${promptHint}". Kembangkan ide ini.` : "Buatkan varian baru yang unik, kekinian, dan berpotensi laris manis."}

Kategori yang valid HANYA salah satu dari:
${CATEGORIES.map((c) => `- "${c}"`).join("\n")}

Format output HARUS murni JSON valid tanpa backticks markdown atau penjelasan apapun di luar JSON:
{
  "name": "Nama produk menarik & appetizing (contoh: Risol Mayo Spicy Tuna Melt / Cendol Nangka Pandan)",
  "description": "Deskripsi copywriting menggugah selera 2-3 kalimat yang menjelaskan kelezatan, isian/bahan premium, dan tekstur produk.",
  "category": "Salah satu kategori di atas",
  "price": 35000,
  "unit": "Pack / Pcs / Cup",
  "initialStock": 25
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "";
    const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData: GeneratedProduct = JSON.parse(cleanedText);

    // Pastikan kategori valid
    if (!CATEGORIES.includes(parsedData.category)) {
      parsedData.category = CATEGORIES[0];
    }

    return {
      success: true,
      data: parsedData,
    };
  } catch (err: unknown) {
    console.error("Gemini AI generation error:", err);
    const message = err instanceof Error ? err.message : "Gagal generate dengan AI";
    return {
      success: false,
      error: message,
    };
  }
}
