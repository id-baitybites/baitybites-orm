import { v2 as cloudinary } from "cloudinary";

// Inisialisasi konfigurasi Cloudinary dari environment CLOUDINARY_URL
function initCloudinary() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    try {
      const uri = new URL(cloudinaryUrl);
      cloudinary.config({
        cloud_name: uri.hostname,
        api_key: uri.username,
        api_secret: uri.password,
        secure: true,
      });
      return;
    } catch {
      // fallback jika bukan format URL
    }
  }
  cloudinary.config({ secure: true });
}

initCloudinary();

export { cloudinary };

/**
 * Upload base64, buffer, atau file path/URL ke folder Cloudinary
 */
export async function uploadToCloudinary(
  fileSource: string,
  folder: "Gallery" | "products" | "cms" | "proofs" | string = "Gallery"
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    initCloudinary();

    // Jika folder adalah "Gallery", simpan langsung ke root folder Gallery di Cloudinary
    const targetFolder = folder === "Gallery" ? "Gallery" : folder.startsWith("baitybites/") ? folder : `baitybites/${folder}`;

    const result = await cloudinary.uploader.upload(fileSource, {
      folder: targetFolder,
      resource_type: "image",
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    const message =
      error instanceof Error ? error.message : "Gagal mengupload gambar ke Cloudinary";
    return {
      success: false,
      error: message,
    };
  }
}
