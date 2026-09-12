import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { getReportsDataAction } from "./actions";
import { ReportsClient } from "./ReportsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Laporan Analitik Bisnis · Baitybites",
  description:
    "Laporan omzet penjualan, kinerja produk terlaris, distribusi saluran, dan riwayat transaksi Baitybites OMS.",
};

export default async function ReportsPage() {
  const reportsData = await getReportsDataAction("all");

  return (
    <AppShell>
      <ReportsClient initialData={reportsData} />
    </AppShell>
  );
}
