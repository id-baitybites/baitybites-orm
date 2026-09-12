"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Add01Icon,
  ArrowRight01Icon,
  Search01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  PackageIcon,
  FireIcon,
  DeliveryTruck01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import type { OrderListItem, OrderStats } from "@/app/orders/actions";
import type { OrderStatus } from "@prisma/client";
import "@/app/orders/orders.scss";

// ─── Status config ───────────────────────────────────────────────────────────

type FilterValue = "ALL" | OrderStatus;

const STATUS_FILTERS: Array<{ label: string; value: FilterValue }> = [
  { label: "Semua", value: "ALL" },
  { label: "Menunggu", value: "MENUNGGU" },
  { label: "Dikonfirmasi", value: "DIKONFIRMASI" },
  { label: "Dimasak", value: "DIMASAK" },
  { label: "Siap Pickup", value: "SIAP_PICKUP" },
  { label: "Dikirim", value: "DIKIRIM" },
  { label: "Selesai", value: "SELESAI" },
  { label: "Dibatalkan", value: "DIBATALKAN" },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  MENUNGGU: "MENUNGGU",
  DIKONFIRMASI: "DIKONFIRMASI",
  DIMASAK: "DIMASAK",
  SIAP_PICKUP: "SIAP PICKUP",
  DIKIRIM: "DIKIRIM",
  SELESAI: "SELESAI",
  DIBATALKAN: "DIBATALKAN",
};

const STATUS_ICONS: Record<OrderStatus, IconSvgElement> = {
  MENUNGGU: Clock01Icon,
  DIKONFIRMASI: CheckmarkCircle02Icon,
  DIMASAK: FireIcon,
  SIAP_PICKUP: PackageIcon,
  DIKIRIM: DeliveryTruck01Icon,
  SELESAI: CheckmarkCircle02Icon,
  DIBATALKAN: Cancel01Icon,
};

/** Hitung "progress" persentase per status */
function statusProgress(status: OrderStatus): number {
  const map: Record<OrderStatus, number> = {
    MENUNGGU: 10,
    DIKONFIRMASI: 25,
    DIMASAK: 55,
    SIAP_PICKUP: 75,
    DIKIRIM: 90,
    SELESAI: 100,
    DIBATALKAN: 0,
  };
  return map[status];
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  orders: OrderListItem[];
  stats: OrderStats;
}

export function OrdersClient({ orders, stats }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("ALL");
  const [query, setQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === "ALL" || order.status === activeFilter;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        order.orderRef.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.firstItemName.toLowerCase().includes(q) ||
        (order.customerPhone ?? "").includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [orders, activeFilter, query]);

  const fmt = (n: number) =>
    `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <AppShell>
      <div className="orders-page">
        <div className="orders-page__container">
          {/* HEADER */}
          <header className="orders-page__header">
            <div>
              <p className="eyebrow">BAITYBITES OMS / ORDERS</p>
              <h1 className="orders-page__title">Orders</h1>
              <p className="orders-page__description">
                Kelola dan pantau seluruh pesanan pelanggan Baitybites secara
                real-time dari database.
              </p>
            </div>
            <button className="orders-page__new" type="button">
              <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.8} />
              <span>Order Baru</span>
            </button>
          </header>

          {/* STATS */}
          <section className="orders-page__stats" aria-label="Statistik order">
            <div className="orders-page__stat">
              <span>Total Order</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="orders-page__stat orders-page__stat--warning">
              <span>Menunggu</span>
              <strong>{stats.menunggu}</strong>
            </div>
            <div className="orders-page__stat orders-page__stat--info">
              <span>Diproses</span>
              <strong>{stats.diproses}</strong>
            </div>
            <div className="orders-page__stat orders-page__stat--success">
              <span>Selesai</span>
              <strong>{stats.selesai}</strong>
            </div>
            <div className="orders-page__stat orders-page__stat--revenue">
              <span>Omzet Hari Ini</span>
              <strong>{fmt(stats.omzetHariIni)}</strong>
            </div>
          </section>

          {/* TOOLBAR */}
          <section className="orders-page__toolbar">
            <div className="orders-page__search">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={1.8} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Cari order, pelanggan, atau item..."
                aria-label="Cari order"
              />
            </div>

            <div
              className="orders-page__filters"
              role="tablist"
              aria-label="Filter status order"
            >
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={
                    activeFilter === item.value
                      ? `is-active status-tab--${item.value.toLowerCase()}`
                      : ""
                  }
                  onClick={() => setActiveFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {/* GRID */}
          <section className="orders-page__grid" aria-live="polite">
            {filteredOrders.map((order) => {
              const progress = statusProgress(order.status);
              const StatusIcon = STATUS_ICONS[order.status];
              const extraCount = order.itemCount - 1;

              return (
                <article
                  className={`order-tile order-tile--${order.status.toLowerCase()}`}
                  key={order.id}
                >
                  <div className="order-tile__top">
                    <strong className="order-tile__id">{order.orderRef}</strong>
                    <span className="order-tile__badge">
                      <HugeiconsIcon icon={StatusIcon} size={12} strokeWidth={2} />
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <h2 className="order-tile__customer">{order.customer}</h2>
                  <p className="order-tile__email">
                    {order.customerPhone ?? order.channel}
                  </p>

                  <div className="order-tile__item">
                    <span>{order.firstItemName}</span>
                    {extraCount > 0 && (
                      <span className="order-tile__extra">
                        +{extraCount} item
                      </span>
                    )}
                  </div>

                  {order.status !== "DIBATALKAN" && (
                    <div className="order-tile__progress">
                      <div className="order-tile__progress-label">
                        <span>PROGRESS</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div
                        className="order-tile__bar"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <b style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="order-tile__amount">
                    {order.totalAmount > 0 &&
                      `Rp ${order.totalAmount.toLocaleString("id-ID")}`}
                  </div>

                  <div className="order-tile__footer">
                    <Link
                      href={`/orders/${encodeURIComponent(order.orderRef)}`}
                      className="order-tile__link"
                    >
                      <span>Detail Pesanan</span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={15}
                        strokeWidth={1.8}
                      />
                    </Link>
                  </div>
                </article>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="orders-page__empty">
                <p>
                  Tidak ada pesanan yang sesuai dengan pencarian atau filter
                  status ini.
                </p>
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="orders-page__pagination">
            <span>
              Menampilkan <strong>{filteredOrders.length}</strong> dari{" "}
              <strong>{orders.length}</strong> order
            </span>
          </footer>
        </div>
      </div>
    </AppShell>
  );
}
