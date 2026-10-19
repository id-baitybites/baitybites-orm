"use server";

import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_ADMIN_COOKIE, SESSION_ROLE_COOKIE } from "@/lib/auth-constants";
import { determineAdminRole } from "@/lib/auth";

export interface OnboardingStatus {
  isInitialized: boolean;
  hasAdmin: boolean;
  hasTheme: boolean;
  currentBrandName?: string;
}

export interface OnboardingPayload {
  adminUsername: string;
  adminDisplayName: string;
  adminPassword: string;
  adminPin: string;
  databaseUrl: string;
  directUrl: string;
  canonicalDomain: string;
  googleClientId: string;
  googleClientSecret: string;
  cloudinaryUrl: string;
  geminiApiKey: string;
  companyLegalName: string;
  companyAddress: string;
  companyCity: string;
  companyEmail: string;
  companyPhone: string;
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroDescription: string;
  primaryColor: string;
  accentColor: string;
  instagramUrl: string;
  sampleDataMode: "clean" | "sample";
}

export interface OnboardingStepResult {
  step: string;
  success: boolean;
  message: string;
}

export interface OnboardingResult {
  success: boolean;
  message?: string;
  error?: string;
  steps?: OnboardingStepResult[];
  dbMigrated?: boolean;
  dbSkipped?: boolean;
}

// --- Cek status inisialisasi --------------------------------------------------

export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    const adminCount = await db.admin.count();
    const theme = await db.webThemeSetting.findFirst();
    const isInitialized = adminCount > 0 && !!theme;
    return {
      isInitialized,
      hasAdmin: adminCount > 0,
      hasTheme: !!theme,
      currentBrandName: theme?.brandName || "Brand Baru",
    };
  } catch (error) {
    console.error("checkOnboardingStatus error:", error);
    return { isInitialized: false, hasAdmin: false, hasTheme: false };
  }
}

// --- Provisi & Migrasi Schema DB Target --------------------------------------

async function runDatabaseMigration(
  databaseUrl: string,
  directUrl?: string
): Promise<{ success: boolean; message: string; skipped?: boolean }> {
  const serverUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (!databaseUrl.trim() || databaseUrl.trim() === serverUrl) {
    return {
      success: true,
      skipped: true,
      message: "Database adalah server saat ini — schema sudah tersedia, tidak perlu migrasi.",
    };
  }

  try {
    const { execSync } = await import("child_process");
    const { resolve } = await import("path");
    const schemaPath = resolve(process.cwd(), "prisma", "schema.prisma");
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      DATABASE_URL: databaseUrl.trim(),
      ...(directUrl?.trim() ? { DIRECT_URL: directUrl.trim() } : {}),
    };
    execSync(
      `npx prisma db push --schema="${schemaPath}" --skip-generate --accept-data-loss`,
      { env, stdio: "pipe", timeout: 120000 }
    );
    return { success: true, message: "Schema database berhasil di-push. Semua tabel siap digunakan." };
  } catch (err: unknown) {
    const anyErr = err as { stderr?: Buffer; message?: string };
    const stderr = anyErr?.stderr?.toString?.() ?? anyErr?.message ?? "Unknown error";
    console.error("[Onboarding] prisma db push error:", stderr);
    return { success: false, message: `Gagal migrasi schema: ${stderr.slice(0, 300)}` };
  }
}

// --- Eksekusi Onboarding Penuh -----------------------------------------------

export async function executeOnboarding(payload: OnboardingPayload): Promise<OnboardingResult> {
  const steps: OnboardingStepResult[] = [];

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

    // Step 1: Provisi Schema Database Target
    let dbMigrated = false;
    let dbSkipped = false;

    if (payload.databaseUrl.trim()) {
      const migrationResult = await runDatabaseMigration(payload.databaseUrl, payload.directUrl);
      dbMigrated = migrationResult.success && !migrationResult.skipped;
      dbSkipped = !!migrationResult.skipped;
      steps.push({ step: "Provisi Schema Database", success: migrationResult.success, message: migrationResult.message });
      if (!migrationResult.success) {
        return { success: false, error: `Gagal menyiapkan database: ${migrationResult.message}`, steps };
      }
    } else {
      dbSkipped = true;
      steps.push({ step: "Provisi Schema Database", success: true, message: "Menggunakan database server — schema sudah tersedia." });
    }

    // Step 2: Buat / Update Super Admin
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(payload.adminPassword.trim(), salt);
      const pinHash = await bcrypt.hash(payload.adminPin.trim(), salt);
      const cleanUsername = payload.adminUsername.trim().toLowerCase();
      const existingAdmin = await db.admin.findUnique({ where: { username: cleanUsername } });

      if (existingAdmin) {
        await db.admin.update({
          where: { id: existingAdmin.id },
          data: { displayName: payload.adminDisplayName.trim() || cleanUsername, passwordHash, pinHash, isActive: true },
        });
      } else {
        await db.admin.create({
          data: { username: cleanUsername, displayName: payload.adminDisplayName.trim() || cleanUsername, passwordHash, pinHash, isActive: true },
        });
      }
      steps.push({ step: "Akun Super Admin", success: true, message: `Akun '${cleanUsername}' berhasil ${existingAdmin ? "diperbarui" : "dibuat"}.` });
    } catch (adminErr: unknown) {
      const msg = adminErr instanceof Error ? adminErr.message : "Gagal membuat akun admin.";
      steps.push({ step: "Akun Super Admin", success: false, message: msg });
      return { success: false, error: msg, steps };
    }

    // Step 3: Buat / Update Brand Theme
    try {
      const brandName = payload.brandName.trim() || payload.companyLegalName.trim();
      const themeData = {
        brandName,
        tagline: payload.tagline.trim() || "Taste the Quality",
        heroTitle: payload.heroTitle.trim() || `Selamat Datang di ${brandName}`,
        heroTitleAccent: payload.heroTitleAccent.trim() || "Kualitas Terbaik Pilihan Anda",
        heroDescription: payload.heroDescription.trim() || "Menyajikan produk dan hidangan istimewa dengan bahan baku berkualitas dan pelayanan sepenuh hati.",
        primaryColor: payload.primaryColor || "#ff7a00",
        accentColor: payload.accentColor || "#10b981",
        whatsappNumber: payload.companyPhone.trim() || "+62 812 0000 0000",
        instagramUrl: payload.instagramUrl.trim() || "",
        announcementText: `Selamat datang di website resmi ${brandName}!`,
        isActive: true,
      };
      const existingTheme = await db.webThemeSetting.findFirst();
      if (existingTheme) {
        await db.webThemeSetting.update({ where: { id: existingTheme.id }, data: themeData });
      } else {
        await db.webThemeSetting.create({ data: themeData });
      }
      steps.push({ step: "Brand & Visual Identity", success: true, message: `Identitas brand '${brandName}' berhasil disimpan.` });
    } catch (themeErr: unknown) {
      const msg = themeErr instanceof Error ? themeErr.message : "Gagal menyimpan tema brand.";
      steps.push({ step: "Brand & Visual Identity", success: false, message: msg });
      return { success: false, error: msg, steps };
    }

    // Step 4: Bersihkan / Pertahankan Data Katalog
    try {
      if (payload.sampleDataMode === "clean") {
        await db.orderItem.deleteMany({});
        await db.payment.deleteMany({});
        await db.orderStatusHistory.deleteMany({});
        await db.order.deleteMany({});
        await db.product.deleteMany({});
        await db.category.deleteMany({});
        await db.customerTestimonial.deleteMany({});
        await db.galleryItem.deleteMany({});
        steps.push({ step: "Inisialisasi Katalog", success: true, message: "Database dibersihkan. Katalog produk siap diisi dari nol." });
      } else {
        steps.push({ step: "Inisialisasi Katalog", success: true, message: "Contoh data F&B dipertahankan sebagai referensi tampilan." });
      }
    } catch (cleanErr: unknown) {
      const msg = cleanErr instanceof Error ? cleanErr.message : "Gagal membersihkan data katalog.";
      steps.push({ step: "Inisialisasi Katalog", success: false, message: `Peringatan: ${msg}` });
    }

    // Step 5: Set Session Cookie (auto-login)
    const cleanUsername = payload.adminUsername.trim().toLowerCase();
    const role = determineAdminRole(cleanUsername);
    const SESSION_MAX_AGE = 60 * 60 * 24;

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    cookieStore.set(SESSION_ADMIN_COOKIE, cleanUsername, {
      httpOnly: false, // false agar bisa dibaca JS client untuk UI
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    cookieStore.set(SESSION_ROLE_COOKIE, role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    steps.push({
      step: "Sesi Admin",
      success: true,
      message: `Login otomatis sebagai '${cleanUsername}' (${role === "PLATFORM_OWNER" ? "Platform Owner" : "Store Admin"}) berhasil.`,
    });

    return {
      success: true,
      message: `Inisialisasi ${payload.brandName} selesai! ${steps.length} langkah berhasil.`,
      steps,
      dbMigrated,
      dbSkipped,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Terjadi kegagalan saat inisialisasi aplikasi.";
    console.error("executeOnboarding error:", error);
    return { success: false, error: msg, steps };
  }
}

// --- Helper: Uji Koneksi DB --------------------------------------------------

export async function testOnboardingDatabaseConnection(connectionUrl: string): Promise<{
  success: boolean;
  message: string;
  responseTimeMs?: number;
}> {
  if (!connectionUrl.trim()) {
    return { success: false, message: "URL Database tidak boleh kosong." };
  }

  const { Pool } = await import("pg");
  const startTime = Date.now();
  const testPool = new Pool({ connectionString: connectionUrl.trim(), connectionTimeoutMillis: 7000 });

  try {
    const client = await testPool.connect();
    await client.query("SELECT 1;");
    client.release();
    await testPool.end();
    const duration = Date.now() - startTime;
    return { success: true, message: `Berhasil terhubung ke database klien! Ping: ${duration}ms`, responseTimeMs: duration };
  } catch (err: unknown) {
    try { await testPool.end(); } catch { /* ignore */ }
    const msg = err instanceof Error ? err.message : "Pastikan host, user, password, dan SSL benar.";
    return { success: false, message: `Gagal terhubung: ${msg}` };
  }
}
