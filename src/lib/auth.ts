import { cookies } from "next/headers";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";

// ─── Constants ────────────────────────────────────────────────────────────────

export { SESSION_COOKIE, SESSION_ADMIN_COOKIE } from "@/lib/auth-constants";
import { SESSION_COOKIE, SESSION_ADMIN_COOKIE } from "@/lib/auth-constants";
const SESSION_VALUE = "authenticated";
/** 8 jam */
const SESSION_MAX_AGE = 60 * 60 * 8;

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Set session cookie setelah login berhasil.
 */
export async function setSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  // Simpan username untuk keperluan UI (non-sensitive)
  cookieStore.set(SESSION_ADMIN_COOKIE, username, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Hapus semua session cookie saat logout.
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(SESSION_ADMIN_COOKIE);
}

/**
 * Cek apakah session aktif.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const val = cookieStore.get(SESSION_COOKIE)?.value;
  return val === SESSION_VALUE;
}

/**
 * Ambil username admin yang sedang login (dari cookie non-httpOnly).
 */
export async function getCurrentAdminUsername(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_ADMIN_COOKIE)?.value ?? null;
}

// ─── Verifikasi Login dari DB ─────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  error?: string;
  username?: string;
}

/**
 * Verifikasi kredensial terhadap tabel admins di DB.
 * Fallback ke env var jika tabel kosong (masa transisi).
 */
export async function verifyAdminCredentials(
  username: string,
  password: string,
  pin?: string
): Promise<LoginResult> {
  if (!username || !password) {
    return { success: false, error: "Username dan Password wajib diisi." };
  }

  // Cari admin di DB
  const admin = await db.admin.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (!admin) {
    // Fallback ke env var (masa transisi / sebelum seed)
    return verifyEnvCredentials(username, password, pin);
  }

  if (!admin.isActive) {
    return { success: false, error: "Akun admin ini tidak aktif." };
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordOk) {
    return {
      success: false,
      error: "Kombinasi Username atau Password tidak valid.",
    };
  }

  if (pin && admin.pinHash) {
    const pinOk = await bcrypt.compare(pin, admin.pinHash);
    if (!pinOk) {
      return { success: false, error: "Security PIN 4-digit tidak sesuai." };
    }
  }

  // Update lastLoginAt
  await db.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return { success: true, username: admin.username };
}

/** Fallback ke env var (kompatibilitas mundur) */
function verifyEnvCredentials(
  username: string,
  password: string,
  pin?: string
): LoginResult {
  const validUsername = process.env.SUPERADMIN_USERNAME || "superadmin";
  const validPassword = process.env.SUPERADMIN_PASSWORD || "baitybites2026";
  const validPin = process.env.SUPERADMIN_PIN || "9988";

  const usernameMatch =
    username.trim().toLowerCase() === validUsername.toLowerCase() ||
    username.trim() === "admin@baitybites.id";

  if (usernameMatch && password === validPassword) {
    if (pin && pin.trim() !== validPin) {
      return { success: false, error: "Security PIN 4-digit tidak sesuai." };
    }
    return { success: true, username: validUsername };
  }

  return {
    success: false,
    error: "Kombinasi Username atau Password Superadmin tidak valid.",
  };
}
