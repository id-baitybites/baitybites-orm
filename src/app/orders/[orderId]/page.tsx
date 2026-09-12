import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PackageIcon,
  FireIcon,
  DeliveryTruck01Icon,
  Cancel01Icon,
  Location01Icon,
  SmartPhone01Icon,
  Mail01Icon,
  NoteIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { getOrderDetailAction } from "@/app/orders/actions";
import type { OrderStatus } from "@prisma/client";
import "./order-detail.scss";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  MENUNGGU: "MENUNGGU",
  DIKONFIRMASI: "DIKONFIRMASI",
  DIMASAK: "DIMASAK",
  SIAP_PICKUP: "SIAP PICKUP",
  DIKIRIM: "DIKIRIM",
  SELESAI: "SELESAI",
  DIBATALKAN: "DIBATALKAN",
};

const TIMELINE_ICONS: Record<OrderStatus, IconSvgElement> = {
  MENUNGGU: Clock01Icon,
  DIKONFIRMASI: CheckmarkCircle02Icon,
  DIMASAK: FireIcon,
  SIAP_PICKUP: PackageIcon,
  DIKIRIM: DeliveryTruck01Icon,
  SELESAI: CheckmarkCircle02Icon,
  DIBATALKAN: Cancel01Icon,
};

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  MENUNGGU: 10,
  DIKONFIRMASI: 25,
  DIMASAK: 55,
  SIAP_PICKUP: 75,
  DIKIRIM: 90,
  SELESAI: 100,
  DIBATALKAN: 0,
};

const STATUS_STEPS = [
  { key: "MENUNGGU" as OrderStatus, label: "Diterima" },
  { key: "DIKONFIRMASI" as OrderStatus, label: "Dibayar" },
  { key: "DIMASAK" as OrderStatus, label: "Produksi" },
  { key: "SIAP_PICKUP" as OrderStatus, label: "Packing" },
  { key: "DIKIRIM" as OrderStatus, label: "Dikirim" },
  { key: "SELESAI" as OrderStatus, label: "Selesai" },
];

function fmt(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentMethodLabel(method: string) {
  const map: Record<string, string> = {
    BANK_TRANSFER: "Transfer Bank",
    QRIS: "QRIS",
    CASH: "Tunai",
    COD: "COD",
    EWALLET: "E-Wallet",
  };
  return map[method] ?? method;
}

function getPaymentStatusTone(status: string) {
  if (status === "PAID") return "success";
  if (status === "FAILED" || status === "REFUNDED") return "danger";
  return "warning";
}

function stepClass(
  stepKey: OrderStatus,
  currentStatus: OrderStatus
): string {
  const ORDER: OrderStatus[] = [
    "MENUNGGU",
    "DIKONFIRMASI",
    "DIMASAK",
    "SIAP_PICKUP",
    "DIKIRIM",
    "SELESAI",
  ];
  const stepIdx = ORDER.indexOf(stepKey);
  const curIdx = ORDER.indexOf(currentStatus);
  if (currentStatus === "DIBATALKAN") return "";
  if (stepIdx < curIdx) return "is-done";
  if (stepIdx === curIdx) return "is-active";
  return "";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const decoded = decodeURIComponent(orderId);
  // Coba cari dengan # prefix juga
  const ref = decoded.startsWith("#") ? decoded : `#${decoded}`;

  const { order, error } = await getOrderDetailAction(ref);

  // Fallback: cari tanpa # (mungkin ID Prisma)
  const result =
    order === null && !error?.includes("tidak ditemukan")
      ? await getOrderDetailAction(decoded)
      : { order, error };

  if (!result.order) {
    notFound();
  }

  const o = result.order;
  const progress = STATUS_PROGRESS[o.status];
  const isCancelled = o.status === "DIBATALKAN";

  return (
    <AppShell>
      <div className="order-detail">
        <Link href="/orders" className="order-detail__back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.8} />
          <span>Kembali ke Orders</span>
        </Link>

        <header className="order-detail__heading">
          <div>
            <p className="eyebrow">BAITYBITES OMS / ORDER DETAIL</p>
            <h1>{o.orderRef}</h1>
            <p className="order-detail__sub">
              Dibuat {fmtDate(o.createdAt)} melalui {o.channel}
              {o.priority === "URGENT" && (
                <strong className="order-detail__urgent"> · URGENT</strong>
              )}
            </p>
          </div>
          <span className={`order-detail__status order-detail__status--${o.status.toLowerCase()}`}>
            {STATUS_LABELS[o.status]}
          </span>
        </header>

        <div className="order-detail__grid">
          {/* MAIN CONTENT */}
          <section className="order-detail__main">
            {/* PROGRESS CARD */}
            {!isCancelled && (
              <div className="order-detail__card">
                <div className="order-detail__card-heading">
                  <h2>Progress Order</h2>
                  <span className="order-detail__percentage">{progress}%</span>
                </div>

                <div
                  className="order-detail__progress"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${progress}%` }} />
                </div>

                <div className="order-detail__steps">
                  {STATUS_STEPS.map((step) => (
                    <span key={step.key} className={stepClass(step.key, o.status)}>
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ITEMS CARD */}
            <div className="order-detail__card">
              <h2>Item Pesanan</h2>
              {o.items.map((item) => (
                <div className="order-item" key={item.id}>
                  <span className="order-item__image">
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="order-item__info">
                    <strong>{item.name}</strong>
                    {item.notes && <small className="order-item__note">{item.notes}</small>}
                    <small>
                      {item.qty} x {fmt(item.price)}
                    </small>
                  </div>
                  <b className="order-item__price">{fmt(item.subtotal)}</b>
                </div>
              ))}

              <div className="order-detail__total-breakdown">
                {o.subtotal !== o.totalAmount && (
                  <>
                    <div className="order-detail__total-row">
                      <span>Subtotal</span>
                      <span>{fmt(o.subtotal)}</span>
                    </div>
                    {o.deliveryFee > 0 && (
                      <div className="order-detail__total-row">
                        <span>Ongkir</span>
                        <span>{fmt(o.deliveryFee)}</span>
                      </div>
                    )}
                    {o.discount > 0 && (
                      <div className="order-detail__total-row order-detail__total-row--discount">
                        <span>Diskon</span>
                        <span>-{fmt(o.discount)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="order-detail__total">
                  <span>Total Pembayaran</span>
                  <strong>{fmt(o.totalAmount)}</strong>
                </div>
              </div>
            </div>

            {/* PAYMENT CARD */}
            {o.payments.length > 0 && (
              <div className="order-detail__card">
                <h2>Pembayaran</h2>
                {o.payments.map((p) => (
                  <div
                    key={p.id}
                    className={`order-payment order-payment--${getPaymentStatusTone(p.paymentStatus)}`}
                  >
                    <div className="order-payment__method">
                      <strong>{getPaymentMethodLabel(p.paymentMethod)}</strong>
                      <span className={`order-payment__status`}>
                        {p.paymentStatus === "PAID"
                          ? "Lunas"
                          : p.paymentStatus === "PENDING"
                          ? "Menunggu"
                          : p.paymentStatus === "FAILED"
                          ? "Gagal"
                          : "Refund"}
                      </span>
                    </div>
                    <b>{fmt(p.amount)}</b>
                    {p.paidAt && (
                      <small>Dibayar: {fmtDate(p.paidAt)}</small>
                    )}
                    {p.referenceCode && (
                      <small>Ref: {p.referenceCode}</small>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* NOTE */}
            {o.note && (
              <div className="order-detail__card order-detail__card--note">
                <div className="order-detail__card-heading">
                  <h2>Catatan Pesanan</h2>
                  <HugeiconsIcon icon={NoteIcon} size={16} strokeWidth={1.8} />
                </div>
                <p className="order-detail__note-text">{o.note}</p>
              </div>
            )}
          </section>

          {/* SIDE CONTENT */}
          <aside className="order-detail__side">
            {/* CUSTOMER CARD */}
            <section className="order-detail__card">
              <h2>Customer</h2>
              <div className="customer-summary">
                <span className="customer-summary__avatar">
                  {o.customer.charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{o.customer}</strong>
                  {o.clientRef && (
                    <small className={`customer-summary__type customer-summary__type--${o.clientRef.customerType.toLowerCase()}`}>
                      {o.clientRef.customerType}
                    </small>
                  )}
                </div>
              </div>

              {o.customerPhone && (
                <div className="order-info">
                  <span>
                    <HugeiconsIcon icon={SmartPhone01Icon} size={13} strokeWidth={1.8} />
                    Telepon
                  </span>
                  <strong>{o.customerPhone}</strong>
                </div>
              )}

              {o.customerEmail && (
                <div className="order-info">
                  <span>
                    <HugeiconsIcon icon={Mail01Icon} size={13} strokeWidth={1.8} />
                    Email
                  </span>
                  <strong>{o.customerEmail}</strong>
                </div>
              )}

              {o.deliveryAddr && (
                <div className="order-info">
                  <span>
                    <HugeiconsIcon icon={Location01Icon} size={13} strokeWidth={1.8} />
                    Alamat pengiriman
                  </span>
                  <strong>{o.deliveryAddr}</strong>
                </div>
              )}

              <div className="order-info">
                <span>Channel</span>
                <strong>{o.channel}</strong>
              </div>
            </section>

            {/* STATUS TIMELINE */}
            <section className="order-detail__card">
              <h2>Riwayat Status</h2>
              <div className="order-timeline">
                {o.statusHistory.length === 0 && (
                  <p className="order-timeline__empty">Belum ada riwayat status.</p>
                )}
                {o.statusHistory.map((h) => {
                  const Icon = TIMELINE_ICONS[h.status];
                  return (
                    <div
                      className={`order-timeline__item order-timeline__item--${h.status === "SELESAI" ? "success" : h.status === "DIBATALKAN" ? "danger" : h.status === "MENUNGGU" ? "neutral" : "info"}`}
                      key={h.id}
                    >
                      <span className="order-timeline__icon">
                        <HugeiconsIcon icon={Icon} size={15} strokeWidth={1.8} />
                      </span>
                      <div className="order-timeline__info">
                        <strong>{STATUS_LABELS[h.status]}</strong>
                        {h.note && <p className="order-timeline__note">{h.note}</p>}
                        <small>
                          {fmtDate(h.createdAt)}
                          {h.actor && h.actor !== "SYSTEM" && ` · ${h.actor}`}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
