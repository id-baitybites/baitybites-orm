import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Customer } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────
export { CUSTOMER_SESSION_COOKIE, CUSTOMER_INFO_COOKIE } from "@/lib/auth-constants";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_INFO_COOKIE } from "@/lib/auth-constants";

/** Masa aktif session pelanggan: 30 hari */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

// ─── Session Helpers ──────────────────────────────────────────────────────────

/**
 * Simpan ID pelanggan ke dalam cookie sesi aman (httpOnly)
 * dan simpan info ringkas (nama, avatar) ke cookie non-httpOnly untuk UI header.
 */
export async function setCustomerSession(
  customerId: string,
  info: {
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  }
) {
  const cookieStore = await cookies();

  // Sesi utama httpOnly (berisi ID pelanggan)
  cookieStore.set(CUSTOMER_SESSION_COOKIE, customerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  // Info publik non-sensitif untuk visual header (avatar & nama)
  const clientInfo = JSON.stringify({
    id: customerId,
    name: info.name,
    email: info.email ?? "",
    avatarUrl: info.avatarUrl ?? "",
  });

  cookieStore.set(CUSTOMER_INFO_COOKIE, clientInfo, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Hapus sesi pelanggan saat logout.
 */
export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
  cookieStore.delete(CUSTOMER_INFO_COOKIE);
}

/**
 * Cek apakah pelanggan sedang login.
 */
export async function isCustomerAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
}

/**
 * Ambil data lengkap pelanggan yang sedang login dari database.
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
  try {
    const cookieStore = await cookies();
    const customerId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!customerId) return null;

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    return customer;
  } catch (err) {
    console.error("getCurrentCustomer error:", err);
    return null;
  }
}

/**
 * Ambil info cepat pelanggan dari cookie (ringan, tanpa query DB)
 */
export async function getCustomerCookieInfo(): Promise<{
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(CUSTOMER_INFO_COOKIE)?.value;
    if (!raw) return null;
    let val = raw;
    while (val.includes("%")) {
      try {
        const decoded = decodeURIComponent(val);
        if (decoded === val) break;
        val = decoded;
      } catch {
        break;
      }
    }
    return JSON.parse(val);
  } catch {
    return null;
  }
}
