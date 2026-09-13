"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { GalleryCategory } from "@prisma/client";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GalleryItemData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: GalleryCategory;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestimonialData {
  id: string;
  author: string;
  role: string | null;
  city: string | null;
  quote: string;
  rating: number;
  avatarUrl: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeSettingData {
  id: string;
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroDescription: string;
  heroImage: string;
  primaryColor: string;
  accentColor: string;
  whatsappNumber: string;
  instagramUrl: string | null;
  announcementText: string | null;
  isActive: boolean;
  updatedAt: Date;
}

function logActionError(action: string, error: unknown) {
  const msg = error instanceof Error ? error.message : "Unknown error";
  console.error(`CMS Error [${action}]:`, msg);
}

// ─── 1. GALLERY ACTIONS ─────────────────────────────────────────────────────

export async function getGalleryItemsAction(): Promise<GalleryItemData[]> {
  try {
    return await db.galleryItem.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logActionError("getGalleryItems", error);
    return [];
  }
}

// Helper: Upload file, base64, or remote/local URL to Cloudinary in folder "Gallery"
async function uploadGalleryImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const imageFile = formData.get("imageFile") as File | null;
  const imageBase64 = (formData.get("imageBase64") as string)?.trim();
  let imageUrl = (formData.get("imageUrl") as string)?.trim();

  // 1. File unggahan langsung
  if (imageFile && imageFile.size > 0) {
    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mime = imageFile.type || "image/jpeg";
      const base64Data = `data:${mime};base64,${buffer.toString("base64")}`;
      const uploadRes = await uploadToCloudinary(base64Data, "Gallery");
      if (!uploadRes.success || !uploadRes.url) {
        return { error: uploadRes.error || "Gagal mengunggah foto ke Cloudinary folder Gallery." };
      }
      return { url: uploadRes.url };
    } catch (err) {
      logActionError("uploadGalleryImage:readFile", err);
      return { error: "Gagal memproses file foto yang diunggah." };
    }
  }

  // 2. Base64 data string
  if (imageBase64 && imageBase64.startsWith("data:image")) {
    const uploadRes = await uploadToCloudinary(imageBase64, "Gallery");
    if (!uploadRes.success || !uploadRes.url) {
      return { error: uploadRes.error || "Gagal mengunggah data foto ke Cloudinary folder Gallery." };
    }
    return { url: uploadRes.url };
  }

  // 3. Image URL disediakan
  if (imageUrl) {
    // Jika sudah di Cloudinary dalam folder Gallery, gunakan langsung
    if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/Gallery/")) {
      return { url: imageUrl };
    }

    // Jika path lokal atau URL lain, upload ke Cloudinary folder Gallery
    let sourceToUpload = imageUrl;
    if (imageUrl.startsWith("/")) {
      const path = await import("path");
      const fs = await import("fs");
      const localPath = path.join(process.cwd(), "public", imageUrl);
      if (fs.existsSync(localPath)) {
        sourceToUpload = localPath;
      }
    }

    const uploadRes = await uploadToCloudinary(sourceToUpload, "Gallery");
    if (uploadRes.success && uploadRes.url) {
      return { url: uploadRes.url };
    }
    return { url: imageUrl };
  }

  return { error: "File foto atau URL gambar wajib diisi." };
}

export async function createGalleryItemAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: GalleryItemData;
}> {
  try {
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const category = (formData.get("category") as GalleryCategory) || "PRODUK";
    const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10) || 0;
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

    if (!title) {
      return { success: false, error: "Judul foto wajib diisi." };
    }

    // Pastikan gambar diupload ke Cloudinary dalam folder Gallery
    const uploadRes = await uploadGalleryImage(formData);
    if (uploadRes.error || !uploadRes.url) {
      return { success: false, error: uploadRes.error || "Gagal mengunggah gambar ke Cloudinary folder Gallery." };
    }

    const item = await db.galleryItem.create({
      data: {
        title,
        description,
        imageUrl: uploadRes.url,
        category,
        displayOrder,
        isActive,
      },
    });

    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true, data: item };
  } catch (error) {
    logActionError("createGalleryItem", error);
    return { success: false, error: "Gagal menambahkan foto galeri. Periksa input data." };
  }
}

export async function updateGalleryItemAction(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: GalleryItemData }> {
  try {
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const category = (formData.get("category") as GalleryCategory) || "PRODUK";
    const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10) || 0;
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

    if (!title) {
      return { success: false, error: "Judul foto wajib diisi." };
    }

    const imageFile = formData.get("imageFile") as File | null;
    const imageBase64 = (formData.get("imageBase64") as string)?.trim();
    const rawImageUrl = (formData.get("imageUrl") as string)?.trim();

    let newImageUrl: string | undefined;

    // Jika ada file baru, base64 baru, atau URL baru yang belum di Cloudinary Gallery
    if (
      (imageFile && imageFile.size > 0) ||
      (imageBase64 && imageBase64.startsWith("data:image")) ||
      (rawImageUrl && (!rawImageUrl.includes("res.cloudinary.com") || !rawImageUrl.includes("/Gallery/")))
    ) {
      const uploadRes = await uploadGalleryImage(formData);
      if (uploadRes.url) {
        newImageUrl = uploadRes.url;
      }
    } else if (rawImageUrl) {
      newImageUrl = rawImageUrl;
    }

    const item = await db.galleryItem.update({
      where: { id },
      data: {
        title,
        description,
        ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
        category,
        displayOrder,
        isActive,
      },
    });

    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true, data: item };
  } catch (error) {
    logActionError("updateGalleryItem", error);
    return { success: false, error: "Gagal memperbarui foto galeri." };
  }
}

export async function deleteGalleryItemAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await db.galleryItem.delete({ where: { id } });
    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logActionError("deleteGalleryItem", error);
    return { success: false, error: "Gagal menghapus foto galeri." };
  }
}

export async function toggleGalleryActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.galleryItem.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logActionError("toggleGalleryActive", error);
    return { success: false, error: "Gagal mengubah status galeri." };
  }
}

// ─── 2. TESTIMONIAL ACTIONS ─────────────────────────────────────────────────

export async function getTestimonialsAction(): Promise<TestimonialData[]> {
  try {
    return await db.customerTestimonial.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    logActionError("getTestimonials", error);
    return [];
  }
}

export async function createTestimonialAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: TestimonialData;
}> {
  try {
    const author = (formData.get("author") as string)?.trim();
    const quote = (formData.get("quote") as string)?.trim();
    const role = (formData.get("role") as string)?.trim() || "Pelanggan Setia";
    const city = (formData.get("city") as string)?.trim() || "Jakarta";
    const rating = Math.min(5, Math.max(1, parseInt((formData.get("rating") as string) || "5", 10)));
    const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
    const isFeatured = formData.get("isFeatured") === "true" || formData.get("isFeatured") === "on";
    const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10) || 0;

    if (!author || !quote) {
      return { success: false, error: "Nama pelanggan dan isi ulasan / kutipan wajib diisi." };
    }

    const item = await db.customerTestimonial.create({
      data: {
        author,
        role,
        city,
        quote,
        rating,
        avatarUrl,
        isFeatured,
        displayOrder,
      },
    });

    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true, data: item };
  } catch (error) {
    logActionError("createTestimonial", error);
    return { success: false, error: "Gagal menambahkan ulasan testimoni." };
  }
}

export async function updateTestimonialAction(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: TestimonialData }> {
  try {
    const author = (formData.get("author") as string)?.trim();
    const quote = (formData.get("quote") as string)?.trim();
    const role = (formData.get("role") as string)?.trim() || "Pelanggan Setia";
    const city = (formData.get("city") as string)?.trim() || "Jakarta";
    const rating = Math.min(5, Math.max(1, parseInt((formData.get("rating") as string) || "5", 10)));
    const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
    const isFeatured = formData.get("isFeatured") === "true" || formData.get("isFeatured") === "on";
    const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10) || 0;

    if (!author || !quote) {
      return { success: false, error: "Nama pelanggan dan isi ulasan / kutipan wajib diisi." };
    }

    const item = await db.customerTestimonial.update({
      where: { id },
      data: {
        author,
        role,
        city,
        quote,
        rating,
        avatarUrl,
        isFeatured,
        displayOrder,
      },
    });

    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true, data: item };
  } catch (error) {
    logActionError("updateTestimonial", error);
    return { success: false, error: "Gagal memperbarui ulasan testimoni." };
  }
}

export async function deleteTestimonialAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await db.customerTestimonial.delete({ where: { id } });
    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logActionError("deleteTestimonial", error);
    return { success: false, error: "Gagal menghapus ulasan testimoni." };
  }
}

export async function toggleTestimonialFeaturedAction(
  id: string,
  isFeatured: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.customerTestimonial.update({
      where: { id },
      data: { isFeatured },
    });
    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logActionError("toggleTestimonialFeatured", error);
    return { success: false, error: "Gagal mengubah status publikasi testimoni." };
  }
}

// ─── 3. THEME & WEB CONTENT ACTIONS ─────────────────────────────────────────

export async function getThemeSettingAction(): Promise<ThemeSettingData | null> {
  try {
    let setting = await db.webThemeSetting.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!setting) {
      setting = await db.webThemeSetting.findFirst({
        orderBy: { updatedAt: "desc" },
      });
    }

    return setting;
  } catch (error) {
    logActionError("getThemeSetting", error);
    return null;
  }
}

export async function updateThemeSettingAction(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: ThemeSettingData }> {
  try {
    const brandName = (formData.get("brandName") as string)?.trim() || "Baitybites";
    const tagline = (formData.get("tagline") as string)?.trim() || "Bite The Best";
    const heroTitle = (formData.get("heroTitle") as string)?.trim() || "Sensasi Risol Mayo Meleleh";
    const heroTitleAccent = (formData.get("heroTitleAccent") as string)?.trim() || "Double Cheese & Smoked Beef";
    const heroDescription = (formData.get("heroDescription") as string)?.trim() || "";
    const heroImage = (formData.get("heroImage") as string)?.trim() || "/images/backgrounds/hero-risol.jpg";
    const primaryColor = (formData.get("primaryColor") as string)?.trim() || "#F97316";
    const accentColor = (formData.get("accentColor") as string)?.trim() || "#10B981";
    const whatsappNumber = (formData.get("whatsappNumber") as string)?.trim() || "+62 812 8888 2345";
    const instagramUrl = (formData.get("instagramUrl") as string)?.trim() || null;
    const announcementText = (formData.get("announcementText") as string)?.trim() || null;
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

    const updated = await db.webThemeSetting.update({
      where: { id },
      data: {
        brandName,
        tagline,
        heroTitle,
        heroTitleAccent,
        heroDescription,
        heroImage,
        primaryColor,
        accentColor,
        whatsappNumber,
        instagramUrl,
        announcementText,
        isActive,
      },
    });

    revalidatePath("/cms");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    logActionError("updateThemeSetting", error);
    return { success: false, error: "Gagal menyimpan pengaturan konten web." };
  }
}
