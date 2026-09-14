"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Loading03Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  FireIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CartDrawer } from "@/components/public/CartDrawer";
import { trackOrderAction, type TrackedOrderResult } from "@/app/tracking/actions";
import type { CheckoutItem } from "@/app/actions/checkout";
import "./tracking-page.scss";

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface TrackingOrderViewProps {
  initialCustomer?: CustomerInfo | null;
  initialOrderRef?: string;
  initialTrackResult?: TrackedOrderResult | null;
}

export function TrackingOrderView({
  initialCustomer,
  initialOrderRef = "",
  initialTrackResult = null,
}: TrackingOrderViewProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderRef);
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<TrackedOrderResult | null>(initialTrackResult);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cart Drawer State
  const [cartItems] = useState<CheckoutItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleTrack = async (e?: React.FormEvent, customRef?: string) => {
    if (e) e.preventDefault();
    const query = (customRef ?? orderNumber).trim();

    if (!query) {
      setErrorMessage("Silakan masukkan nomor order Anda.");
      return;
    }

    setIsTracking(true);
    setErrorMessage(null);

    try {
      const res = await trackOrderAction(query);
      if (res.success && res.data) {
        setTrackResult(res.data);
      } else {
        setErrorMessage(res.error || "Pesanan tidak ditemukan.");
        setTrackResult(null);
      }
    } catch {
      setErrorMessage("Terjadi gangguan koneksi saat melacak pesanan.");
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="tracking-page-view">
      <PublicHeader
        initialCustomer={initialCustomer}
        cartCount={cartItems.length}
        onCartOpen={() => setIsCartOpen(true)}
      />

      {/* ── HERO BANNER & SEARCH ── */}
      <section className="tracking-hero">
        <div className="tracking-hero__inner">
          <span className="eyebrow">
            <HugeiconsIcon icon={Location01Icon} size={14} strokeWidth={2.2} />
            Live Order Status
          </span>
          <h1>Lacak Pesanan Baitybites</h1>
          <p>
            Pantau status persiapan pesanan Anda dari dapur Baitybites hingga penjemputan atau pengiriman kurir Paxel secara real-time.
          </p>

          <div className="tracking-search-card">
            <form onSubmit={handleTrack}>
              <div className="input-wrap">
                <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Masukkan Nomor Order (Contoh: #WA-DIR-8908)..."
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  required
                />
              </div>
              <button type="submit" className="btn-submit-track" disabled={isTracking}>
                {isTracking ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} />
                    <span>Mengecek...</span>
                  </>
                ) : (
                  <>
                    <span>Cek Status</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                  </>
                )}
              </button>
            </form>

            <div className="hints">
              <span>Coba contoh no pesanan:</span>
              <span
                className="hint-pill"
                onClick={() => {
                  setOrderNumber("#WA-DIR-8908");
                  handleTrack(undefined, "#WA-DIR-8908");
                }}
              >
                #WA-DIR-8908
              </span>
              <span
                className="hint-pill"
                onClick={() => {
                  setOrderNumber("#WA-DIR-0230");
                  handleTrack(undefined, "#WA-DIR-0230");
                }}
              >
                #WA-DIR-0230
              </span>
              <span
                className="hint-pill"
                onClick={() => {
                  setOrderNumber("#WA-DIR-3319");
                  handleTrack(undefined, "#WA-DIR-3319");
                }}
              >
                #WA-DIR-3319
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT HASIL STATUS TRACKING ── */}
      <section className="tracking-content">
        <div className="tracking-content__inner">
          {errorMessage && (
            <div className="error-box">
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div>
                <strong>Pesanan Tidak Ditemukan</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {trackResult && (
            <div className="order-status-card">
              <div className="card-header">
                <div>
                  <div className="order-ref">{trackResult.orderRef}</div>
                  <div className="customer-name">
                    Atas nama: <strong>{trackResult.customer}</strong> &bull; Dibuat: {trackResult.createdAt}
                  </div>
                </div>

                <span
                  className={`status-badge-lg ${
                    trackResult.status === "SIAP_PICKUP"
                      ? "is-completed"
                      : trackResult.status === "DIMASAK"
                      ? "is-cooking"
                      : ""
                  }`}
                >
                  {trackResult.status === "SIAP_PICKUP" ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2.5} />
                      Siap Dijemput / Dikirim
                    </>
                  ) : trackResult.status === "DIMASAK" ? (
                    <>
                      <HugeiconsIcon icon={FireIcon} size={16} strokeWidth={2} />
                      Sedang Dimasak di Dapur
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
                      Menunggu Antrian Dapur
                    </>
                  )}
                </span>
              </div>

              {/* Progress Stepper */}
              <div className="status-stepper">
                <div
                  className={`step-item ${
                    trackResult.status === "MENUNGGU"
                      ? "is-active"
                      : "is-done"
                  }`}
                >
                  <div className="step-icon">1</div>
                  <div className="step-label">
                    <strong>Antrian Dapur</strong>
                    <span>Pesanan Dikonfirmasi</span>
                  </div>
                </div>

                <div
                  className={`step-item ${
                    trackResult.status === "DIMASAK"
                      ? "is-active"
                      : trackResult.status === "SIAP_PICKUP"
                      ? "is-done"
                      : ""
                  }`}
                >
                  <div className="step-icon">2</div>
                  <div className="step-label">
                    <strong>Proses Memasak</strong>
                    <span>Goreng renyah keemasan</span>
                  </div>
                </div>

                <div
                  className={`step-item ${
                    trackResult.status === "SIAP_PICKUP" ? "is-active is-done" : ""
                  }`}
                >
                  <div className="step-icon">3</div>
                  <div className="step-label">
                    <strong>Siap Pick Up / Kirim</strong>
                    <span>Handover Kurir Paxel</span>
                  </div>
                </div>
              </div>

              {/* Integrasi Paxel AWB jika pengiriman via ekspedisi */}
              {trackResult.paxelAwb && (
                <div className="paxel-courier-box">
                  <div className="paxel-info">
                    <span className="courier-logo">📦</span>
                    <div>
                      <strong>Pengiriman Resmi Paxel Cold-Chain</strong>
                      <span>Nomor Resi AWB: <strong>{trackResult.paxelAwb}</strong></span>
                    </div>
                  </div>

                  {trackResult.paxelTrackingUrl && (
                    <a
                      href={trackResult.paxelTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-paxel"
                    >
                      <span>Lacak Live di Paxel</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.2} />
                    </a>
                  )}
                </div>
              )}

              {/* Detail Item Pesanan */}
              <div className="order-items-detail">
                <h4>Detail Menu yang Dipesan</h4>
                <ul className="items-list">
                  {trackResult.items.map((it, idx) => (
                    <li key={idx}>
                      <span className="item-name">{it.name}</span>
                      <span className="item-qty">&times;{it.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <PublicFooter />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={() => {}}
        onUpdateNotes={() => {}}
        onRemoveItem={() => {}}
        onClearCart={() => {}}
        customer={initialCustomer ? {
          id: initialCustomer.id,
          name: initialCustomer.name,
          email: initialCustomer.email,
          avatarUrl: initialCustomer.avatarUrl,
        } : null}
      />
    </div>
  );
}
