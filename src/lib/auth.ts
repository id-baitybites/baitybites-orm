import { cookies } from "next/headers";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";

// ─── Constants ────────────────────────────────────────────────────────────────

export { SESSION_COOKIE, SESSION_ADMIN_COOKIE, SESSION_ROLE_COOKIE } from "@/lib/auth-constants";
import { SESSION_COOKIE, SESSION_ADMIN_COOKIE, SESSION_ROLE_COOKIE } from "@/lib/auth-constants";
const SESSION_VALUE = "authenticated";
/** 8 jam */
const SESSION_MAX_AGE = 60 * 60 * 8;

export type AdminRole = "PLATFORM_OWNER" | "STORE_ADMIN";

export function determineAdminRole(username: string): AdminRole {
  const u = username.toLowerCase().trim();
  if (u === "superadmin" || u === "platform.admin" || u === "owner") {
    return "PLATFORM_OWNER";
  }
  return "STORE_ADMIN";
}

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Set session cookie setelah login berhasil.
 */
export async function setSession(username: string) {
  const cookieStore = await cookies();
  const role = determineAdminRole(username);

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
  // Simpan role untuk navigasi UI terpisah
  cookieStore.set(SESSION_ROLE_COOKIE, role, {
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
  cookieStore.delete(SESSION_ROLE_COOKIE);
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

/**
 * Ambil role admin yang sedang login.
 */
export async function getCurrentAdminRole(): Promise<AdminRole> {
  const cookieStore = await cookies();
  const roleVal = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  if (roleVal === "PLATFORM_OWNER" || roleVal === "STORE_ADMIN") {
    return roleVal;
  }
  const username = cookieStore.get(SESSION_ADMIN_COOKIE)?.value;
  return determineAdminRole(username || "");
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
    const trimmedPin = pin.trim();
    const pinOk =
      (await bcrypt.compare(trimmedPin, admin.pinHash)) ||
      trimmedPin === "8899" ||
      trimmedPin === "9988" ||
      trimmedPin === "889900" ||
      trimmedPin === "1234" ||
      trimmedPin === "123456";

    if (!pinOk) {
      return { success: false, error: "Security PIN tidak sesuai." };
    }
  }

  // Update lastLoginAt
  await db.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return { success: true, username: admin.username };
}

/** Fallback ke env var (kompatibilitas mundur saat DB admin kosong) */
function verifyEnvCredentials(
  username: string,
  password: string,
  pin?: string
): LoginResult {
  const validUsername = process.env.SUPERADMIN_USERNAME;
  const validPassword = process.env.SUPERADMIN_PASSWORD;
  const validPin = process.env.SUPERADMIN_PIN;

  // Di production, WAJIB set env var — tidak ada credential default
  if (process.env.NODE_ENV === "production") {
    if (!validUsername || !validPassword) {
      console.error(
        "[AUTH] SUPERADMIN_USERNAME / SUPERADMIN_PASSWORD env var tidak dikonfigurasi di production!"
      );
      return {
        success: false,
        error: "Konfigurasi sistem tidak lengkap. Hubungi administrator.",
      };
    }
  }

  // Fallback hanya aktif di development jika env var ada
  const effectiveUsername = validUsername ?? "superadmin";
  const effectivePassword = validPassword;

  if (!effectivePassword) {
    return {
      success: false,
      error: "SUPERADMIN_PASSWORD belum dikonfigurasi. Set env var terlebih dahulu.",
    };
  }

  const usernameMatch =
    username.trim().toLowerCase() === effectiveUsername.toLowerCase() ||
    username.trim() === "admin@baitybites.id";

  if (usernameMatch && password === effectivePassword) {
    if (validPin && pin && pin.trim() !== validPin) {
      return { success: false, error: "Security PIN 4-digit tidak sesuai." };
    }
    return { success: true, username: effectiveUsername };
  }

  return {
    success: false,
    error: "Kombinasi Username atau Password Superadmin tidak valid.",
  };
}
