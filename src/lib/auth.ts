import { cookies } from "next/headers";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";

// ─── Constants ────────────────────────────────────────────────────────────────

export { SESSION_COOKIE, SESSION_ADMIN_COOKIE, SESSION_ROLE_COOKIE } from "@/lib/auth-constants";
import { SESSION_COOKIE, SESSION_ADMIN_COOKIE, SESSION_ROLE_COOKIE } from "@/lib/auth-constants";
const SESSION_VALUE = "authenticated";
/** 8 jam */
const SESSION_MAX_AGE = 60 * 60 * 8;

export type AdminRole =
  | "PLATFORM_OWNER"
  | "SUPER_ADMIN"
  | "KASIR"
  | "KITCHEN_STAFF"
  | "STORE_ADMIN";

export function determineAdminRole(username: string): AdminRole {
  const u = username.toLowerCase().trim();
  if (u === "superadmin" || u === "platform.admin" || u === "owner") {
    return "PLATFORM_OWNER";
  }
  if (u.includes("kasir") || u.includes("cashier")) {
    return "KASIR";
  }
  if (u.includes("kitchen") || u.includes("chef") || u.includes("dapur")) {
    return "KITCHEN_STAFF";
  }
  return "SUPER_ADMIN";
}

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Set session cookie setelah login berhasil.
 */
export async function setSession(username: string, role?: AdminRole) {
  const cookieStore = await cookies();
  const effectiveRole = role || determineAdminRole(username);

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
  cookieStore.set(SESSION_ROLE_COOKIE, effectiveRole, {
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
  const roleVal = cookieStore.get(SESSION_ROLE_COOKIE)?.value as AdminRole | undefined;
  if (
    roleVal &&
    [
      "PLATFORM_OWNER",
      "SUPER_ADMIN",
      "KASIR",
      "KITCHEN_STAFF",
      "STORE_ADMIN",
    ].includes(roleVal)
  ) {
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
  role?: AdminRole;
}

/**
 * Verifikasi kredensial admin murni dari tabel `admins` di database.
 * Tidak ada credential hardcoded maupun fallback plaintext.
 * Jika tabel kosong, kembalikan error yang jelas agar admin dapat menjalankan seed.
 */
export async function verifyAdminCredentials(
  username: string,
  password: string,
  pin?: string
): Promise<LoginResult> {
  if (!username || !password) {
    return { success: false, error: "Username dan Password wajib diisi." };
  }

  type AdminRecord = {
    id: string;
    username: string;
    passwordHash: string;
    pinHash: string | null;
    isActive: boolean;
    role: AdminRole;
  };

  let admin: AdminRecord | null = null;

  try {
    const found = await db.admin.findUnique({
      where: { username: username.trim().toLowerCase() },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        pinHash: true,
        isActive: true,
        role: true,
      },
    });
    admin = found as AdminRecord | null;
  } catch (err) {
    console.error("[AUTH] Gagal query tabel admins:", err);
    return {
      success: false,
      error: "Terjadi kesalahan koneksi database. Coba lagi sebentar.",
    };
  }

  if (!admin) {
    // Admin tidak ditemukan — jangan beri petunjuk mana yang salah
    return {
      success: false,
      error: "Kombinasi Username atau Password tidak valid.",
    };
  }

  if (!admin.isActive) {
    return { success: false, error: "Akun admin ini tidak aktif." };
  }

  // Verifikasi password: murni bcrypt dari DB
  const passwordOk = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordOk) {
    return {
      success: false,
      error: "Kombinasi Username atau Password tidak valid.",
    };
  }

  // Verifikasi PIN jika diberikan (opsional, hanya jika akun punya pinHash)
  if (pin && pin.trim() !== "" && admin.pinHash) {
    const pinOk = await bcrypt.compare(pin.trim(), admin.pinHash);
    if (!pinOk) {
      return { success: false, error: "Security PIN tidak sesuai." };
    }
  }

  // Catat waktu login terakhir secara async, tidak blokir response
  db.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  }).catch((err) =>
    console.warn("[AUTH] Gagal update lastLoginAt:", err)
  );

  return {
    success: true,
    username: admin.username,
    role: admin.role,
  };
}
