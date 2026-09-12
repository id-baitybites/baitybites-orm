import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import {
  getThemeSettingAction,
  getGalleryItemsAction,
  getTestimonialsAction,
} from "./actions";
import { CmsClient } from "./CmsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manajemen Konten (CMS) · Baitybites",
  description: "Kelola foto galeri menu, moderasi testimoni pelanggan, serta banner promosi dan tema web.",
};

export default async function CmsPage() {
  const [theme, gallery, testimonials] = await Promise.all([
    getThemeSettingAction(),
    getGalleryItemsAction(),
    getTestimonialsAction(),
  ]);

  return (
    <AppShell>
      <CmsClient
        initialTheme={theme}
        initialGallery={gallery}
        initialTestimonials={testimonials}
      />
    </AppShell>
  );
}
