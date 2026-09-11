import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";

const batches = [
  { title: "Batch #PRD-2609-04", subtitle: "Risol Mayo Beef / 120 unit", value: "Selesai 85%", status: "Berjalan", tone: "info" },
  { title: "Batch #PRD-2609-03", subtitle: "Risol Beef Mushroom / 80 unit", value: "80 unit", status: "Siap kirim", tone: "success" },
  { title: "Batch #PRD-2609-02", subtitle: "Risol Chocolate Cheese / 60 unit", value: "Menunggu", status: "Terjadwal", tone: "warning" },
  { title: "Batch #PRD-2609-01", subtitle: "Cendol Original / 45 cup", value: "45 cup", status: "Selesai", tone: "success" },
];

export default function ProductionPage() {
  return (
    <WorkspacePage
      eyebrow="BAITYBITES OMS / PRODUCTION"
      title="Production"
      description="Pantau batch produksi risol dan minuman dari persiapan bahan sampai siap dikemas."
      action="Buat Batch"
      stats={[
        { label: "Batch hari ini", value: "6", change: "2 selesai", tone: "orange" },
        { label: "Sedang diproses", value: "3", change: "420 unit total", tone: "blue" },
        { label: "Siap dikirim", value: "2", change: "200 unit", tone: "green" },
        { label: "Efisiensi produksi", value: "92%", change: "+3% minggu ini", tone: "purple" },
      ]}
      tabs={["Semua", "Berjalan", "Terjadwal", "Selesai"]}
      rows={batches}
      rowHeading="Antrian produksi"
    />
  );
}
