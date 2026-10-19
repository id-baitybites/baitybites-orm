"use server";

import { redirect } from "next/navigation";
import { setSession, clearSession, verifyAdminCredentials } from "@/lib/auth";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/rate-limit";
import { headers } from "next/headers";

// ─── Login ────────────────────────────────────────────────────────────────────

export async function superAdminLoginAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  redirectTo?: string;
  role?: string;
}> {
  const username = (formData.get("username") as string)?.trim().toLowerCase() || "";
  const password = formData.get("password") as string;
  const securityPin = (formData.get("securityPin") as string) || undefined;

  // Gunakan gabungan IP + username sebagai rate limit key
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";
  const rateLimitKey = `login:${ip}:${username}`;

  // Periksa rate limit sebelum memproses login
  const rateLimitCheck = checkRateLimit(rateLimitKey);
  if (!rateLimitCheck.allowed) {
    return { success: false, error: rateLimitCheck.error };
  }

  const result = await verifyAdminCredentials(username, password, securityPin);

  if (result.success && result.username) {
    // Login berhasil: reset counter dan set session
    resetRateLimit(rateLimitKey);
    const role = result.role || (result.username.toLowerCase() === "superadmin" || result.username.toLowerCase() === "platform.admin" ? "PLATFORM_OWNER" : "SUPER_ADMIN");
    await setSession(result.username, role);

    let redirectTo = "/orders";
    if (role === "PLATFORM_OWNER") {
      redirectTo = "/platform/console";
    } else if (role === "KITCHEN_STAFF") {
      redirectTo = "/kitchen";
    } else if (role === "KASIR") {
      redirectTo = "/orders";
    } else {
      redirectTo = "/orders";
    }

    return {
      success: true,
      role,
      redirectTo,
    };
  } else {
    // Login gagal: catat percobaan
    recordFailedAttempt(rateLimitKey);
    return { success: false, error: result.error };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
