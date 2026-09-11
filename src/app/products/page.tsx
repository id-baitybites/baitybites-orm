import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";

const products = [
  { title: "Risol Mayo Beef Double Cheese", subtitle: "RB-001 / Frozen", value: "48 unit", status: "Tersedia", tone: "success" },
  { title: "Risol Beef Mushroom", subtitle: "RB-002 / Frozen", value: "32 unit", status: "Menipis", tone: "warning" },
  { title: "Cendol Coffee", subtitle: "CD-001 / Ready to serve", value: "18 unit", status: "Tersedia", tone: "success" },
  { title: "Cendol Matcha", subtitle: "CD-002 / Ready to serve", value: "0 unit", status: "Habis", tone: "danger" },
];

export default function ProductsPage() {
  return (
    <WorkspacePage
      eyebrow="BAITYBITES OMS / PRODUCTS"
      title="Products"
      description="Atur katalog risol & minuman, varian harga, serta ketersediaan stok produk."
      action="Tambah Produk"
      stats={[
        { label: "Produk aktif", value: "18", change: "4 kategori", tone: "orange" },
        { label: "Stok aman", value: "14", change: "78% dari katalog", tone: "green" },
        { label: "Stok menipis", value: "3", change: "Perlu restock", tone: "blue" },
        { label: "Nilai inventaris", value: "Rp 8,4 jt", change: "+6.8% bulan ini", tone: "purple" },
      ]}
      tabs={["Semua", "Risol", "Cendol", "Menipis"]}
      rows={products}
      rowHeading="Katalog produk"
    />
  );
}
