import { Badge } from "@/components/ui/Badge/Badge";

import type { BadgeVariant } from "@/components/ui/Badge/Badge";

import "./OrderStatus.scss";

export type OrderStatusValue =
  | "NEW"
  | "CONFIRMED"
  | "PAID"
  | "PROCESSING"
  | "PACKING"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

const statusConfig: Record<
  OrderStatusValue,
  {
    label: string;
    variant: BadgeVariant;
  }
> = {
  NEW: {
    label: "Menunggu",
    variant: "warning",
  },

  CONFIRMED: {
    label: "Dikonfirmasi",
    variant: "info",
  },

  PAID: {
    label: "Dibayar",
    variant: "success",
  },

  PROCESSING: {
    label: "Produksi",
    variant: "primary",
  },

  PACKING: {
    label: "Packing",
    variant: "primary",
  },

  SHIPPING: {
    label: "Dikirim",
    variant: "info",
  },

  COMPLETED: {
    label: "Diterima",
    variant: "success",
  },

  CANCELLED: {
    label: "Dibatalkan",
    variant: "danger",
  },
};

interface OrderStatusProps {
  status: OrderStatusValue;
}

export function OrderStatus({ status }: OrderStatusProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}