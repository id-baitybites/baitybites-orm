import Link from "next/link";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import "./order-detail.scss";

const timeline = [
  ["Order dibuat", "9 September 2026, 09.23", "success"],
  ["Pembayaran dikonfirmasi", "9 September 2026, 09.25", "success"],
  ["Sedang diproduksi", "9 September 2026, 09.40", "info"],
  ["Menunggu pengiriman", "Estimasi 9 September 2026", "neutral"],
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const decoded = decodeURIComponent(orderId);
  const displayId = decoded.startsWith("#") ? decoded : `#${decoded}`;

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
            <h1>{displayId}</h1>
            <p className="order-detail__sub">
              Dibuat 9 September 2026, 09.23 melalui WhatsApp Direct
            </p>
          </div>
          <span className="order-detail__status">PRODUKSI</span>
        </header>

        <div className="order-detail__grid">
          {/* MAIN CONTENT */}
          <section className="order-detail__main">
            {/* PROGRESS CARD */}
            <div className="order-detail__card">
              <div className="order-detail__card-heading">
                <h2>Progress Order</h2>
                <span className="order-detail__percentage">65%</span>
              </div>

              <div className="order-detail__progress" role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100}>
                <span />
              </div>

              <div className="order-detail__steps">
                <span className="is-done">Diterima</span>
                <span className="is-done">Dibayar</span>
                <span className="is-active">Produksi</span>
                <span>Packing</span>
                <span>Dikirim</span>
              </div>
            </div>

            {/* ITEMS CARD */}
            <div className="order-detail__card">
              <h2>Item Pesanan</h2>
              <div className="order-item">
                <span className="order-item__image">RB</span>
                <div className="order-item__info">
                  <strong>Risol Mayo Beef Double Cheese</strong>
                  <small>2 x Rp 25.000</small>
                </div>
                <b className="order-item__price">Rp 50.000</b>
              </div>

              <div className="order-item">
                <span className="order-item__image order-item__image--blue">CD</span>
                <div className="order-item__info">
                  <strong>Cendol Coffee</strong>
                  <small>1 x Rp 15.000</small>
                </div>
                <b className="order-item__price">Rp 15.000</b>
              </div>

              <div className="order-detail__total">
                <span>Total Pembayaran</span>
                <strong>Rp 65.000</strong>
              </div>
            </div>
          </section>

          {/* SIDE CONTENT */}
          <aside className="order-detail__side">
            {/* CUSTOMER CARD */}
            <section className="order-detail__card">
              <h2>Customer</h2>
              <div className="customer-summary">
                <span className="customer-summary__avatar">A</span>
                <div>
                  <strong>Adelwy</strong>
                  <small>08********@baitybites.id</small>
                </div>
              </div>

              <div className="order-info">
                <span>Alamat pengiriman</span>
                <strong>Jl. Melati No. 24, Jakarta Selatan</strong>
              </div>

              <div className="order-info">
                <span>Metode pembayaran</span>
                <strong>Transfer Bank (BCA)</strong>
              </div>
            </section>

            {/* STATUS TIMELINE */}
            <section className="order-detail__card">
              <h2>Riwayat Status</h2>
              <div className="order-timeline">
                {timeline.map(([title, time, tone], index) => (
                  <div className={`order-timeline__item order-timeline__item--${tone}`} key={title}>
                    <span className="order-timeline__icon">
                      <HugeiconsIcon
                        icon={index === 0 ? Clock01Icon : index === 3 ? PackageIcon : CheckmarkCircle02Icon}
                        size={15}
                        strokeWidth={1.8}
                      />
                    </span>
                    <div className="order-timeline__info">
                      <strong>{title}</strong>
                      <small>{time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
