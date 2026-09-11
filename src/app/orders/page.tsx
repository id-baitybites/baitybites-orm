"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Add01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";

import "./orders.scss";

type OrderStatus = "NEW" | "CONFIRMED" | "PROCESSING" | "PACKING" | "SHIPPING" | "COMPLETED";

type Order = {
  id: string;
  customer: string;
  email: string;
  item: string;
  extra: string;
  status: OrderStatus;
};

const orders: Order[] = [
  { id: "#WA-DIR-8908", customer: "Adelwy", email: "08********@baitybites.id", item: "Risol Beef Mushroom", extra: "+2 item", status: "CONFIRMED" },
  { id: "#WA-DIR-0230", customer: "Dinda", email: "08********@baitybites.id", item: "Risol Mayo Beef Double Cheese", extra: "+1 item", status: "NEW" },
  { id: "#WA-DIR-4810", customer: "Adelwy", email: "08********@baitybites.id", item: "Risol Mayo Beef Double Cheese", extra: "", status: "PROCESSING" },
  { id: "#WA-DIR-3319", customer: "Merlin", email: "08********@baitybites.id", item: "Risol Mayo Beef Double Cheese", extra: "+1 item", status: "PACKING" },
  { id: "#WA-DIR-2272", customer: "Merlin", email: "08********@baitybites.id", item: "Cendol Coffee", extra: "+1 item", status: "SHIPPING" },
  { id: "#WA-DIR-4780", customer: "Merlin", email: "08********@baitybites.id", item: "Cendol Matcha", extra: "+1 item", status: "COMPLETED" },
  { id: "#WA-DIR-8014", customer: "Cust", email: "********@baitybites.id", item: "Cendol Original", extra: "", status: "NEW" },
  ...["6931", "4357", "3527", "4371", "2007", "2803", "5250", "4067", "5048", "1827", "5627", "6628", "4731", "0628", "5050", "1095", "5024", "4442", "9121", "8041", "7214", "2722", "2646", "0955", "5766", "5869", "6439", "3011", "1732", "7706"].map((number, index): Order => ({
    id: `#WA-DIR-${number}`,
    customer: ["Merlin", "Ummu Jo", "Adelwy", "Bunda kenzie", "Mba camel", "Mak warsih"][index % 6],
    email: "08********@baitybites.id",
    item: ["Cendol Matcha", "Risol Chocolate Cheese", "Risol Beef Bolognese", "Risol Mayo Beef Double Cheese"][index % 4],
    extra: index % 3 === 0 ? "+1 item" : "",
    status: index < 5 ? "NEW" : index < 12 ? "SHIPPING" : "COMPLETED",
  })),
];

const statusFilters: Array<{ label: string; value: "ALL" | OrderStatus }> = [
  { label: "Semua", value: "ALL" },
  { label: "Menunggu", value: "NEW" },
  { label: "Dikonfirmasi", value: "CONFIRMED" },
  { label: "Produksi", value: "PROCESSING" },
  { label: "Pengemasan", value: "PACKING" },
  { label: "Pengiriman", value: "SHIPPING" },
  { label: "Selesai", value: "COMPLETED" },
];

const statusLabels: Record<OrderStatus, string> = {
  NEW: "MENUNGGU",
  CONFIRMED: "DIKONFIRMASI",
  PROCESSING: "PRODUKSI",
  PACKING: "PENGEMASAN",
  SHIPPING: "PENGIRIMAN",
  COMPLETED: "SELESAI",
};

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [query, setQuery] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = activeFilter === "ALL" || order.status === activeFilter;
    const matchesQuery = `${order.id} ${order.customer} ${order.item}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

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
                Kelola dan pantau seluruh pesanan pelanggan Baitybites secara real-time.
              </p>
            </div>
            <button className="orders-page__new" type="button">
              <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.8} />
              <span>Order Baru</span>
            </button>
          </header>

          {/* TOOLBAR */}
          <section className="orders-page__toolbar">
            <div className="orders-page__search">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={1.8} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Cari order, pelanggan, atau item..."
                aria-label="Cari order"
              />
            </div>

            <div className="orders-page__filters" role="tablist" aria-label="Filter status order">
              {statusFilters.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={activeFilter === item.value ? "is-active" : ""}
                  onClick={() => setActiveFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {/* GRID */}
          <section className="orders-page__grid" aria-live="polite">
            {filteredOrders.map((order, index) => {
              const progress = order.status === "COMPLETED" ? 100 : Math.min(95, 15 + (index % 6) * 15);
              return (
                <article className={`order-tile order-tile--${order.status.toLowerCase()}`} key={order.id}>
                  <div className="order-tile__top">
                    <strong className="order-tile__id">{order.id}</strong>
                    <span className="order-tile__badge">{statusLabels[order.status]}</span>
                  </div>

                  <h2 className="order-tile__customer">{order.customer}</h2>
                  <p className="order-tile__email">{order.email}</p>

                  <div className="order-tile__item">
                    <span>{order.item}</span>
                    {order.extra && <span className="order-tile__extra">{order.extra}</span>}
                  </div>

                  <div className="order-tile__progress">
                    <div className="order-tile__progress-label">
                      <span>PROGRESS</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="order-tile__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <b style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="order-tile__footer">
                    <Link href={`/orders/${encodeURIComponent(order.id)}`} className="order-tile__link">
                      <span>Detail Pesanan</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={1.8} />
                    </Link>
                  </div>
                </article>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="orders-page__empty">
                <p>Tidak ada pesanan yang sesuai dengan pencarian atau filter status ini.</p>
              </div>
            )}
          </section>

          {/* PAGINATION */}
          <footer className="orders-page__pagination">
            <span>
              Menampilkan <strong>{filteredOrders.length}</strong> dari <strong>{orders.length}</strong> order
            </span>
            <div className="orders-page__pagination-controls">
              <button type="button" disabled>Sebelumnya</button>
              <button type="button" className="is-active">1</button>
              <button type="button">2</button>
              <button type="button">Berikutnya</button>
            </div>
          </footer>
        </div>
      </div>
    </AppShell>
  );
}
