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

export const metadata: Metadata = {
  title: {
    default: "Baitybites ORM",
    template: "%s · Baitybites ORM",
  },
  description:
    "Sistem manajemen pesanan internal Baitybites — pantau dapur, produksi, dan pengiriman dalam satu layar.",
  keywords: ["baitybites", "order management", "kitchen display", "OMS"],
  robots: { index: false, follow: false },
  openGraph: {
    title: "Baitybites ORM",
    description: "Internal order management system untuk tim Baitybites.",
    siteName: "Baitybites ORM",
    locale: "id_ID",
    type: "website",
  },
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