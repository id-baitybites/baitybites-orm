"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag01Icon,
  FireIcon,
  PackageIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Search01Icon,
  ArrowRight01Icon,
  RotateRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import {
  getProductionQueueAction,
  updateProductionStatusAction,
  type ProductionItemData,
} from "./actions";
import { OrderStatus } from "@prisma/client";
import "./production.scss";

const STATUS_FILTERS = [
  { label: "Semua", value: "ALL" },
  { label: "Menunggu", value: "MENUNGGU" },
  { label: "Dimasak", value: "DIMASAK" },
  { label: "Ready to Ship", value: "SIAP_PICKUP" },
];

export default function ProductionPage() {
  const [queue, setQueue] = useState<ProductionItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await getProductionQueueAction();
      setQueue(data);
    } catch (err) {
      console.error("Gagal memuat antrean produksi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleNextStatus = async (item: ProductionItemData) => {
    setUpdatingId(item.id);
    let next: OrderStatus = "DIMASAK";
    if (item.status === "MENUNGGU") next = "DIMASAK";
    else if (item.status === "DIMASAK") next = "SIAP_PICKUP";
    else if (item.status === "SIAP_PICKUP") next = "SELESAI";

    try {
      const res = await updateProductionStatusAction(item.orderRef, next);
      if (res.success) {
        // Update state lokal instan
        setQueue((prev) =>
          prev.map((it) => (it.orderRef === item.orderRef ? { ...it, status: next } : it))
        );
      } else {
        alert(res.error || "Gagal memperbarui status produksi.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan saat update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchTab = activeTab === "ALL" || item.status === activeTab;
    const matchQuery =
      item.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchQuery;
  });

  const readyCount = queue.filter((q) => q.status === "SIAP_PICKUP").length;
  const cookingCount = queue.filter((q) => q.status === "DIMASAK").length;
  const waitingCount = queue.filter((q) => q.status === "MENUNGGU").length;

  return (
    <AppShell>
      <div className="production-page">
        <div className="production-page__container">
          {/* HEADER */}
          <header className="production-page__header">
            <div>
              <p className="eyebrow">BAITYBITES OMS / PRODUCTION</p>
              <h1 className="production-page__title">Antrean Produksi</h1>
              <p className="production-page__description">
                Monitor status pengerjaan pesanan dapur, target durasi penyelesaian, dan kesiapan pengiriman.
              </p>
            </div>

            <button
              className="btn-status-action"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={fetchQueue}
              disabled={loading}
              type="button"
            >
              <HugeiconsIcon icon={RotateRight01Icon} size={15} strokeWidth={2} />
              <span>Refresh Antrean</span>
            </button>
          </header>

          {/* KPI STATS */}
          <section className="production-page__stats">
            <div className="stat-card">
              <span className="stat-card__label">Total Antrean Aktif</span>
              <div className="stat-card__value">{queue.length}</div>
              <span className="stat-card__hint">Seluruh pesanan dapur</span>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Ready to Ship</span>
              <div className="stat-card__value" style={{ color: "#059669" }}>
                {readyCount}
              </div>
              <span className="stat-card__hint" style={{ color: "#059669" }}>
                Siap dikirim / pickup
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Sedang Dimasak</span>
              <div className="stat-card__value" style={{ color: "#d97706" }}>
                {cookingCount}
              </div>
              <span className="stat-card__hint" style={{ color: "#d97706" }}>
                Proses penggorengan
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Menunggu Antrean</span>
              <div className="stat-card__value" style={{ color: "#64748b" }}>
                {waitingCount}
              </div>
              <span className="stat-card__hint" style={{ color: "#64748b" }}>
                Antrean baru masuk
              </span>
            </div>
          </section>

          {/* MAIN CARD CONTAINER */}
          <div className="production-page__card">
            <h2 className="production-page__card-title">Antrean Produksi</h2>

            {/* TAB FILTERS */}
            <div className="production-page__tabs">
              {STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={activeTab === tab.value ? "is-active" : ""}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TABLE ANTREAN PRODUKSI (DESAIN SESUAI DOKUMEN REFERENSI) */}
            <div className="prod-table-wrap">
              <table className="prod-table">
                <thead>
                  <tr>
                    <th>ORDER #</th>
                    <th>PRODUCT</th>
                    <th>QTY</th>
                    <th>STATUS</th>
                    <th>UPDATE STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQueue.map((item) => {
                    const isReady = item.status === "SIAP_PICKUP";
                    const isCooking = item.status === "DIMASAK";
                    const isWaiting = item.status === "MENUNGGU";

                    let statusBadgeClass = "status-pill--menunggu";
                    let statusLabel = "MENUNGGU";

                    if (isReady) {
                      statusBadgeClass = "status-pill--ready";
                      statusLabel = "READY TO SHIP";
                    } else if (isCooking) {
                      statusBadgeClass = "status-pill--dimasak";
                      statusLabel = "SEDANG DIMASAK";
                    } else if (item.status === "SELESAI") {
                      statusBadgeClass = "status-pill--selesai";
                      statusLabel = "SELESAI";
                    }

                    // Teks tombol aksi
                    let actionButtonText = "Selesai Kirim";
                    if (isWaiting) actionButtonText = "Mulai Masak";
                    else if (isCooking) actionButtonText = "Tandai Siap";
                    else if (isReady) actionButtonText = "Selesai Kirim";

                    return (
                      <tr key={item.id}>
                        {/* 1. ORDER # */}
                        <td className="prod-table__cell-order">{item.orderRef}</td>

                        {/* 2. PRODUCT */}
                        <td>
                          <div className="prod-table__cell-product">
                            <span className="prod-name">{item.productName}</span>
                            <span className="prod-badge-qty">x{item.qty}</span>
                          </div>
                        </td>

                        {/* 3. TOTAL QTY */}
                        <td className="prod-table__cell-qty">{item.qty}</td>

                        {/* 4. STATUS PILL */}
                        <td className="prod-table__cell-status">
                          <span className={`status-pill ${statusBadgeClass}`}>{statusLabel}</span>
                        </td>

                        {/* 5. UPDATE STATUS (KOTAK ESTIMASI + TIMELINE BADGES + ACTION BUTTON) */}
                        <td>
                          <div className="prod-table__cell-action">
                            <div className="action-left">
                              {/* BOX TARGET WAKTU KUNING-ORANYE */}
                              <div className="time-box">
                                <div className="time-box__top">
                                  <span className="time-box__duration">{item.durationText}</span>
                                  <span className="time-box__target">
                                    TARGET: {item.targetTime}
                                  </span>
                                </div>
                                <span className="time-box__breakdown">
                                  {item.breakdownText}
                                </span>
                              </div>

                              {/* ICON TIMELINE WAKTU: KERANJANG, API, BOX */}
                              <div className="timeline-icons">
                                {/* Order Masuk (Keranjang) */}
                                <div className="time-step-badge time-step-badge--cart" title="Waktu Order Masuk">
                                  <HugeiconsIcon icon={ShoppingBag01Icon} size={13} strokeWidth={2} />
                                  <span>{item.timelineTimes.orderPlaced}</span>
                                </div>

                                {/* Mulai Masak (Api) */}
                                <div
                                  className={`time-step-badge time-step-badge--fire ${
                                    !item.timelineTimes.cookStarted ? "time-step-badge--disabled" : ""
                                  }`}
                                  title="Waktu Mulai Dimasak"
                                >
                                  <HugeiconsIcon icon={FireIcon} size={13} strokeWidth={2} />
                                  <span>{item.timelineTimes.cookStarted || "--.--"}</span>
                                </div>

                                {/* Siap Pickup (Box) */}
                                <div
                                  className={`time-step-badge time-step-badge--box ${
                                    !item.timelineTimes.readyPickup ? "time-step-badge--disabled" : ""
                                  }`}
                                  title="Waktu Siap Pickup"
                                >
                                  <HugeiconsIcon icon={PackageIcon} size={13} strokeWidth={2} />
                                  <span>{item.timelineTimes.readyPickup || "--.--"}</span>
                                </div>
                              </div>
                            </div>

                            {/* TOMBOL UPDATE STATUS DINAMIS BERDASARKAN STATUS */}
                            <button
                              type="button"
                              className={`btn-status-action btn-status-action--${
                                isWaiting
                                  ? "menunggu"
                                  : isCooking
                                  ? "dimasak"
                                  : isReady
                                  ? "ready"
                                  : "selesai"
                              }`}
                              disabled={updatingId === item.id || item.status === "SELESAI"}
                              onClick={() => handleNextStatus(item)}
                            >
                              {updatingId === item.id ? "Memproses..." : actionButtonText}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredQueue.length === 0 && !loading && (
                <div className="production-page__empty">
                  Tidak ada pesanan dalam antrean produksi untuk kategori ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
