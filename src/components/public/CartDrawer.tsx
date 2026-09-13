"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  Cancel01Icon,
  Add01Icon,
  Remove01Icon,
  Delete01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  Call02Icon,
  UserIcon,
  CreditCardIcon,
  QrCodeIcon,
  Coins01Icon,
  Motorbike01Icon,
  Store01Icon,
  SparklesIcon,
  Loading03Icon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";
import {
  createCustomerOrderAction,
  type CheckoutItem,
  type CheckoutPayload,
} from "@/app/actions/checkout";
import {
  PAXEL_STORE_ORIGIN,
  PAXEL_SERVICES,
  PAXEL_CITIES,
  type PaxelServiceType,
  calculatePaxelPackageSize,
  calculatePaxelDeliveryFee,
  getPaxelTrackingUrl,
} from "@/lib/paxel";
import "@/components/public/cart-drawer.scss";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CheckoutItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  } | null;
  whatsappNumber?: string;
  onTrackOrder?: (orderRef: string) => void;
}

type CheckoutStep = "cart" | "shipping" | "payment" | "success";

// Backwards compatibility alias
export const STORE_LOCATION = PAXEL_STORE_ORIGIN;

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  customer,
  whatsappNumber = "+6281288882345",
  onTrackOrder,
}: CartDrawerProps) {
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Data Pengiriman Paxel
  const [paxelService, setPaxelService] = useState<PaxelServiceType>("PAXEL_SAMEDAY");
  const [customerName, setCustomerName] = useState(customer?.name || "");
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(customer?.email || "");
  const [deliveryAddress, setDeliveryAddress] = useState(customer?.address || "");
  const [deliveryCity, setDeliveryCity] = useState(customer?.city || "Depok");
  const [deliveryDistrict, setDeliveryDistrict] = useState(customer?.district || "");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState(customer?.postalCode || "");
  const [orderNotes, setOrderNotes] = useState("");

  // Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "BANK_TRANSFER" | "COD">("QRIS");

  // Hasil Pesanan yang Berhasil Dibuat
  const [createdOrderRef, setCreatedOrderRef] = useState<string | null>(null);
  const [createdPaxelAwb, setCreatedPaxelAwb] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isAwbCopied, setIsAwbCopied] = useState(false);

  // Kalkulasi Item & Paxel Package Sizing
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const totalItemsCount = items.reduce((sum, it) => sum + it.qty, 0);

  // Estimasi Ukuran Paket Paxel Cold Chain (S / M / L)
  const packageSizeInfo = calculatePaxelPackageSize(totalItemsCount);

  // Hitung Tarif Paxel Berdasarkan Layanan, Kota, dan Ukuran Paket
  const isPickup = paxelService === "PICKUP";
  const deliveryType: "DELIVERY" | "PICKUP" = isPickup ? "PICKUP" : "DELIVERY";
  const samedayFee = calculatePaxelDeliveryFee("PAXEL_SAMEDAY", deliveryCity, packageSizeInfo.size);
  const instantFee = calculatePaxelDeliveryFee("PAXEL_INSTANT", deliveryCity, packageSizeInfo.size);
  const deliveryFee = isPickup || subtotal === 0
    ? 0
    : calculatePaxelDeliveryFee(paxelService, deliveryCity, packageSizeInfo.size);

  const totalAmount = subtotal + deliveryFee;

  if (!isOpen) return null;

  // Handler Lanjut dari Keranjang ke Pengiriman
  const handleProceedToShipping = () => {
    if (items.length === 0) return;
    setErrorMessage(null);
    setStep("shipping");
  };

  // Handler Lanjut dari Pengiriman ke Pembayaran
  const handleProceedToPayment = () => {
    if (!customerName.trim()) {
      setErrorMessage("Nama pemesan wajib diisi.");
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage("Nomor WhatsApp wajib diisi untuk konfirmasi status pesanan.");
      return;
    }
    if (!isPickup && !deliveryAddress.trim()) {
      setErrorMessage("Alamat pengiriman wajib diisi untuk layanan pengiriman kurir Paxel.");
      return;
    }
    setErrorMessage(null);
    setStep("payment");
  };

  // Handler Submit Pesanan Akhir
  const handleSubmitOrder = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const payload: CheckoutPayload = {
        customerName,
        customerPhone,
        customerEmail,
        deliveryType,
        deliveryAddress: !isPickup ? deliveryAddress : undefined,
        deliveryCity: !isPickup ? deliveryCity : undefined,
        deliveryDistrict: !isPickup ? deliveryDistrict : undefined,
        deliveryPostalCode: !isPickup ? deliveryPostalCode : undefined,
        orderNotes,
        paymentMethod,
        items,
        subtotal,
        deliveryFee,
        totalAmount,
        paxelService,
      };

      const res = await createCustomerOrderAction(payload);
      if (res.success && res.orderRef) {
        setCreatedOrderRef(res.orderRef);
        setCreatedPaxelAwb(res.paxelAwb || null);
        setStep("success");
        onClearCart();
      } else {
        setErrorMessage(res.error || "Gagal menyelesaikan pesanan. Silakan periksa data Anda.");
      }
    });
  };

  // Salin Nomor Order
  const handleCopyOrderRef = () => {
    if (!createdOrderRef) return;
    navigator.clipboard.writeText(createdOrderRef);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Buka WhatsApp untuk Konfirmasi Cepat
  const handleOpenWhatsApp = () => {
    if (!createdOrderRef) return;
    const cleanWa = whatsappNumber.replace(/[^0-9]/g, "");

    const deliveryDetail = isPickup
      ? `Ambil Sendiri di Toko (${PAXEL_STORE_ORIGIN.name} - ${PAXEL_STORE_ORIGIN.address})`
      : `${PAXEL_SERVICES[paxelService]?.name || "Paxel Official"} (Ukuran: Size ${packageSizeInfo.size}) ke ${deliveryAddress}, ${deliveryCity}${
          createdPaxelAwb ? `\nNo. Resi Paxel (AWB): ${createdPaxelAwb}` : ""
        }`;

    const msg = `Halo Baitybites! Saya mau konfirmasi pesanan dari website:
No. Pesanan: ${createdOrderRef}
Nama: ${customerName}
No. WA: ${customerPhone}
Layanan: ${deliveryDetail}
Subtotal: Rp ${subtotal.toLocaleString("id-ID")}
Ongkir: ${
      deliveryFee === 0
        ? "Bebas Ongkir (Self Pickup Toko Sawangan)"
        : `Rp ${deliveryFee.toLocaleString("id-ID")} (${PAXEL_SERVICES[paxelService]?.name} - Size ${packageSizeInfo.size})`
    }
Metode Bayar: ${paymentMethod}
Total Tagihan: Rp ${totalAmount.toLocaleString("id-ID")}
${createdPaxelAwb ? `Link Lacak Paxel: ${getPaxelTrackingUrl(createdPaxelAwb)}\n` : ""}
Mohon diproses ya kak. Terima kasih!`;

    const url = `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="cart-drawer-backdrop" onClick={onClose}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* ── HEADER DRAWER ── */}
        <div className="cart-drawer__header">
          <div className="header-left">
            {step === "shipping" && (
              <button
                type="button"
                className="btn-back-step"
                onClick={() => setStep("cart")}
                title="Kembali ke Keranjang"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
              </button>
            )}
            {step === "payment" && (
              <button
                type="button"
                className="btn-back-step"
                onClick={() => setStep("shipping")}
                title="Kembali ke Pengiriman"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
              </button>
            )}
            <h2>
              {step === "cart" && "Keranjang Belanja"}
              {step === "shipping" && "Pengiriman Paxel"}
              {step === "payment" && "Metode Pembayaran"}
              {step === "success" && "Pesanan Diterima"}
            </h2>
            {step === "cart" && items.length > 0 && (
              <span className="cart-count-badge">{totalItemsCount} item</span>
            )}
          </div>
          <button
            type="button"
            className="btn-close-drawer"
            onClick={onClose}
            aria-label="Tutup keranjang"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── STEP INDICATOR ── */}
        {step !== "success" && items.length > 0 && (
          <div className="cart-drawer__stepper">
            <div className={`step-pill ${step === "cart" ? "is-active" : "is-done"}`}>
              <span className="step-num">1</span>
              <span className="step-label">Menu</span>
            </div>
            <div className="step-line" />
            <div className={`step-pill ${step === "shipping" ? "is-active" : step === "payment" ? "is-done" : ""}`}>
              <span className="step-num">2</span>
              <span className="step-label">Paxel</span>
            </div>
            <div className="step-line" />
            <div className={`step-pill ${step === "payment" ? "is-active" : ""}`}>
              <span className="step-num">3</span>
              <span className="step-label">Bayar</span>
            </div>
          </div>
        )}

        {/* ── ERROR BANNER ── */}
        {errorMessage && (
          <div className="cart-drawer__error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── BODY: STEP 1 - REVIEW KERANJANG ── */}
        {step === "cart" && (
          <div className="cart-drawer__body">
            {items.length === 0 ? (
              <div className="cart-drawer__empty">
                <div className="empty-icon-wrap">
                  <HugeiconsIcon icon={ShoppingBag01Icon} size={48} strokeWidth={1.5} />
                </div>
                <h3>Keranjang Anda Masih Kosong</h3>
                <p>
                  Pilih aneka Risol Mayo Melted dan Minuman Cendol favorit Anda dari katalog untuk memulai pemesanan.
                </p>
                <button type="button" className="btn-browse-catalog" onClick={onClose}>
                  <span>Jelajahi Menu Baitybites</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="cart-drawer__items-list">
                {items.map((item) => (
                  <div className="cart-item-row" key={item.id}>
                    <div className="cart-item-row__visual">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="64px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <HugeiconsIcon icon={SparklesIcon} size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="cart-item-row__info">
                      <div className="cart-item-row__title-row">
                        <h4>{item.name}</h4>
                        <button
                          type="button"
                          className="btn-item-delete"
                          onClick={() => onRemoveItem(item.id)}
                          title="Hapus dari keranjang"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                      <div className="cart-item-row__price">
                        Rp {item.price.toLocaleString("id-ID")}
                        {item.unit && <small> / {item.unit}</small>}
                      </div>

                      {/* Catatan Per Menu */}
                      <div className="cart-item-row__note-box">
                        <input
                          type="text"
                          placeholder="Catatan menu (opsional, misal: mayo dipisah)..."
                          value={item.notes || ""}
                          onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                        />
                      </div>

                      {/* Kontrol Kuantitas */}
                      <div className="cart-item-row__bottom">
                        <div className="qty-control">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, -1)}
                            disabled={item.qty <= 1}
                            aria-label="Kurangi kuantitas"
                          >
                            <HugeiconsIcon icon={Remove01Icon} size={13} strokeWidth={2.5} />
                          </button>
                          <span className="qty-value">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, 1)}
                            aria-label="Tambah kuantitas"
                          >
                            <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                        <span className="item-subtotal">
                          Rp {(item.price * item.qty).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BODY: STEP 2 - INFORMASI PENGIRIMAN (PAXEL RESMI) ── */}
        {step === "shipping" && (
          <div className="cart-drawer__body">
            <div className="shipping-form-wrap">
              {/* Official Logistics Partner Header */}
              <div className="paxel-partner-header">
                <div className="paxel-brand-tag">
                  <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2} />
                  <span>Official Courier: Paxel Indonesia</span>
                </div>
                <div className="paxel-cold-pill">
                  <span>❄️ Cold Chain Ready</span>
                </div>
              </div>

              {/* Opsi Layanan Logistik Paxel & Pickup */}
              <div className="delivery-toggle-group">
                {/* 1. Paxel Same Day Cold Chain */}
                <button
                  type="button"
                  className={`delivery-toggle-btn paxel-btn ${paxelService === "PAXEL_SAMEDAY" ? "is-active" : ""}`}
                  onClick={() => setPaxelService("PAXEL_SAMEDAY")}
                >
                  <HugeiconsIcon icon={Motorbike01Icon} size={20} strokeWidth={2} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>Paxel Same Day (Cold Chain)</strong>
                      <span className="rate-badge paxel-rate">
                        Rp {samedayFee.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <small>Fasilitas pendingin (freezer/chiller), menjaga makanan tetap beku segar sampai hari ini.</small>
                  </div>
                </button>

                {/* 2. Paxel Instant */}
                <button
                  type="button"
                  className={`delivery-toggle-btn paxel-btn ${paxelService === "PAXEL_INSTANT" ? "is-active" : ""}`}
                  onClick={() => setPaxelService("PAXEL_INSTANT")}
                >
                  <HugeiconsIcon icon={Motorbike01Icon} size={20} strokeWidth={2} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>Paxel Instant (2 - 4 Jam)</strong>
                      <span className="rate-badge paxel-rate">
                        Rp {instantFee.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <small>Pengantaran kilat langsung oleh Hero Paxel menuju alamat tujuan dalam 2 - 4 jam.</small>
                  </div>
                </button>

                {/* 3. Ambil Sendiri di Toko Sawangan */}
                <button
                  type="button"
                  className={`delivery-toggle-btn ${paxelService === "PICKUP" ? "is-active" : ""}`}
                  onClick={() => setPaxelService("PICKUP")}
                >
                  <HugeiconsIcon icon={Store01Icon} size={20} strokeWidth={2} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>Ambil di Toko (Self Pickup)</strong>
                      <span className="free-badge">Bebas Ongkir</span>
                    </div>
                    <small>Ambil langsung ke Toko Baitybites Sawangan, Depok.</small>
                  </div>
                </button>
              </div>

              {/* Indikator Dimensi Paket Paxel Otomatis */}
              <div className="paxel-package-indicator">
                <span>Ukuran Paket ({totalItemsCount} item):</span>
                <span className="package-size-tag">
                  Size {packageSizeInfo.size} ({packageSizeInfo.dimensionsCm})
                </span>
              </div>

              {/* Jaminan Cold Chain Paxel */}
              {!isPickup && (
                <div className="paxel-coldchain-banner">
                  <HugeiconsIcon icon={SparklesIcon} size={18} />
                  <div>
                    <strong>Jaminan Suhu Terjaga (Cold Chain):</strong> Seluruh paket risol &amp; cemilan Baitybites diantar menggunakan armada berinsulasi dan freezer Paxel untuk menjaga kesegaran maksimal.
                  </div>
                </div>
              )}

              {/* Status Login / Guest */}
              {customer?.name ? (
                <div className="customer-autofill-banner">
                  <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={2} />
                  <span>
                    Masuk sebagai <strong>{customer.name}</strong> (Data profil otomatis terisi).
                  </span>
                </div>
              ) : (
                <div className="guest-login-notice">
                  <span>Punya akun pelanggan? </span>
                  <a href="/api/auth/google?returnTo=/">Masuk via Google</a>
                  <span> untuk mengisi otomatis.</span>
                </div>
              )}

              {/* Input Data Pemesan */}
              <div className="form-group-field">
                <label>Nama Lengkap Pemesan *</label>
                <div className="input-with-icon">
                  <HugeiconsIcon icon={UserIcon} size={16} />
                  <input
                    type="text"
                    placeholder="Contoh: Bintang Wijaya"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Nomor WhatsApp Aktif *</label>
                <div className="input-with-icon">
                  <HugeiconsIcon icon={Call02Icon} size={16} />
                  <input
                    type="tel"
                    placeholder="Contoh: 081288882345"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
                <small className="field-hint">Nomor digunakan untuk konfirmasi status kurir &amp; resi Paxel.</small>
              </div>

              {/* Jika Layanan Paxel: Alamat & Wilayah Tujuan */}
              {!isPickup ? (
                <>
                  <div className="sameday-origin-info">
                    <HugeiconsIcon icon={Location01Icon} size={18} className="origin-icon" />
                    <div>
                      <div>Titik Asal Paxel: <strong>{PAXEL_STORE_ORIGIN.name}</strong></div>
                      <small style={{ color: "#64748b", display: "block", marginTop: "2px" }}>
                        {PAXEL_STORE_ORIGIN.address}
                      </small>
                      <div className="sameday-calc-hint" style={{ marginTop: "4px" }}>
                        Tarif Paxel ({deliveryCity} • Size {packageSizeInfo.size}):{" "}
                        <strong>Rp {deliveryFee.toLocaleString("id-ID")}</strong> (diterapkan ke total tagihan).
                      </div>
                    </div>
                  </div>

                  <div className="form-group-field">
                    <label>Alamat Lengkap Pengiriman *</label>
                    <div className="input-with-icon textarea-icon">
                      <HugeiconsIcon icon={Location01Icon} size={16} />
                      <textarea
                        rows={3}
                        placeholder="Nama jalan, nomor rumah, RT/RW, blok, patokan lokasi..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-compact">
                    <div className="form-group-field">
                      <label>Kota / Wilayah Tujuan</label>
                      <select
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                      >
                        {PAXEL_CITIES.map((c) => {
                          const fee = calculatePaxelDeliveryFee(paxelService, c, packageSizeInfo.size);
                          return (
                            <option key={c} value={c}>
                              {c} — Ongkir Rp {fee.toLocaleString("id-ID")}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group-field">
                      <label>Kecamatan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Sawangan / Kebayoran Baru"
                        value={deliveryDistrict}
                        onChange={(e) => setDeliveryDistrict(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="pickup-outlet-info">
                  <div className="outlet-icon-box">
                    <HugeiconsIcon icon={Store01Icon} size={20} />
                  </div>
                  <div className="outlet-details">
                    <strong>{PAXEL_STORE_ORIGIN.name}</strong>
                    <p>{PAXEL_STORE_ORIGIN.address}</p>
                    <div className="coordinates-pill">
                      📍 {PAXEL_STORE_ORIGIN.coordinates.lat}, {PAXEL_STORE_ORIGIN.coordinates.lng}
                    </div>
                    <div>
                      <a
                        href={PAXEL_STORE_ORIGIN.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-maps-link"
                      >
                        <span>Petunjuk Arah Google Maps</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan Tambahan */}
              <div className="form-group-field">
                <label>Catatan Khusus Pengiriman (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Pagar hitam, titip di pos sekuriti..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── BODY: STEP 3 - METODE PEMBAYARAN ── */}
        {step === "payment" && (
          <div className="cart-drawer__body">
            <div className="payment-options-wrap">
              <span className="section-subtitle">Pilih Metode Pembayaran</span>

              <div className="payment-methods-grid">
                {/* Opsi 1: QRIS */}
                <label className={`payment-method-card ${paymentMethod === "QRIS" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="QRIS"
                    checked={paymentMethod === "QRIS"}
                    onChange={() => setPaymentMethod("QRIS")}
                  />
                  <div className="payment-method-card__inner">
                    <div className="icon-wrap">
                      <HugeiconsIcon icon={QrCodeIcon} size={20} strokeWidth={2} />
                    </div>
                    <div className="info-wrap">
                      <strong>QRIS Instant (Rekomendasi)</strong>
                      <span>Bisa bayar dari GoPay, OVO, DANA, BCA, Mandiri, dll.</span>
                    </div>
                  </div>
                </label>

                {/* Opsi 2: Transfer Bank */}
                <label className={`payment-method-card ${paymentMethod === "BANK_TRANSFER" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={() => setPaymentMethod("BANK_TRANSFER")}
                  />
                  <div className="payment-method-card__inner">
                    <div className="icon-wrap">
                      <HugeiconsIcon icon={CreditCardIcon} size={20} strokeWidth={2} />
                    </div>
                    <div className="info-wrap">
                      <strong>Transfer Bank</strong>
                      <span>BCA / Mandiri Baitybites dengan bukti transfer.</span>
                    </div>
                  </div>
                </label>

                {/* Opsi 3: Bayar di Tempat (COD) */}
                <label className={`payment-method-card ${paymentMethod === "COD" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  <div className="payment-method-card__inner">
                    <div className="icon-wrap">
                      <HugeiconsIcon icon={Coins01Icon} size={20} strokeWidth={2} />
                    </div>
                    <div className="info-wrap">
                      <strong>Bayar di Tempat (COD / Tunai)</strong>
                      <span>Bayar tunai kepada Hero Paxel saat pesanan sampai atau di outlet.</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Ringkasan Rincian Biaya */}
              <div className="payment-summary-card">
                <span className="summary-title">Rincian Pembayaran</span>
                <div className="summary-row">
                  <span>Subtotal ({totalItemsCount} item)</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="summary-row">
                  <span>
                    {isPickup
                      ? "Metode Ambil Sendiri (Self Pickup)"
                      : `Ongkos Kirim Paxel (${PAXEL_SERVICES[paxelService]?.badge || "Paxel"} - ${deliveryCity})`}
                  </span>
                  <span>
                    {deliveryFee === 0 ? (
                      <strong style={{ color: "#10b981" }}>BEBAS ONGKIR (Rp 0)</strong>
                    ) : (
                      `Rp ${deliveryFee.toLocaleString("id-ID")}`
                    )}
                  </span>
                </div>
                <div className="summary-row summary-total">
                  <strong>Total Pembayaran</strong>
                  <strong className="total-val">Rp {totalAmount.toLocaleString("id-ID")}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BODY: STEP 4 - SUKSES SELESAI PESANAN ── */}
        {step === "success" && (
          <div className="cart-drawer__body">
            <div className="order-success-screen">
              <div className="success-icon-wrap">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={54} strokeWidth={2} />
              </div>
              <h3>Pesanan Berhasil Diterima!</h3>
              <p>
                Terima kasih, <strong>{customerName}</strong>! Pesanan Anda telah masuk ke sistem dapur Baitybites dan segera diproses.
              </p>

              {/* Order Ref Card */}
              <div className="order-ref-card">
                <span className="label">Nomor Referensi Pesanan:</span>
                <div className="ref-display">
                  <strong>{createdOrderRef}</strong>
                  <button
                    type="button"
                    className="btn-copy-ref"
                    onClick={handleCopyOrderRef}
                    title="Salin nomor pesanan"
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={16} />
                    <span>{isCopied ? "Disalin!" : "Salin"}</span>
                  </button>
                </div>
                <span className="ref-desc">Simpan nomor ini untuk melacak status pesanan Anda.</span>
              </div>

              {/* Paxel Official AWB Card */}
              {createdPaxelAwb && (
                <div className="paxel-awb-card">
                  <div className="awb-header">
                    <span className="brand-title">📦 Paxel Official Airway Bill (AWB)</span>
                    <span className="status-chip">Manifest Siap</span>
                  </div>
                  <div className="awb-code-row">
                    <strong>{createdPaxelAwb}</strong>
                    <button
                      type="button"
                      className="btn-copy-ref"
                      onClick={() => {
                        if (!createdPaxelAwb) return;
                        navigator.clipboard.writeText(createdPaxelAwb);
                        setIsAwbCopied(true);
                        setTimeout(() => setIsAwbCopied(false), 2000);
                      }}
                      title="Salin nomor resi Paxel"
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={15} />
                      <span>{isAwbCopied ? "Disalin!" : "Salin Resi"}</span>
                    </button>
                  </div>
                  <a
                    href={getPaxelTrackingUrl(createdPaxelAwb)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-track-paxel"
                  >
                    <span>Lacak Paket Live di Paxel Indonesia</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                  </a>
                </div>
              )}

              {/* Tombol Aksi Lanjutan */}
              <div className="success-actions">
                <button
                  type="button"
                  className="btn-confirm-wa"
                  onClick={handleOpenWhatsApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.3-.777.978-.953 1.178-.176.2-.351.226-.652.076-.301-.15-1.272-.469-2.424-1.498-.895-.8-1.5-1.788-1.676-2.089-.176-.3-.019-.462.132-.612.136-.135.301-.351.452-.527.15-.176.2-.301.3-.502.1-.2.05-.376-.025-.527-.075-.15-.676-1.63-.927-2.232-.244-.588-.493-.508-.676-.518-.175-.008-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.511c0 1.482 1.079 2.912 1.23 3.113.15.2 2.124 3.243 5.147 4.549.719.311 1.28.497 1.718.636.723.23 1.381.198 1.902.12.58-.088 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.125-.276-.2-.577-.35zM12.04 2C6.52 2 2.036 6.484 2.036 12c0 1.84.498 3.565 1.365 5.053L2 22l5.093-1.336A9.92 9.92 0 0 0 12.04 22c5.52 0 10.005-4.484 10.005-10s-4.485-10-10.005-10z" />
                  </svg>
                  <span>Konfirmasi via WhatsApp Admin</span>
                </button>

                {onTrackOrder && createdOrderRef && (
                  <button
                    type="button"
                    className="btn-track-direct"
                    onClick={() => {
                      onTrackOrder(createdOrderRef);
                      onClose();
                    }}
                  >
                    <span>Lacak Status Pesanan Ini</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                  </button>
                )}

                <button
                  type="button"
                  className="btn-continue-shopping"
                  onClick={() => {
                    setStep("cart");
                    setCreatedOrderRef(null);
                    setCreatedPaxelAwb(null);
                    onClose();
                  }}
                >
                  Kembali Belanja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER DRAWER (NAVIGASI STEP) ── */}
        {step !== "success" && items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="footer-subtotal-row">
              <div>
                <span>Total Tagihan:</span>
                {!isPickup && items.length > 0 && (
                  <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>
                    Termasuk Ongkir Paxel ({deliveryCity}): Rp {deliveryFee.toLocaleString("id-ID")}
                  </small>
                )}
              </div>
              <strong>Rp {totalAmount.toLocaleString("id-ID")}</strong>
            </div>

            {step === "cart" && (
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleProceedToShipping}
              >
                <span>Lanjut Pengiriman ({totalItemsCount} item)</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </button>
            )}

            {step === "shipping" && (
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleProceedToPayment}
              >
                <span>Lanjut ke Pembayaran</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </button>
            )}

            {step === "payment" && (
              <button
                type="button"
                className="btn-primary-action btn-submit-order"
                onClick={handleSubmitOrder}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={18} className="spinner-icon" />
                    <span>Memproses Pesanan...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
                    <span>Konfirmasi &amp; Pesan Sekarang</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
