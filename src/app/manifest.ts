import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baitybites ORM",
    short_name: "Baitybites",
    description: "Sistem manajemen pesanan internal Baitybites — pantau dapur, produksi, dan pengiriman dalam satu layar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff7a00",
    icons: [
      {
        src: "/images/icons/baitybites-pwa-logo.png",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/icons/baitybites-pwa-logo.png",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
