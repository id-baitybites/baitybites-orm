"use server";

import { redirect } from "next/navigation";
import { setSession, clearSession, verifyAdminCredentials } from "@/lib/auth";

// ─── Login ────────────────────────────────────────────────────────────────────

export async function superAdminLoginAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const securityPin = (formData.get("securityPin") as string) || undefined;

  const result = await verifyAdminCredentials(username, password, securityPin);

  if (result.success && result.username) {
    await setSession(result.username);
  }

  return { success: result.success, error: result.error };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
