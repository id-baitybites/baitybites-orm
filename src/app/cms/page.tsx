import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";

const content = [
  { title: "Menu WhatsApp September", subtitle: "Katalog / Dipublikasikan 8 Sep 2026", value: "12 produk", status: "Published", tone: "success" },
  { title: "Promo Payday Risol", subtitle: "Campaign / Diubah 7 Sep 2026", value: "-20%", status: "Published", tone: "success" },
  { title: "Banner Cendol Matcha", subtitle: "Homepage / Draft oleh Adelwy", value: "1 banner", status: "Draft", tone: "warning" },
  { title: "FAQ Pengiriman", subtitle: "Bantuan / Diubah 2 Sep 2026", value: "8 artikel", status: "Published", tone: "success" },
];

export default function CmsPage() {
  return (
    <WorkspacePage
      eyebrow="BAITYBITES OMS / CONTENT"
      title="CMS"
      description="Kelola konten katalog digital, materi promosi, dan pesan yang dilihat pelanggan."
      action="Buat Konten"
      stats={[
        { label: "Konten aktif", value: "24", change: "4 tipe konten", tone: "orange" },
        { label: "Dipublikasikan", value: "18", change: "75% dari total", tone: "green" },
        { label: "Draft", value: "6", change: "3 perlu review", tone: "blue" },
        { label: "Views bulan ini", value: "12,8 rb", change: "+18% bulan lalu", tone: "purple" },
      ]}
      tabs={["Semua", "Published", "Draft", "Arsip"]}
      rows={content}
      rowHeading="Konten terbaru"
    />
  );
}
