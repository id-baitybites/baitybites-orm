"use client";

import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartUpIcon,
  ShoppingBag01Icon,
  CheckmarkCircle02Icon,
  PackageIcon,
  PrinterIcon,
  File02Icon,
  UserGroupIcon,
  Store01Icon,
  Clock01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import type { ReportsData, ReportTimeRange } from "./actions";
import { getReportsDataAction } from "./actions";
import "./reports.scss";

interface ReportsClientProps {
  initialData: ReportsData;
}

const PERIOD_LABELS: { key: ReportTimeRange; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari Terakhir" },
  { key: "30d", label: "30 Hari Terakhir" },
  { key: "this_month", label: "Bulan Ini" },
  { key: "all", label: "Semua Waktu" },
];

export function ReportsClient({ initialData }: ReportsClientProps) {
  const [data, setData] = useState<ReportsData>(initialData);
  const [activeRange, setActiveRange] = useState<ReportTimeRange>(initialData.timeRange);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "channels" | "customers">("overview");
  const [isPending, startTransition] = useTransition();

  // Period change handler
  const handleRangeChange = (range: ReportTimeRange) => {
    setActiveRange(range);
    startTransition(async () => {
      const updated = await getReportsDataAction(range);
      setData(updated);
    });
  };

  // Helper membuat format nama file sesuai pola spesifikasi:
  // Baitybites-report-{mmyy} | {startDate-endDate-mmyy} | {yyyy} | {dd-mmmm-yyyy}.pdf
  const getStandardizedReportMetadata = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const yy = yyyy.slice(-2);
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());

    const indonesianMonths = [
      "januari",
      "februari",
      "maret",
      "april",
      "mei",
      "juni",
      "juli",
      "agustus",
      "september",
      "oktober",
      "november",
      "desember",
    ];
    const mmmm = indonesianMonths[now.getMonth()];

    let dynamicPart = "";
    let periodLabelText = "";

    if (activeRange === "this_month") {
      // Bulan Ini = {mmyy}
      dynamicPart = `${mm}${yy}`;
      periodLabelText = `Bulan Ini (${mmmm} ${yyyy})`;
    } else if (activeRange === "7d") {
      // 7 Hari Terakhir = {startDate-endDate-mmyy}
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      const startDd = pad(start.getDate());
      const endDd = dd;
      dynamicPart = `${startDd}-${endDd}-${mm}${yy}`;
      periodLabelText = "7 Hari Terakhir";
    } else if (activeRange === "30d") {
      // 30 Hari Terakhir = {startDate-endDate-mmyy}
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      const startDd = pad(start.getDate());
      const endDd = dd;
      dynamicPart = `${startDd}-${endDd}-${mm}${yy}`;
      periodLabelText = "30 Hari Terakhir";
    } else if (activeRange === "today") {
      // Hari Ini = {dd-mmmm-yyyy}
      dynamicPart = `${dd}-${mmmm}-${yyyy}`;
      periodLabelText = `Hari Ini (${dd} ${mmmm} ${yyyy})`;
    } else {
      // Semua Waktu = {yyyy}
      dynamicPart = `${yyyy}`;
      periodLabelText = "Semua Waktu";
    }

    // Pola nama berkas: Baitybites-report-{variabel}
    const baseFileName = `Baitybites-report-${dynamicPart}`;

    const tabMap: Record<string, string> = {
      overview: "Ringkasan Eksekutif & Omzet",
      products: "Performa Penjualan Produk & Menu",
      channels: "Distribusi Saluran & Pembayaran",
      customers: "Analisis Pelanggan & Riwayat Transaksi",
    };

    const formattedGeneratedTime = `${now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}, Pukul ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;

    return {
      baseFileName,
      periodLabelText,
      tabLabelText: tabMap[activeTab] || "Laporan Analitik Bisnis",
      formattedGeneratedTime,
    };
  };

  // CSV Export
  const handleExportCSV = () => {
    if (data.recentTransactions.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor pada periode ini.");
      return;
    }

    const meta = getStandardizedReportMetadata();

    const headers = [
      "No Referensi",
      "Pelanggan",
      "Kanal Penjualan",
      "Status Pesanan",
      "Jumlah Item",
      "Metode Pembayaran",
      "Status Bayar",
      "Total Belanja (Rp)",
      "Waktu Transaksi",
    ];

    const rows = data.recentTransactions.map((tx) => [
      `"${tx.orderRef}"`,
      `"${tx.customerName.replace(/"/g, '""')}"`,
      `"${tx.channel}"`,
      `"${tx.status}"`,
      tx.itemCount,
      `"${tx.paymentMethod}"`,
      `"${tx.paymentStatus}"`,
      tx.totalAmount,
      `"${new Date(tx.createdAt).toLocaleString("id-ID")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${meta.baseFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report (Mengarahkan default nama file PDF browser ke nama file yang tegas & jelas)
  const handlePrint = () => {
    const meta = getStandardizedReportMetadata();
    const originalTitle = document.title;

    // Ubah document.title sebelum window.print() agar browser (Chrome/Edge/Firefox)
    // otomatis menggunakan format nama file PDF yang spesifik dan jelas saat "Save as PDF"
    document.title = meta.baseFileName;

    window.print();

    // Kembalikan document.title ke semula setelah dialog cetak ditutup
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const currentMeta = getStandardizedReportMetadata();
  const totalQtySold = data.products.reduce((acc, p) => acc + p.totalQtySold, 0);

  return (
    <div className="reports-page">
      {/* ── PRINT ONLY FORMAL HEADER ── */}
      <div className="reports-print-header">
        <div className="reports-print-header__top">
          <div>
            <div className="reports-print-header__brand">BAITYBITES OMS</div>
            <div className="reports-print-header__title">
              LAPORAN ANALITIK BISNIS &amp; PENJUALAN
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", color: "#475569" }}>
            <strong>Dokumen Resmi</strong>
            <div>Kerahasiaan Internal</div>
          </div>
        </div>
        <div className="reports-print-header__meta">
          <span>
            <strong>Fokus Laporan:</strong> {currentMeta.tabLabelText}
          </span>
          <span>
            <strong>Cakupan Periode:</strong> {currentMeta.periodLabelText}
          </span>
          <span>
            <strong>Waktu Laporan Digenerate:</strong> {currentMeta.formattedGeneratedTime}
          </span>
        </div>
      </div>
      {/* ── HEADER ── */}
      <header className="reports-header">
        <div className="reports-header__info">
          <span className="reports-header__eyebrow">BAITYBITES OMS / REPORTS</span>
          <h1 className="reports-header__title">Laporan Analitik Bisnis</h1>
          <p className="reports-header__desc">
            Pantau pertumbuhan omzet penjualan, kinerja produk terlaris, efisiensi saluran pesan, dan profil belanja pelanggan langsung dari data transaksi PostgreSQL.
          </p>
        </div>

        <div className="reports-header__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            title="Download spreadsheet transaksi CSV"
          >
            <HugeiconsIcon icon={File02Icon} size={16} strokeWidth={2} />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
            title="Cetak ringkasan laporan / Simpan PDF"
          >
            <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2} />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </header>

      {/* ── PERIOD SWITCHER BAR ── */}
      <div className="reports-period-bar">
        <div className="reports-period-bar__pills">
          {PERIOD_LABELS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`reports-period-bar__pill ${activeRange === p.key ? "is-active" : ""}`}
              onClick={() => handleRangeChange(p.key)}
              disabled={isPending}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="reports-period-bar__meta">
          <HugeiconsIcon icon={Clock01Icon} size={14} />
          <span>
            {isPending ? "Memuat analitik data..." : `Total ${data.operational.totalOrders} Transaksi Teranalisis`}
          </span>
        </div>
      </div>

      {/* ── TOP KPI METRIC CARDS ── */}
      <div className="reports-kpi-grid">
        {/* Metric 1: Total Omzet */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-card__top">
            <span className="reports-kpi-card__label">Total Omzet Bersih</span>
            <div className="reports-kpi-card__icon reports-kpi-card__icon--orange">
              <HugeiconsIcon icon={ChartUpIcon} size={20} strokeWidth={1.8} />
            </div>
          </div>
          <div className="reports-kpi-card__value">
            Rp {data.financial.grossRevenue.toLocaleString("id-ID")}
          </div>
          <div className="reports-kpi-card__sub">
            Subtotal: Rp {data.financial.netSubtotal.toLocaleString("id-ID")}
          </div>
        </div>

        {/* Metric 2: Total Pesanan & AOV */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-card__top">
            <span className="reports-kpi-card__label">Total Pesanan &amp; AOV</span>
            <div className="reports-kpi-card__icon reports-kpi-card__icon--green">
              <HugeiconsIcon icon={ShoppingBag01Icon} size={20} strokeWidth={1.8} />
            </div>
          </div>
          <div className="reports-kpi-card__value">
            {data.operational.totalOrders} <span style={{ fontSize: "16px", fontWeight: 500 }}>Pesanan</span>
          </div>
          <div className="reports-kpi-card__sub">
            Rata-rata: Rp {data.financial.averageOrderValue.toLocaleString("id-ID")} / order
          </div>
        </div>

        {/* Metric 3: Produk Terjual */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-card__top">
            <span className="reports-kpi-card__label">Volume Menu Terjual</span>
            <div className="reports-kpi-card__icon reports-kpi-card__icon--blue">
              <HugeiconsIcon icon={PackageIcon} size={20} strokeWidth={1.8} />
            </div>
          </div>
          <div className="reports-kpi-card__value">
            {totalQtySold} <span style={{ fontSize: "16px", fontWeight: 500 }}>Unit</span>
          </div>
          <div className="reports-kpi-card__sub">
            {data.products.length > 0 ? `Terlaris: ${data.products[0].name}` : "Belum ada penjualan"}
          </div>
        </div>

        {/* Metric 4: Rasio Penyelesaian */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-card__top">
            <span className="reports-kpi-card__label">Tingkat Sukses Order</span>
            <div className="reports-kpi-card__icon reports-kpi-card__icon--purple">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={1.8} />
            </div>
          </div>
          <div className="reports-kpi-card__value">
            {data.operational.completionRate}%
          </div>
          <div className="reports-kpi-card__sub">
            {data.operational.completedOrders} Selesai • {data.operational.inProgressOrders} Diproses
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <nav className="reports-tabs" aria-label="Tab Laporan">
        <button
          type="button"
          className={`reports-tab-btn ${activeTab === "overview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <HugeiconsIcon icon={ChartUpIcon} size={16} strokeWidth={1.8} />
          <span>Ringkasan Eksekutif</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === "products" ? "is-active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <HugeiconsIcon icon={PackageIcon} size={16} strokeWidth={1.8} />
          <span>Performa Menu &amp; Produk</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === "channels" ? "is-active" : ""}`}
          onClick={() => setActiveTab("channels")}
        >
          <HugeiconsIcon icon={Store01Icon} size={16} strokeWidth={1.8} />
          <span>Saluran &amp; Pembayaran</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === "customers" ? "is-active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          <HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={1.8} />
          <span>Pelanggan &amp; Transaksi</span>
        </button>
      </nav>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. TAB: RINGKASAN EKSEKUTIF                                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="reports-two-col">
          {/* Financial Breakdown */}
          <div className="reports-card">
            <div className="reports-card__header">
              <h3>Rincian Finansial &amp; Omzet</h3>
              <span>Periode: {PERIOD_LABELS.find((p) => p.key === activeRange)?.label}</span>
            </div>

            <div className="fin-breakdown-list">
              <div className="fin-breakdown-item">
                <span className="fin-breakdown-item__label">Subtotal Penjualan Menu</span>
                <span className="fin-breakdown-item__val">
                  Rp {data.financial.netSubtotal.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="fin-breakdown-item">
                <span className="fin-breakdown-item__label">Total Potongan Diskon Promo</span>
                <span className="fin-breakdown-item__val fin-breakdown-item__val--discount">
                  - Rp {data.financial.totalDiscounts.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="fin-breakdown-item">
                <span className="fin-breakdown-item__label">Penerimaan Biaya Pengiriman (Ongkir)</span>
                <span className="fin-breakdown-item__val">
                  + Rp {data.financial.totalDeliveryFees.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="fin-breakdown-item" style={{ paddingTop: "12px", borderTop: "2px solid var(--color-border)" }}>
                <span className="fin-breakdown-item__label" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  Total Omzet Bruto (Gross Revenue)
                </span>
                <span className="fin-breakdown-item__val fin-breakdown-item__val--positive" style={{ fontSize: "18px" }}>
                  Rp {data.financial.grossRevenue.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="fin-breakdown-item">
                <span className="fin-breakdown-item__label">Nilai Rata-rata Pesanan (Average Order Value)</span>
                <span className="fin-breakdown-item__val">
                  Rp {data.financial.averageOrderValue.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Progress & Status */}
          <div className="reports-card">
            <div className="reports-card__header">
              <h3>Distribusi Status Operasional</h3>
              <span>Total {data.operational.totalOrders} Pesanan</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="meter-item">
                <div className="meter-item__label-row">
                  <span className="meter-item__title">Pesanan Selesai / Terkirim</span>
                  <span className="meter-item__stat">
                    {data.operational.completedOrders} order ({data.operational.totalOrders > 0 ? Math.round((data.operational.completedOrders / data.operational.totalOrders) * 100) : 0}%)
                  </span>
                </div>
                <div className="meter-item__track">
                  <div
                    className="meter-item__fill meter-item__fill--green"
                    style={{
                      width: `${data.operational.totalOrders > 0 ? (data.operational.completedOrders / data.operational.totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="meter-item">
                <div className="meter-item__label-row">
                  <span className="meter-item__title">Sedang Diproses (Dapur / Pickup / Kirim)</span>
                  <span className="meter-item__stat">
                    {data.operational.inProgressOrders} order ({data.operational.totalOrders > 0 ? Math.round((data.operational.inProgressOrders / data.operational.totalOrders) * 100) : 0}%)
                  </span>
                </div>
                <div className="meter-item__track">
                  <div
                    className="meter-item__fill meter-item__fill--blue"
                    style={{
                      width: `${data.operational.totalOrders > 0 ? (data.operational.inProgressOrders / data.operational.totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="meter-item">
                <div className="meter-item__label-row">
                  <span className="meter-item__title">Menunggu Konfirmasi Pembayaran</span>
                  <span className="meter-item__stat">
                    {data.operational.pendingOrders} order ({data.operational.totalOrders > 0 ? Math.round((data.operational.pendingOrders / data.operational.totalOrders) * 100) : 0}%)
                  </span>
                </div>
                <div className="meter-item__track">
                  <div
                    className="meter-item__fill meter-item__fill--orange"
                    style={{
                      width: `${data.operational.totalOrders > 0 ? (data.operational.pendingOrders / data.operational.totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="meter-item">
                <div className="meter-item__label-row">
                  <span className="meter-item__title">Pesanan Dibatalkan</span>
                  <span className="meter-item__stat">
                    {data.operational.cancelledOrders} order ({data.operational.totalOrders > 0 ? Math.round((data.operational.cancelledOrders / data.operational.totalOrders) * 100) : 0}%)
                  </span>
                </div>
                <div className="meter-item__track">
                  <div
                    className="meter-item__fill"
                    style={{
                      background: "#ef4444",
                      width: `${data.operational.totalOrders > 0 ? (data.operational.cancelledOrders / data.operational.totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. TAB: PERFORMA MENU & PRODUK                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "products" && (
        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Rank</th>
                <th>Nama Produk / Menu</th>
                <th>Kategori</th>
                <th style={{ textAlign: "right" }}>Unit Terjual</th>
                <th style={{ textAlign: "right" }}>Harga Satuan</th>
                <th style={{ textAlign: "right" }}>Total Omzet</th>
                <th style={{ width: "160px" }}>Kontribusi (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
                    Belum ada data penjualan menu pada periode ini.
                  </td>
                </tr>
              ) : (
                data.products.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <span
                        className={`rank-badge ${
                          idx === 0
                            ? "rank-badge--1"
                            : idx === 1
                            ? "rank-badge--2"
                            : idx === 2
                            ? "rank-badge--3"
                            : "rank-badge--other"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <strong style={{ display: "block", color: "var(--color-text-primary)" }}>{item.name}</strong>
                    </td>
                    <td>
                      <span className="status-badge status-badge--in-progress">{item.category}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {item.totalQtySold} pcs
                    </td>
                    <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>
                      Rp {item.unitPrice.toLocaleString("id-ID")}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      Rp {item.totalRevenue.toLocaleString("id-ID")}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", background: "var(--color-surface-hover)", borderRadius: "9999px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              background: idx === 0 ? "#f97316" : "#3b82f6",
                              width: `${item.percentage}%`,
                              borderRadius: "9999px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, width: "32px", textAlign: "right" }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. TAB: SALURAN & PEMBAYARAN                                             */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "channels" && (
        <div className="reports-two-col">
          {/* Channels */}
          <div className="reports-card">
            <div className="reports-card__header">
              <h3>Saluran Pemesanan (Order Channels)</h3>
              <span>Kontribusi Volume &amp; Nilai</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {data.channels.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", margin: 0 }}>
                  Belum ada pesanan pada rentang waktu ini.
                </p>
              ) : (
                data.channels.map((ch) => (
                  <div className="meter-item" key={ch.channel}>
                    <div className="meter-item__label-row">
                      <strong className="meter-item__title">{ch.label}</strong>
                      <span className="meter-item__stat">
                        {ch.orderCount} Order • Rp {ch.totalRevenue.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="meter-item__track">
                      <div
                        className="meter-item__fill meter-item__fill--orange"
                        style={{ width: `${ch.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payments */}
          <div className="reports-card">
            <div className="reports-card__header">
              <h3>Metode Pembayaran Pelanggan</h3>
              <span>Pilihan Pembayaran Populer</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {data.payments.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", margin: 0 }}>
                  Belum ada catatan pembayaran pada rentang waktu ini.
                </p>
              ) : (
                data.payments.map((pm) => (
                  <div className="meter-item" key={pm.method}>
                    <div className="meter-item__label-row">
                      <strong className="meter-item__title">{pm.label}</strong>
                      <span className="meter-item__stat">
                        {pm.paidTransactions}/{pm.totalTransactions} Lunas • Rp {pm.totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="meter-item__track">
                      <div
                        className="meter-item__fill meter-item__fill--green"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 4. TAB: PELANGGAN & TRANSAKSI                                            */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "customers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Customers Card */}
          <div className="reports-card">
            <div className="reports-card__header">
              <h3>Pelanggan Teratas (Top Spenders)</h3>
              <span>Berdasarkan akumulasi nilai pesanan</span>
            </div>

            <div className="reports-table-wrap" style={{ border: "none", boxShadow: "none" }}>
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>Nomor WhatsApp / Kontak</th>
                    <th style={{ textAlign: "center" }}>Frekuensi Order</th>
                    <th style={{ textAlign: "right" }}>Total Belanja</th>
                    <th style={{ textAlign: "right" }}>Pesanan Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>
                        Belum ada data pelanggan untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    data.topCustomers.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>{c.phone || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className="status-badge status-badge--completed">{c.totalOrders}x Order</span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "#059669" }}>
                          Rp {c.totalSpent.toLocaleString("id-ID")}
                        </td>
                        <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>
                          {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Detailed Transactions */}
          <div className="reports-card">
            <div className="reports-card__header">
              <h3>Riwayat Transaksi Terperinci</h3>
              <span>{data.recentTransactions.length} Pesanan Terdata</span>
            </div>

            <div className="reports-table-wrap" style={{ border: "none", boxShadow: "none" }}>
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>No Ref</th>
                    <th>Pelanggan</th>
                    <th>Kanal</th>
                    <th>Item</th>
                    <th>Status Order</th>
                    <th>Metode Pembayaran</th>
                    <th>Status Bayar</th>
                    <th style={{ textAlign: "right" }}>Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>
                        Tidak ada transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <code style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)" }}>
                            {tx.orderRef}
                          </code>
                        </td>
                        <td>{tx.customerName}</td>
                        <td>{tx.channel}</td>
                        <td>{tx.itemCount} pcs</td>
                        <td>
                          <span
                            className={`status-badge ${
                              tx.status === "SELESAI"
                                ? "status-badge--completed"
                                : tx.status === "DIBATALKAN"
                                ? "status-badge--cancelled"
                                : tx.status === "MENUNGGU"
                                ? "status-badge--pending"
                                : "status-badge--in-progress"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td>{tx.paymentMethod}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              tx.paymentStatus === "PAID"
                                ? "status-badge--paid"
                                : "status-badge--pending"
                            }`}
                          >
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          Rp {tx.totalAmount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
