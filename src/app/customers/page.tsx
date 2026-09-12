import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";
import { getCustomersAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { customers, stats } = await getCustomersAction();

  return (
    <WorkspacePage
      eyebrow="BAITYBITES OMS / CUSTOMERS"
      title="Customers"
      description="Kenali data pelanggan setia, tingkat repeat order, dan riwayat pesanan mereka."
      action="Tambah Pelanggan"
      stats={[
        {
          label: "Total pelanggan",
          value: stats.total.toString(),
          change: `+${stats.newThisMonth} bulan ini`,
          tone: "orange",
        },
        {
          label: "Pelanggan VIP",
          value: stats.vip.toString(),
          change: `${Math.round((stats.vip / (stats.total || 1)) * 100)}% dari total`,
          tone: "green",
        },
        {
          label: "Pelanggan regular",
          value: stats.regular.toString(),
          change: "Member aktif",
          tone: "blue",
        },
        {
          label: "Pelanggan baru",
          value: stats.newThisMonth.toString(),
          change: "Bergabung bulan ini",
          tone: "purple",
        },
      ]}
      tabs={["Semua", "VIP", "Grosir", "Regular"]}
      rows={customers}
      rowHeading="Daftar pelanggan"
    />
  );
}
