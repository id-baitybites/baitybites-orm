import { Metadata } from "next";
import { TrackingOrderView } from "@/components/tracking/TrackingOrderView";
import { getCustomerCookieInfo, getCurrentCustomer } from "@/lib/customer-auth";
import { trackOrderAction, type TrackedOrderResult } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tracking Pesanan Real-Time | Baitybites",
  description: "Lacak status pesanan Baitybites mulai dari proses masak dapur hingga penjemputan dan pengiriman kurir Paxel secara akurat.",
};

interface TrackingPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function TrackingPage({ searchParams }: TrackingPageProps) {
  const { ref } = await searchParams;

  let customerInfo = await getCustomerCookieInfo();
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

  let initialTrackResult: TrackedOrderResult | null = null;
  if (ref && ref.trim()) {
    try {
      const res = await trackOrderAction(ref.trim());
      if (res.success && res.data) {
        initialTrackResult = res.data;
      }
    } catch {
      // ignore
    }
  }

  return (
    <TrackingOrderView
      initialCustomer={customerInfo}
      initialOrderRef={ref || ""}
      initialTrackResult={initialTrackResult}
    />
  );
}
