import { NextResponse } from "next/server";
import { getCustomerCookieInfo, getCurrentCustomer, isCustomerAuthenticated } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Cek info instan dari cookie (0ms)
    const cookieCustomer = await getCustomerCookieInfo();
    if (cookieCustomer) {
      return NextResponse.json(
        { authenticated: true, customer: cookieCustomer },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    // 2. Cek apakah ada session ID pelanggan
    const hasSession = await isCustomerAuthenticated();
    if (!hasSession) {
      return NextResponse.json(
        { authenticated: false, customer: null },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    // 3. Fallback ambil dari database jika cookie info hilang tapi session ada
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json(
        { authenticated: false, customer: null },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email ?? "",
          avatarUrl: customer.avatarUrl ?? "",
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false, customer: null },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}
