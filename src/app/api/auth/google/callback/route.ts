import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { setCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDemo = searchParams.get("demo") === "true";
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const returnToParam = searchParams.get("returnTo");

  let returnTo = returnToParam || "/profile";
  if (stateRaw) {
    try {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
      if (parsed.returnTo) returnTo = parsed.returnTo;
    } catch {
      // ignore
    }
  }

  let googleSub = "";
  let email = "";
  let name = "";
  let avatarUrl = "";

  if (isDemo) {
    // Mode Demo / Dev pengujian lokal instan
    email = searchParams.get("email") || "pelanggan.baitybites@gmail.com";
    name = searchParams.get("name") || "Budi Santoso (Google)";
    avatarUrl =
      searchParams.get("avatar") ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
    googleSub = `demo-google-${Buffer.from(email).toString("hex").slice(0, 12)}`;
  } else if (code) {
    // Pertukaran token resmi via Google OAuth 2.0
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
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

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/login?error=Google+OAuth+credentials+not+configured", request.url)
      );
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error("Gagal mendapatkan access token Google:", tokenData);
        return NextResponse.redirect(
          new URL("/login?error=Failed+to+exchange+Google+token", request.url)
        );
      }

      // Ambil profil pengguna Google
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      const userInfo = await userInfoRes.json();
      googleSub = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name || userInfo.email?.split("@")[0] || "Pelanggan Baitybites";
      avatarUrl = userInfo.picture || "";
    } catch (err) {
      console.error("Error saat fetch profil Google:", err);
      return NextResponse.redirect(
        new URL("/login?error=Google+authentication+failed", request.url)
      );
    }
  } else {
    return NextResponse.redirect(
      new URL("/login?error=Missing+authorization+code", request.url)
    );
  }

  // Simpan / update data di PostgreSQL via Prisma
  try {
    let customer = await db.customer.findFirst({
      where: {
        OR: [
          ...(googleSub ? [{ googleId: googleSub }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (customer) {
      // Update info profil Google terbaru
      customer = await db.customer.update({
        where: { id: customer.id },
        data: {
          googleId: googleSub || customer.googleId,
          avatarUrl: avatarUrl || customer.avatarUrl,
          name: customer.name || name,
        },
      });
    } else {
      // Buat pelanggan baru
      customer = await db.customer.create({
        data: {
          googleId: googleSub || null,
          email: email || null,
          name: name || "Pelanggan Baitybites",
          avatarUrl: avatarUrl || null,
          customerType: "REGULAR",
        },
      });
    }

    // Set cookie sesi pelanggan
    await setCustomerSession(customer.id, {
      name: customer.name,
      email: customer.email,
      avatarUrl: customer.avatarUrl,
    });

    // Redirect ke tujuan (misal /profile) dengan flag welcome
    const targetUrl = new URL(returnTo, request.url);
    targetUrl.searchParams.set("loggedIn", "true");
    return NextResponse.redirect(targetUrl);
  } catch (err) {
    console.error("Gagal menyimpan sesi pelanggan Google:", err);
    return NextResponse.redirect(
      new URL("/login?error=Database+error+during+sign-in", request.url)
    );
  }
}
