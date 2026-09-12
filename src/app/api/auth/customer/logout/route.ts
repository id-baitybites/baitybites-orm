import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_INFO_COOKIE,
} from "@/lib/auth-constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.delete(CUSTOMER_SESSION_COOKIE);
  response.cookies.delete(CUSTOMER_INFO_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.delete(CUSTOMER_SESSION_COOKIE);
  response.cookies.delete(CUSTOMER_INFO_COOKIE);
  return response;
}
