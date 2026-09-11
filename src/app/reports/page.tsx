import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";

const reports = [
  { title: "Laporan Penjualan September", subtitle: "1 - 9 September 2026", value: "Rp 18.420.000", status: "Siap", tone: "success" },
  { title: "Ringkasan Produksi Mingguan", subtitle: "2 - 8 September 2026", value: "1.240 unit", status: "Siap", tone: "success" },
  { title: "Analisis Pelanggan & Repeat Order", subtitle: "Agustus 2026", value: "248 pelanggan", status: "Diarsipkan", tone: "neutral" },
];

export default function ReportsPage() {
  return (
    <WorkspacePage
      eyebrow="BAITYBITES OMS / REPORTS"
      title="Reports"
      description="Analisis performa bisnis, omzet penjualan, dan efisiensi dapur untuk pengambilan keputusan."
      action="Buat Laporan"
      stats={[
        { label: "Pendapatan bulan ini", value: "Rp 18,4 jt", change: "+12.5% vs Agustus", tone: "orange" },
        { label: "Total order", value: "412", change: "+8.2% vs Agustus", tone: "green" },
        { label: "Produk terlaris", value: "Risol Mayo", change: "286 unit terjual", tone: "blue" },
        { label: "AOV", value: "Rp 44,7 rb", change: "+2.1% bulan ini", tone: "purple" },
      ]}
      tabs={["Ringkasan", "Penjualan", "Produksi", "Pelanggan"]}
      rows={reports}
      rowHeading="Laporan tersimpan"
    />
  );
}
