import { getOrdersAction } from "./actions";
import { OrdersClient } from "@/components/orders/OrdersClient/OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { orders, stats } = await getOrdersAction();

  return <OrdersClient orders={orders} stats={stats} />;
}
