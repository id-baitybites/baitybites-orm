import { v2 as cloudinary } from "cloudinary";

// Konfigurasi cloudinary otomatis membaca CLOUDINARY_URL dari environment
cloudinary.config({
  secure: true,
});

export { cloudinary };

/**
 * Upload base64 atau buffer file ke folder Cloudinary
 */
export async function uploadToCloudinary(
  fileBase64: string,
  folder: "products" | "cms" | "proofs" = "products"
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: `baitybites/${folder}`,
      resource_type: "image",
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengupload gambar ke Cloudinary";
    return {
      success: false,
      error: message,
    };
  }
}
