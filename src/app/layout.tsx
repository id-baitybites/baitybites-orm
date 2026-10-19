import type { Metadata, Viewport } from "next";
import { Ubuntu, Ubuntu_Mono } from "next/font/google";

import "./globals.scss";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  variable: "--font-ubuntu-mono",
  display: "swap",
  weight: ["400", "700"],
});

const appBrandName = process.env.NEXT_PUBLIC_STORE_NAME || "Baitybites ORM";

export const metadata: Metadata = {
  title: {
    default: appBrandName,
    template: `%s · ${appBrandName}`,
  },
  description: process.env.NEXT_PUBLIC_STORE_NAME
    ? `Sistem manajemen operasional dan pemesanan ${process.env.NEXT_PUBLIC_STORE_NAME}.`
    : "Sistem manajemen pesanan internal Baitybites — pantau dapur, produksi, dan pengiriman dalam satu layar.",
  keywords: ["order management", "kitchen display", "OMS"],
  robots: { index: false, follow: false },
  openGraph: {
    title: appBrandName,
    description: `Sistem operasional dan pemesanan ${appBrandName}.`,
    siteName: appBrandName,
    locale: "id_ID",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/images/icons/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/images/icons/baitybites-pwa-logo.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#ff7a00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${ubuntu.variable} ${ubuntuMono.variable}`}>
        {children}
      </body>
    </html>
  );
}