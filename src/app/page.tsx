import { PublicLandingView } from "@/components/public/PublicLandingView";
import { getCustomerCookieInfo, getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";

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

  // 2. Baca data dinamis dari CMS (Testimoni terkurasi & Tema Web)
  let testimonials: Array<{
    author: string;
    city: string | null;
    role: string | null;
    quote: string;
    rating: number;
    avatarUrl: string | null;
  }> = [];

  let themeSetting: {
    brandName?: string;
    tagline?: string;
    heroTitle?: string;
    heroTitleAccent?: string;
    heroDescription?: string;
    heroImage?: string;
    announcementText?: string | null;
    primaryColor?: string;
    whatsappNumber?: string;
  } | null = null;

  try {
    const [dbTestimonials, dbTheme] = await Promise.all([
      db.customerTestimonial.findMany({
        where: { isFeatured: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        select: {
          author: true,
          city: true,
          role: true,
          quote: true,
          rating: true,
          avatarUrl: true,
        },
      }),
      db.webThemeSetting.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        select: {
          brandName: true,
          tagline: true,
          heroTitle: true,
          heroTitleAccent: true,
          heroDescription: true,
          heroImage: true,
          announcementText: true,
          primaryColor: true,
          whatsappNumber: true,
        },
      }),
    ]);

    testimonials = dbTestimonials;
    themeSetting = dbTheme;
  } catch (err) {
    console.error("Gagal load CMS data untuk homepage:", err);
  }

  return (
    <PublicLandingView
      initialCustomer={customerInfo}
      initialTestimonials={testimonials}
      initialTheme={themeSetting}
    />
  );
}