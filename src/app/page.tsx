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

  // 2. Baca data dinamis dari CMS (Testimoni terkurasi, Tema Web, dan Galeri Foto)
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

  let galleryItems: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    category: string;
  }> = [];

  let pendingTestimoni: {
    id: string;
    author: string;
    role: string | null;
    city: string | null;
    quote: string;
    rating: number;
    avatarUrl: string | null;
    createdAt: Date;
    isFeatured: boolean;
  } | null = null;

  try {
    const [r0, r1, r2, r3] = await Promise.allSettled([
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
      db.galleryItem.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" }, // FIFO: selalu tampilkan yang terbaru di awal
        take: 8, // Batasi maksimal 4 item x 2 baris
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          category: true,
        },
      }),
      customerInfo?.name
        ? db.customerTestimonial.findFirst({
            where: {
              author: customerInfo.name,
              isFeatured: false,
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              author: true,
              role: true,
              city: true,
              quote: true,
              rating: true,
              avatarUrl: true,
              createdAt: true,
              isFeatured: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (r0.status === "fulfilled") testimonials = r0.value;
    else console.error("Gagal load testimonials:", r0.reason);

    if (r1.status === "fulfilled") themeSetting = r1.value;
    else console.error("Gagal load theme setting:", r1.reason);

    if (r2.status === "fulfilled") galleryItems = r2.value;
    else console.error("Gagal load gallery:", r2.reason);

    if (r3.status === "fulfilled") pendingTestimoni = r3.value;
    else console.error("Gagal load pending testimoni:", r3.reason);
  } catch (err) {
    console.error("Gagal load CMS data untuk homepage:", err);
  }

  return (
    <PublicLandingView
      initialCustomer={customerInfo}
      initialTestimonials={testimonials}
      initialTheme={themeSetting}
      initialGallery={galleryItems}
      initialPendingTestimoni={pendingTestimoni}
    />
  );
}