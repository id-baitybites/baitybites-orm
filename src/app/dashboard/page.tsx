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
import { getDashboardDataAction } from "./actions";
import type { Metadata } from "next";

import "../dashboard.scss";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type IconType = typeof ArrowUpRight01Icon;

function Icon({ icon, size = 20 }: { icon: IconType; size?: number }) {
  return (
    <HugeiconsIcon icon={icon} size={size} color="currentColor" strokeWidth={1.8} />
  );
}

function formatRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(".0", "")} Jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const quickActions = [
  { label: "Order Baru", icon: PlusSignIcon, href: "/orders" },
  { label: "Pelanggan", icon: UserGroupIcon, href: "/customers" },
  { label: "Produksi", icon: CubeIcon, href: "/production" },
  { label: "Kitchen TV", icon: BookOpen01Icon, href: "/kitchen" },
];

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu",
  DIKONFIRMASI: "Dikonfirmasi",
  DIMASAK: "Dimasak",
  SIAP_PICKUP: "Siap Pickup",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export default async function DashboardPage() {
  const { stats, highlight, recentOrders, orderFlow } =
    await getDashboardDataAction();

  const highlightCards = [
    {
      label: "Pengeluaran Tertinggi",
      value: highlight.topSpender?.name ?? "—",
      description: highlight.topSpender
        ? formatRupiah(highlight.topSpender.totalSpent)
        : "Belum ada data",
      icon: ChartUpIcon,
      variant: "neutral",
    },
    {
      label: "Order Terbanyak",
      value: highlight.topOrderer?.name ?? "—",
      description: highlight.topOrderer
        ? `${highlight.topOrderer.totalOrders} Order`
        : "Belum ada data",
      icon: ArrowUpRight01Icon,
      variant: "success",
    },
    {
      label: "Repeat Order Terbanyak",
      value: highlight.topOrderer?.name ?? "—",
      description: highlight.topOrderer
        ? `${highlight.topOrderer.totalOrders} Kali`
        : "Belum ada data",
      icon: RepeatIcon,
      variant: "neutral",
    },
    {
      label: "Produk Terlaris",
      value: highlight.topProduct?.name ?? "—",
      description: highlight.topProduct
        ? `${highlight.topProduct.totalQty} Unit`
        : "Belum ada data",
      icon: HeartIcon,
      variant: "danger",
    },
  ];

  const metrics = [
    {
      label: "Total Pesanan",
      value: String(stats.totalOrders),
      icon: CubeIcon,
      variant: "orange",
    },
    {
      label: "Selesai",
      value: String(stats.selesai),
      icon: CheckmarkCircle02Icon,
      variant: "green",
    },
    {
      label: "Dalam Proses",
      value: String(stats.diproses),
      icon: RefreshIcon,
      variant: "blue",
    },
  ];

  const orderFlowItems = [
    { label: "Menunggu", value: orderFlow.menunggu, variant: "waiting" },
    { label: "Dikonfirmasi", value: orderFlow.dikonfirmasi, variant: "confirmed" },
    { label: "Dimasak", value: orderFlow.dimasak, variant: "paid" },
    { label: "Siap Pickup", value: orderFlow.siapPickup, variant: "production" },
    { label: "Dikemas/Kirim", value: orderFlow.dikirim, variant: "packing" },
    { label: "Selesai", value: orderFlow.selesai, variant: "completed" },
    { label: "Dibatalkan", value: orderFlow.dibatalkan, variant: "shipping" },
  ];

  return (
    <AppShell>
      <div className="dashboard-page">
        {/* PAGE HEADING */}
        <section className="dashboard-heading">
          <div>
            <p className="eyebrow">BAITYBITES OMS / OVERVIEW</p>
            <h1>Ringkasan Order</h1>
            <p className="dashboard-heading__desc">
              Selamat datang kembali! Berikut status operasional dan ringkasan pemesanan terkini.
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
                <strong title={card.value}>
                  {card.value.length > 20 ? card.value.slice(0, 18) + "…" : card.value}
                </strong>
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
              <span>Omzet Hari Ini</span>
              <strong>{formatRupiah(stats.omzetHariIni)}</strong>
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
            {orderFlowItems.map((item) => (
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
                <span className="panel-heading__sub">
                  {stats.menunggu > 0
                    ? `${stats.menunggu} pesanan menunggu penanganan`
                    : "Tidak ada pesanan menunggu"}
                </span>
              </div>

              <Link href="/orders" className="panel-heading__link">
                <span>Lihat semua</span>
                <Icon icon={ArrowUpRight01Icon} size={15} />
              </Link>
            </div>

            <div className="order-grid">
              {recentOrders.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
                  Belum ada pesanan.
                </p>
              ) : (
                recentOrders.map((order) => (
                  <article className="dashboard-order-card" key={order.id}>
                    <div className="dashboard-order-card__top">
                      <strong>{order.orderRef}</strong>
                      <span className="dashboard-order-card__status">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="dashboard-order-card__customer">
                      {order.customer}
                    </div>

                    <div className="dashboard-order-card__meta">
                      <span>
                        <Icon icon={Calendar03Icon} size={14} />
                        {formatDate(order.createdAt)}
                      </span>
                      <span>
                        <Icon icon={Clock01Icon} size={14} />
                        {formatTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="dashboard-order-card__bottom">
                      <strong>{formatRupiah(order.totalAmount)}</strong>
                      <Link
                        href={`/orders/${encodeURIComponent(order.orderRef)}`}
                        className="dashboard-order-card__btn"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </article>
                ))
              )}
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

            {/* Ringkasan Bulan Ini */}
            <section className="help-card" style={{ marginBottom: "var(--space-4)" }}>
              <div className="help-card__icon">
                <Icon icon={Wallet03Icon} size={20} />
              </div>
              <h3>Omzet Bulan Ini</h3>
              <p style={{ fontSize: "var(--font-size-2xl)", fontWeight: "700", color: "var(--color-primary)", margin: "var(--space-1) 0" }}>
                {formatRupiah(stats.omzetBulanIni)}
              </p>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
                {stats.totalPelanggan} pelanggan terdaftar
              </p>
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
