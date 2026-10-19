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
    await setSession(result.username);

    const isOwner =
      result.username.toLowerCase() === "superadmin" ||
      result.username.toLowerCase() === "platform.admin";
    const redirectTo = isOwner ? "/platform/console" : "/orders";

    return {
      success: true,
      role: isOwner ? "PLATFORM_OWNER" : "STORE_ADMIN",
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
