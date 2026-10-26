/**
 * Helper terpusat untuk mendapatkan base URL aplikasi produksi maupun lokal.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.NEXTAUTH_URL?.trim()) {
    return process.env.NEXTAUTH_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_BASE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, "")}`;
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, "")}`;
  }
  return "https://baitybites-orm.vercel.app";
}
