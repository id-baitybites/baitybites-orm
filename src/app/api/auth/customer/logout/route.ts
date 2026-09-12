import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await clearCustomerSession();
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  return NextResponse.redirect(new URL(returnTo, request.url));
}

export async function GET(request: NextRequest) {
  await clearCustomerSession();
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  return NextResponse.redirect(new URL(returnTo, request.url));
}
