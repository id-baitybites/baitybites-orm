import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, CUSTOMER_SESSION_COOKIE } from "@/lib/auth-constants";

// Rute yang membutuhkan autentikasi Superadmin (OMS)
const ADMIN_PATHS = [
  "/dashboard",
  "/orders",
  "/products",
  "/kitchen",
  "/customers",
  "/production",
  "/reports",
  "/settings",
  "/cms",
];

// Rute login admin
const ADMIN_LOGIN_PATH = "/admin";

// Rute yang membutuhkan autentikasi Pelanggan
const CUSTOMER_PROTECTED_PATHS = ["/profile"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati aset statis dan API internal Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // file statis (favicon, gambar, dll)
  ) {
    return NextResponse.next();
  }

  const isAdminRoute = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isCustomerRoute = CUSTOMER_PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const adminSession = request.cookies.get(SESSION_COOKIE)?.value;
  const isAdminAuthenticated = adminSession === "authenticated";

  const customerSession = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const isCustomerAuthenticated = Boolean(customerSession);

  // Akses rute Admin tanpa login admin → redirect ke /admin
  if (isAdminRoute && !isAdminAuthenticated) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin sudah login tapi buka /admin → redirect ke /orders
  if (isAdminAuthenticated && pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.redirect(new URL("/orders", request.url));
  }

  // Akses rute Pelanggan tanpa login pelanggan → redirect ke /login?tab=customer
  if (isCustomerRoute && !isCustomerAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("tab", "customer");
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // (legacy) Sudah login admin tapi buka /login → redirect ke /orders jika tab bukan customer
  const tab = request.nextUrl.searchParams.get("tab");
  if (isAdminAuthenticated && pathname === "/login" && tab !== "customer") {
    return NextResponse.redirect(new URL("/orders", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|manifest).*)"],
};

