import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";

const customers = [
  { title: "Adelwy", subtitle: "08********@baitybites.id", value: "12 order", status: "VIP", tone: "success" },
  { title: "Merlin", subtitle: "08********@baitybites.id", value: "8 order", status: "Aktif", tone: "info" },
  { title: "Dinda", subtitle: "08********@baitybites.id", value: "5 order", status: "Aktif", tone: "info" },
  { title: "Ummu Jo", subtitle: "08********@baitybites.id", value: "3 order", status: "Baru", tone: "warning" },
];

export default function CustomersPage() {
  return (
    <WorkspacePage
      eyebrow="BAITYBITES OMS / CUSTOMERS"
      title="Customers"
      description="Kenali data pelanggan setia, tingkat repeat order, dan riwayat pesanan mereka."
      action="Tambah Pelanggan"
      stats={[
        { label: "Total pelanggan", value: "248", change: "+12 bulan ini", tone: "orange" },
        { label: "Pelanggan aktif", value: "186", change: "75% dari total", tone: "green" },
        { label: "Pelanggan baru", value: "24", change: "+8 minggu ini", tone: "blue" },
        { label: "Repeat rate", value: "68%", change: "+4.2% vs bulan lalu", tone: "purple" },
      ]}
      tabs={["Semua", "VIP", "Aktif", "Baru"]}
      rows={customers}
      rowHeading="Daftar pelanggan"
    />
  );
}
