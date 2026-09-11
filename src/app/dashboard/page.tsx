"use client";

import {
  ArrowUpRight01Icon,
  Calendar03Icon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CubeIcon,
  HeartIcon,
  HelpCircleIcon,
  PlusSignIcon,
  RefreshIcon,
  RepeatIcon,
  UserGroupIcon,
  Wallet03Icon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell/AppShell";

import "../dashboard.scss";

type IconType = typeof ArrowUpRight01Icon;

const highlightCards = [
  {
    label: "Pengeluaran Tertinggi",
    value: "Adelwy",
    description: "Rp 1.007.000",
    icon: ChartUpIcon,
    variant: "neutral",
  },
  {
    label: "Order Terbanyak",
    value: "Adelwy",
    description: "12 Order",
    icon: ArrowUpRight01Icon,
    variant: "success",
  },
  {
    label: "Repeat Order Terbanyak",
    value: "Adelwy",
    description: "12 Kali",
    icon: RepeatIcon,
    variant: "neutral",
  },
  {
    label: "Produk Favorit",
    value: "Risoles Mayo Beef Double Cheese",
    description: "26 Unit",
    icon: HeartIcon,
    variant: "danger",
  },
];

const metrics = [
  {
    label: "Total Pesanan",
    value: "37",
    icon: CubeIcon,
    variant: "orange",
  },
  {
    label: "Terverifikasi",
    value: "8",
    icon: CheckmarkCircle02Icon,
    variant: "green",
  },
  {
    label: "Sedang Jalan",
    value: "29",
    icon: RefreshIcon,
    variant: "blue",
  },
];

const orderFlow = [
  {
    label: "Menunggu",
    value: 14,
    variant: "waiting",
  },
  {
    label: "Dikonfirmasi",
    value: 0,
    variant: "confirmed",
  },
  {
    label: "Dibayar",
    value: 0,
    variant: "paid",
  },
  {
    label: "Produksi",
    value: 0,
    variant: "production",
  },
  {
    label: "Packing",
    value: 0,
    variant: "packing",
  },
  {
    label: "Kirim",
    value: 15,
    variant: "shipping",
  },
  {
    label: "Diterima",
    value: 8,
    variant: "completed",
  },
];

const orders = [
  {
    number: "#WA-DIR-8908",
    customer: "Adelwy",
    status: "Menunggu",
    date: "9 September 2026",
    time: "09.23",
    amount: "Rp 25.000",
  },
  {
    number: "#WA-DIR-0230",
    customer: "Dinda",
    status: "Menunggu",
    date: "9 September 2026",
    time: "08.58",
    amount: "Rp 55.000",
  },
  {
    number: "#WA-DIR-4810",
    customer: "Adelwy",
    status: "Menunggu",
    date: "9 September 2026",
    time: "08.57",
    amount: "Rp 25.000",
  },
  {
    number: "#WA-DIR-3319",
    customer: "Merlin",
    status: "Menunggu",
    date: "8 September 2026",
    time: "10.38",
    amount: "Rp 189.000",
  },
  {
    number: "#WA-DIR-2272",
    customer: "Merlin",
    status: "Menunggu",
    date: "4 September 2026",
    time: "11.38",
    amount: "Rp 45.000",
  },
];

const quickActions = [
  {
    label: "Order Baru",
    icon: PlusSignIcon,
    href: "/orders",
  },
  {
    label: "Pelanggan",
    icon: UserGroupIcon,
    href: "/customers",
  },
  {
    label: "Produksi",
    icon: CubeIcon,
    href: "/production",
  },
  {
    label: "Kitchen TV",
    icon: BookOpen01Icon,
    href: "/kitchen",
  },
];

function Icon({
  icon,
  size = 20,
}: {
  icon: IconType;
  size?: number;
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color="currentColor"
      strokeWidth={1.8}
    />
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="dashboard-page">
        {/* PAGE HEADING */}
        <section className="dashboard-heading">
          <div>
            <p className="eyebrow">BAITYBITES OMS / OVERVIEW</p>
            <h1>Ringkasan Order</h1>
            <p className="dashboard-heading__desc">
              Selamat datang kembali! Berikut status operasional dan ringkasan pemesanan hari ini.
            </p>
          </div>
        </section>

        {/* HIGHLIGHTS */}
        <section className="highlight-grid">
          {highlightCards.map((card) => (
            <article
              key={card.label}
              className={`highlight-card highlight-card--${card.variant}`}
            >
              <div className="highlight-card__heading">
                <div className="highlight-card__icon">
                  <Icon icon={card.icon} size={18} />
                </div>
                <span>{card.label}</span>
              </div>

              <div className="highlight-card__body">
                <strong>{card.value}</strong>
                <span>{card.description}</span>
              </div>
            </article>
          ))}
        </section>

        {/* KPI METRICS */}
        <section className="metric-grid">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className={`metric-card metric-card--${metric.variant}`}
            >
              <div className="metric-card__icon">
                <Icon icon={metric.icon} size={22} />
              </div>

              <div className="metric-card__content">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            </article>
          ))}

          <article className="revenue-card">
            <div className="revenue-card__content">
              <span>Total Pendapatan</span>
              <strong>Rp 1.801.000</strong>
            </div>

            <div className="revenue-card__icon">
              <Icon icon={Wallet03Icon} size={24} />
            </div>
          </article>
        </section>

        {/* ORDER FLOW */}
        <section className="flow-section">
          <div className="flow-section__heading">
            <h2>Visualisasi Alur Pesanan</h2>
            <span>Status perpindahan pesanan secara real-time</span>
          </div>

          <div className="flow-card">
            {orderFlow.map((item) => (
              <div
                key={item.label}
                className={`flow-step flow-step--${item.variant}`}
              >
                <span className="flow-step__label">{item.label}</span>
                <strong className="flow-step__value">{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* LOWER CONTENT */}
        <section className="dashboard-columns">
          {/* ORDERS QUEUE */}
          <section className="orders-panel">
            <div className="panel-heading">
              <div>
                <h2>Antrean Pesanan</h2>
                <span className="panel-heading__sub">5 pesanan terbaru butuh penanganan</span>
              </div>

              <Link href="/orders" className="panel-heading__link">
                <span>Lihat semua</span>
                <Icon icon={ArrowUpRight01Icon} size={15} />
              </Link>
            </div>

            <div className="order-grid">
              {orders.map((order) => (
                <article className="dashboard-order-card" key={order.number}>
                  <div className="dashboard-order-card__top">
                    <strong>{order.number}</strong>
                    <span className="dashboard-order-card__status">
                      {order.status}
                    </span>
                  </div>

                  <div className="dashboard-order-card__customer">
                    {order.customer}
                  </div>

                  <div className="dashboard-order-card__meta">
                    <span>
                      <Icon icon={Calendar03Icon} size={14} />
                      {order.date}
                    </span>
                    <span>
                      <Icon icon={Clock01Icon} size={14} />
                      {order.time}
                    </span>
                  </div>

                  <div className="dashboard-order-card__bottom">
                    <strong>{order.amount}</strong>
                    <Link
                      href={`/orders/${encodeURIComponent(order.number)}`}
                      className="dashboard-order-card__btn"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="dashboard-aside">
            <section className="quick-panel">
              <div className="panel-heading">
                <h2>Akses Cepat</h2>
              </div>

              <div className="quick-grid">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href} className="quick-action">
                    <span className="quick-action__icon">
                      <Icon icon={action.icon} size={20} />
                    </span>
                    <strong>{action.label}</strong>
                  </Link>
                ))}
              </div>
            </section>

            <section className="help-card">
              <div className="help-card__icon">
                <Icon icon={HelpCircleIcon} size={20} />
              </div>

              <h3>Pusat Bantuan</h3>
              <p>
                Pelajari cara mengelola inventaris, batch produksi, dan SOP kerja melalui dokumentasi.
              </p>

              <Link href="/docs" className="help-card__button">
                Buka Panduan
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
