"use server";

export async function superAdminLoginAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const securityPin = formData.get("securityPin") as string;

  // Kredensial superadmin
  // Dapat disesuaikan melalui environment variable atau default demo
  const validUsername = process.env.SUPERADMIN_USERNAME || "superadmin";
  const validPassword = process.env.SUPERADMIN_PASSWORD || "baitybites2026";
  const validPin = process.env.SUPERADMIN_PIN || "9988";

  if (!username || !password) {
    return { success: false, error: "Username dan Password wajib diisi." };
  }

  // Validasi kredensial
  if (
    (username.trim().toLowerCase() === validUsername.toLowerCase() ||
      username.trim() === "admin@baitybites.id") &&
    password === validPassword
  ) {
    // Jika PIN diisi atau opsional, pastikan sesuai
    if (securityPin && securityPin.trim() !== validPin) {
      return { success: false, error: "Security PIN 4-digit tidak sesuai." };
    }

    return { success: true };
  }

  return {
    success: false,
    error: "Kombinasi Username atau Password Superadmin tidak valid.",
  };
}
