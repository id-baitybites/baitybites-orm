import type { Metadata } from "next";
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
  title: "Baitybites ORM",
  description: "Baitybites Order Management System",
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