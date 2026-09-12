import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Inisiasi Google OAuth 2.0 atau Demo Login jika kredensial belum ada.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const returnTo = searchParams.get("returnTo") || "/profile";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl.protocol.replace(":", "") || "http");
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const baseUrl = isLocal ? `${protocol}://${host}` : (process.env.NEXTAUTH_URL || `${protocol}://${host}`);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Jika dipanggil dengan mode=demo atau kredensial Google belum di-set di .env:
  // Arahkan ke endpoint demo login yang otomatis membuat/mengaitkan customer di DB
  if (mode === "demo" || !clientId) {
    const demoEmail = searchParams.get("email") || "pelanggan.baitybites@gmail.com";
    const demoName = searchParams.get("name") || "Budi Santoso (Google)";
    const demoAvatar =
      searchParams.get("avatar") ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

    const demoCallbackUrl = new URL("/api/auth/google/callback", request.url);
    demoCallbackUrl.searchParams.set("demo", "true");
    demoCallbackUrl.searchParams.set("email", demoEmail);
    demoCallbackUrl.searchParams.set("name", demoName);
    demoCallbackUrl.searchParams.set("avatar", demoAvatar);
    demoCallbackUrl.searchParams.set("returnTo", returnTo);

    return NextResponse.redirect(demoCallbackUrl);
  }

  // Alur Google OAuth 2.0 Resmi
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(googleAuthUrl.toString());
}
