"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Call02Icon,
  Location01Icon,
  ShoppingBag01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  Logout01Icon,
  Loading03Icon,
  CheckmarkBadge01Icon,
  Note01Icon,
  Home01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import {
  updateCustomerProfileAction,
  logoutCustomerAction,
  type ProfileData,
  type UpdateProfileInput,
} from "./actions";
import "./profile.scss";

interface ProfileClientProps {
  initialData: ProfileData;
  justLoggedIn?: boolean;
}

const CITIES = [
  "Jakarta Selatan",
  "Jakarta Barat",
  "Jakarta Pusat",
  "Jakarta Timur",
  "Jakarta Utara",
  "Tangerang",
  "Tangerang Selatan",
  "Depok",
  "Bekasi",
  "Bogor",
  "Lainnya",
];

export function ProfileClient({ initialData, justLoggedIn }: ProfileClientProps) {
  const [data, setData] = useState<ProfileData>(initialData);
  const [activeTab, setActiveTab] = useState<"info" | "orders">("info");

  // Form State
  const [formData, setFormData] = useState<UpdateProfileInput>({
    name: initialData.customer.name || "",
    phone: initialData.customer.phone || "",
    address: initialData.customer.address || "",
    district: initialData.customer.district || "",
    city: initialData.customer.city || "Jakarta Selatan",
    postalCode: initialData.customer.postalCode || "",
    notes: initialData.customer.notes || "",
  });

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    justLoggedIn
      ? {
          type: "success",
          message: "Selamat datang kembali! Akun Google Anda berhasil terhubung.",
        }
      : null
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCustomerProfileAction(formData);
      if (res.success) {
        showToast("success", "Profil dan data pengiriman berhasil diperbarui!");
        // Update completeness secara lokal
        const fields = [
          formData.name,
          formData.phone,
          formData.address,
          formData.city,
          formData.district,
        ];
        const filled = fields.filter((f) => f && f.trim().length > 0).length;
        const newPercent = Math.round((filled / fields.length) * 100);

        setData((prev) => ({
          ...prev,
          completenessPercent: newPercent,
          customer: {
            ...prev.customer,
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            district: formData.district,
            city: formData.city,
            postalCode: formData.postalCode,
            notes: formData.notes,
          },
        }));
      } else {
        showToast("error", res.error || "Gagal menyimpan perubahan.");
      }
    });
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun ini?")) {
      startTransition(async () => {
        await logoutCustomerAction();
      });
    }
  };

  const customer = data.customer;
  const isComplete = data.completenessPercent === 100;

  return (
    <div className="profile-page">
      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`profile-toast profile-toast--${toast.type}`}>
          <HugeiconsIcon
            icon={toast.type === "success" ? CheckmarkCircle02Icon : AlertCircleIcon}
            size={20}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── TOP NAV BAR ── */}
      <div className="profile-nav-bar">
        <Link href="/" className="btn-back-home">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
          <span>Kembali ke Beranda Baitybites</span>
        </Link>
        <button
          type="button"
          className="btn-logout"
          onClick={handleLogout}
          disabled={isPending}
          title="Keluar dari akun"
        >
          <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
          <span>Keluar</span>
        </button>
      </div>

      <div className="profile-container">
        {/* ── PROFILE HEADER HERO CARD ── */}
        <section className="profile-header-card">
          <div className="profile-header-card__inner">
            <div className="profile-avatar-wrap">
              {customer.avatarUrl ? (
                <Image
                  src={customer.avatarUrl}
                  alt={customer.name}
                  width={88}
                  height={88}
                  className="profile-avatar-img"
                  priority
                  unoptimized
                />
              ) : (
                <div className="profile-avatar-fallback">
                  <HugeiconsIcon icon={UserIcon} size={40} />
                </div>
              )}
              {customer.googleId && (
                <span className="google-badge-pill" title="Terhubung dengan Akun Google">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                </span>
              )}
            </div>

            <div className="profile-identity">
              <div className="identity-title-row">
                <h2>{customer.name}</h2>
                <span className={`customer-tier-badge tier--${customer.customerType.toLowerCase()}`}>
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} strokeWidth={2} />
                  <span>Pelanggan {customer.customerType}</span>
                </span>
              </div>

              <div className="identity-meta">
                <span className="meta-email">
                  {customer.email || "Email belum terdaftar"}
                </span>
                {customer.phone && (
                  <>
                    <span className="meta-dot">&bull;</span>
                    <span className="meta-phone">{customer.phone}</span>
                  </>
                )}
                <span className="meta-dot">&bull;</span>
                <span className="meta-city">{customer.city || "Jabodetabek"}</span>
              </div>
            </div>

            <div className="profile-stats-summary">
              <div className="stat-pill">
                <span className="stat-num">{data.orders.length}</span>
                <span className="stat-label">Total Pesanan</span>
              </div>
            </div>
          </div>

          {/* ── COMPLETENESS BAR ── */}
          <div className="profile-completeness-banner">
            <div className="completeness-info">
              <div className="completeness-header">
                <strong>Kelengkapan Profil Transaksi</strong>
                <span className={`completeness-value ${isComplete ? "is-ready" : ""}`}>
                  {data.completenessPercent}% {isComplete ? "· Siap Transaksi Cepat" : "· Perlu Dilengkapi"}
                </span>
              </div>
              <p>
                {isComplete
                  ? "Semua data pengiriman Anda sudah lengkap! Formulir pesanan akan otomatis terisi saat Anda bertransaksi."
                  : "Lengkapi nomor WhatsApp dan alamat pengiriman Anda agar pesanan dapat segera diproses tanpa perlu konfirmasi berulang."}
              </p>
            </div>

            <div className="completeness-track" aria-label="Progress kelengkapan">
              <div
                className={`completeness-fill ${isComplete ? "fill--complete" : ""}`}
                style={{ width: `${data.completenessPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* ── TAB SELECTOR ── */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "info" ? "is-active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <HugeiconsIcon icon={Location01Icon} size={18} strokeWidth={2} />
            <span>Data Pengiriman &amp; Kontak</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "orders" ? "is-active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} size={18} strokeWidth={2} />
            <span>Pesanan Saya ({data.orders.length})</span>
          </button>
        </div>

        {/* ── TAB 1: FORM PENGIRIMAN & TRANSAKSI ── */}
        {activeTab === "info" && (
          <section className="profile-section-card">
            <div className="section-title-wrap">
              <h3>Informasi Lengkap Pengiriman</h3>
              <p>
                Data ini disimpan di sistem database Baitybites dan digunakan otomatis untuk keperluan
                faktur pembayaran, penjemputan, serta koordinasi kurir pengiriman.
              </p>
            </div>

            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-grid">
                {/* Nama Lengkap Penerima */}
                <div className="form-group">
                  <label htmlFor="input-name">
                    Nama Penerima Pesanan <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                    <input
                      id="input-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Contoh: Budi Santoso"
                      required
                    />
                  </div>
                </div>

                {/* Email Google (Readonly) */}
                <div className="form-group">
                  <label htmlFor="input-email">
                    Email Terhubung (Google)
                  </label>
                  <div className="input-with-icon is-readonly">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <input
                      id="input-email"
                      type="email"
                      value={customer.email || "Tidak ada email"}
                      disabled
                    />
                  </div>
                  <small className="field-hint">Email tersinkronisasi langsung dari Akun Google Anda.</small>
                </div>

                {/* Nomor WhatsApp / HP */}
                <div className="form-group">
                  <label htmlFor="input-phone">
                    Nomor WhatsApp / HP Aktif <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <HugeiconsIcon icon={Call02Icon} size={18} />
                    <input
                      id="input-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Contoh: 081234567890"
                      required
                    />
                  </div>
                  <small className="field-hint">Digunakan untuk konfirmasi pesanan dan koordinasi kurir.</small>
                </div>

                {/* Kota / Wilayah */}
                <div className="form-group">
                  <label htmlFor="select-city">
                    Kota / Kabupaten <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <HugeiconsIcon icon={Home01Icon} size={18} />
                    <select
                      id="select-city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Kecamatan / Kelurahan */}
                <div className="form-group">
                  <label htmlFor="input-district">Kecamatan / Kelurahan</label>
                  <div className="input-with-icon">
                    <HugeiconsIcon icon={Location01Icon} size={18} />
                    <input
                      id="input-district"
                      type="text"
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                      placeholder="Contoh: Kebayoran Baru, Gandaria"
                    />
                  </div>
                </div>

                {/* Kode Pos */}
                <div className="form-group">
                  <label htmlFor="input-postal">Kode Pos</label>
                  <input
                    id="input-postal"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder="Contoh: 12130"
                    maxLength={6}
                  />
                </div>

                {/* Alamat Lengkap Pengiriman */}
                <div className="form-group form-group--full">
                  <label htmlFor="input-address">
                    Alamat Lengkap Pengiriman <span className="req">*</span>
                  </label>
                  <textarea
                    id="input-address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Nama jalan, nomor rumah/blok, RT/RW, cluster, atau nama gedung kantor..."
                    required
                  />
                </div>

                {/* Catatan / Patokan Khusus */}
                <div className="form-group form-group--full">
                  <label htmlFor="input-notes">
                    Catatan Khusus Pengiriman / Patokan
                  </label>
                  <div className="textarea-with-icon">
                    <HugeiconsIcon icon={Note01Icon} size={18} className="textarea-icon" />
                    <textarea
                      id="input-notes"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Contoh: Pagar hitam depan lapangan basket, jika tidak ada orang tolong titipkan di pos satpam..."
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save-profile" disabled={isPending}>
                  {isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} size={18} className="icon-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
                      <span>Simpan Perubahan Profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── TAB 2: RIWAYAT PESANAN ── */}
        {activeTab === "orders" && (
          <section className="profile-section-card">
            <div className="section-title-wrap">
              <h3>Riwayat Pesanan Anda</h3>
              <p>
                Daftar transaksi dan pesanan risol serta produk Baitybites yang tercatat di akun Anda.
              </p>
            </div>

            {data.orders.length === 0 ? (
              <div className="empty-orders-state">
                <HugeiconsIcon icon={ShoppingBag01Icon} size={48} strokeWidth={1.5} />
                <h4>Belum Ada Riwayat Pesanan</h4>
                <p>
                  Pesanan yang Anda buat melalui website atau kontak Baitybites akan otomatis muncul di sini.
                </p>
                <Link href="/#order" className="btn-start-order">
                  Mulai Pesan Sekarang
                </Link>
              </div>
            ) : (
              <div className="customer-orders-list">
                {data.orders.map((ord) => (
                  <div className="customer-order-card" key={ord.id}>
                    <div className="card-top">
                      <div className="order-ref-group">
                        <span className="order-ref">{ord.orderRef}</span>
                        <span className="order-channel-badge">{ord.channel}</span>
                      </div>
                      <span className={`status-pill status--${ord.status.toLowerCase()}`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="card-meta">
                      <span className="meta-time">
                        <HugeiconsIcon icon={Clock01Icon} size={14} />
                        {new Date(ord.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {ord.deliveryAddr && (
                        <span className="meta-addr">
                          <HugeiconsIcon icon={Location01Icon} size={14} />
                          {ord.deliveryAddr}
                        </span>
                      )}
                    </div>

                    <div className="card-items">
                      {ord.items.map((it, idx) => (
                        <div className="card-item-row" key={idx}>
                          <span>{it.name} &times; {it.qty}</span>
                          <strong>Rp {it.subtotal.toLocaleString("id-ID")}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="card-bottom">
                      <div className="total-amount">
                        <span>Total Tagihan:</span>
                        <strong>Rp {ord.totalAmount.toLocaleString("id-ID")}</strong>
                      </div>
                      <Link
                        href={`/#tracking`}
                        className="btn-track-link"
                        title="Lacak status pengerjaan pesanan"
                      >
                        Lacak Pesanan &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
