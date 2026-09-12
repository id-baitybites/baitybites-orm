import { PublicLandingView } from "@/components/public/PublicLandingView";
import { getCustomerCookieInfo, getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Baca info pelanggan dari cookie sesi secara instan (0ms)
  const cookieCustomer = await getCustomerCookieInfo();

  let customerInfo = cookieCustomer;
  if (!customerInfo) {
    try {
      const dbCustomer = await getCurrentCustomer();
      if (dbCustomer) {
        customerInfo = {
          id: dbCustomer.id,
          name: dbCustomer.name,
          email: dbCustomer.email ?? "",
          avatarUrl: dbCustomer.avatarUrl ?? "",
        };
      }
    } catch {
      // ignore
    }
  }

  return <PublicLandingView initialCustomer={customerInfo} />;
}