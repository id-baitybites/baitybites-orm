import { db } from "@/lib/db";
import { KitchenBoard } from "@/components/kitchen/KitchenBoard/KitchenBoard";
import { type ProductionOrder, type ProductionStatus } from "@/lib/kitchen-data";

export const dynamic = "force-dynamic";

import type { Order as DbOrder, OrderItem as DbOrderItem } from "@prisma/client";

type DbOrderWithItems = DbOrder & { items: DbOrderItem[] };

export default async function KitchenPage() {
  const dbOrders = (await db.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "asc" },
  })) as DbOrderWithItems[];

  const orders: ProductionOrder[] = dbOrders.map((o: DbOrderWithItems) => {
    let status: ProductionStatus = "menunggu";
    if (o.status === "DIMASAK") status = "dimasak";
    if (o.status === "SIAP_PICKUP") status = "siap_pickup";

    let channel: "WhatsApp" | "Tokopedia" | "Shopee" | "Walk-in" = "WhatsApp";
    if (o.channel === "Tokopedia") channel = "Tokopedia";
    if (o.channel === "Shopee") channel = "Shopee";
    if (o.channel === "WalkIn") channel = "Walk-in";

    return {
      id: o.id,
      orderRef: o.orderRef,
      customer: o.customer,
      channel,
      items: o.items.map((it: DbOrderItem) => ({
        name: it.name,
        qty: it.qty,
        notes: it.notes ?? undefined,
      })),
      status,
      createdAt: o.createdAt.toISOString(),
      cookStartedAt: o.cookStartedAt ? o.cookStartedAt.toISOString() : undefined,
      priority: o.priority === "URGENT" ? "urgent" : "normal",
      note: o.note ?? undefined,
    };
  });

  return <KitchenBoard initialOrders={orders} />;
}
