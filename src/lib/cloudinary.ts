import { v2 as cloudinary } from "cloudinary";

// Fallback kredensial default sistem jika environment variable belum dikonfigurasi di dashboard server hosting
const DEFAULT_CLOUD_NAME = "dbsx8iiuz";
const DEFAULT_API_KEY = "629692983265825";
const DEFAULT_API_SECRET = "_rrxefvr68ioud94y2M61esfQyc";

// Inisialisasi konfigurasi Cloudinary dari environment CLOUDINARY_URL atau individual env vars
function initCloudinary() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    try {
      const uri = new URL(cloudinaryUrl);
      cloudName = uri.hostname || cloudName;
      apiKey = uri.username || apiKey;
      apiSecret = uri.password || apiSecret;
    } catch {
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = match[1] || apiKey;
        apiSecret = match[2] || apiSecret;
        cloudName = match[3] || cloudName;
      }
    }
  }

  cloudinary.config({
    cloud_name: cloudName || DEFAULT_CLOUD_NAME,
    api_key: apiKey || DEFAULT_API_KEY,
    api_secret: apiSecret || DEFAULT_API_SECRET,
    secure: true,
  });
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
    const targetFolder =
      folder === "Gallery"
        ? "Gallery"
        : folder.startsWith("baitybites/")
        ? folder
        : `baitybites/${folder}`;

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
    const rawMessage = error instanceof Error ? error.message : "Gagal mengunggah berkas gambar";
    console.error("Cloud storage upload error:", rawMessage);

    // Sanitasi pesan error agar ramah pengguna dan tidak membocorkan detail teknis internal
    let userFriendlyError =
      "Gagal memproses unggahan foto bukti transfer. Silakan periksa ukuran berkas (maksimal 5 MB) dan coba kembali.";
    if (rawMessage.toLowerCase().includes("file size") || rawMessage.toLowerCase().includes("too large")) {
      userFriendlyError = "Ukuran gambar terlalu besar. Silakan gunakan gambar dengan ukuran maksimal 5 MB.";
    } else if (rawMessage.toLowerCase().includes("format") || rawMessage.toLowerCase().includes("invalid image")) {
      userFriendlyError = "Format berkas tidak valid. Harap gunakan format gambar JPG, PNG, atau WebP.";
    }

    return {
      success: false,
      error: userFriendlyError,
    };
  }
}
