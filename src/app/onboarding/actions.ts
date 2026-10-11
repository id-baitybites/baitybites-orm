"use server";

import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_ADMIN_COOKIE } from "@/lib/auth-constants";

export interface OnboardingStatus {
  isInitialized: boolean;
  hasAdmin: boolean;
  hasTheme: boolean;
  currentBrandName?: string;
}

export interface OnboardingPayload {
  // 1. Super Admin Account
  adminUsername: string;
  adminDisplayName: string;
  adminPassword: string;
  adminPin: string;

  // 2. Brand Identity
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroDescription: string;
  primaryColor: string;
  accentColor: string;
  whatsappNumber: string;
  instagramUrl: string;

  // 3. Data Mode
  sampleDataMode: "clean" | "sample";
}

// Cek status inisialisasi aplikasi saat ini
export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    const adminCount = await db.admin.count();
    const theme = await db.webThemeSetting.findFirst();

    // Aplikasi dianggap sudah initialized jika admin sudah ada dan terkonfigurasi
    const isInitialized = adminCount > 0 && !!theme;

    return {
      isInitialized,
      hasAdmin: adminCount > 0,
      hasTheme: !!theme,
      currentBrandName: theme?.brandName || "Brand Baru",
    };
  } catch (error) {
    console.error("checkOnboardingStatus error:", error);
    return {
      isInitialized: false,
      hasAdmin: false,
      hasTheme: false,
    };
  }
}

// Jalankan inisialisasi onboarding penuh
export async function executeOnboarding(payload: OnboardingPayload): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!payload.adminUsername?.trim() || !payload.adminPassword?.trim()) {
      return { success: false, error: "Username dan password Super Admin wajib diisi." };
    }

    if (!payload.adminPin || payload.adminPin.trim().length !== 4) {
      return { success: false, error: "Security PIN wajib 4 digit angka." };
    }

    if (!payload.brandName?.trim()) {
      return { success: false, error: "Nama Brand wajib diisi." };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(payload.adminPassword.trim(), salt);
    const pinHash = await bcrypt.hash(payload.adminPin.trim(), salt);

    // 1. Buat atau update Super Admin pertama
    const cleanUsername = payload.adminUsername.trim().toLowerCase();
    const existingAdmin = await db.admin.findUnique({
      where: { username: cleanUsername },
    });

    if (existingAdmin) {
      await db.admin.update({
        where: { id: existingAdmin.id },
        data: {
          displayName: payload.adminDisplayName.trim() || payload.adminUsername,
          passwordHash,
          pinHash,
          isActive: true,
        },
      });
    } else {
      await db.admin.create({
        data: {
          username: cleanUsername,
          displayName: payload.adminDisplayName.trim() || payload.adminUsername,
          passwordHash,
          pinHash,
          isActive: true,
        },
      });
    }

    // 2. Buat atau update Brand Theme Setting
    const existingTheme = await db.webThemeSetting.findFirst();
    const themeData = {
      brandName: payload.brandName.trim(),
      tagline: payload.tagline.trim() || "Taste the Quality",
      heroTitle: payload.heroTitle.trim() || `Selamat Datang di ${payload.brandName.trim()}`,
      heroTitleAccent: payload.heroTitleAccent.trim() || "Kualitas Terbaik Pilihan Anda",
      heroDescription:
        payload.heroDescription.trim() ||
        "Menyajikan produk dan hidangan istimewa dengan bahan baku berkualitas dan pelayanan sepenuh hati.",
      primaryColor: payload.primaryColor || "#ff7a00",
      accentColor: payload.accentColor || "#10b981",
      whatsappNumber: payload.whatsappNumber.trim() || "+62 812 0000 0000",
      instagramUrl: payload.instagramUrl.trim() || "",
      announcementText: `Selamat datang di website resmi ${payload.brandName.trim()}!`,
      isActive: true,
    };

    if (existingTheme) {
      await db.webThemeSetting.update({
        where: { id: existingTheme.id },
        data: themeData,
      });
    } else {
      await db.webThemeSetting.create({
        data: themeData,
      });
    }

    // 3. Penanganan Data Katalog
    if (payload.sampleDataMode === "clean") {
      // Bersihkan sample produk lama jika ingin mulai dari nol
      await db.orderItem.deleteMany({});
      await db.payment.deleteMany({});
      await db.orderStatusHistory.deleteMany({});
      await db.order.deleteMany({});
      await db.product.deleteMany({});
      await db.category.deleteMany({});
      await db.customerTestimonial.deleteMany({});
      await db.galleryItem.deleteMany({});
    }

    // 4. Buat sesi admin otomatis agar langsung login ke BO
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 jam
    });

    cookieStore.set(SESSION_ADMIN_COOKIE, cleanUsername, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return {
      success: true,
      message: `Inisialisasi aplikasi ${payload.brandName} berhasil diselesaikan!`,
    };
  } catch (error: any) {
    console.error("executeOnboarding error:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kegagalan saat inisialisasi aplikasi.",
    };
  }
}
