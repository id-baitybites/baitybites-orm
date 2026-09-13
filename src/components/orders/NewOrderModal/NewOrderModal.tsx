"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Cancel01Icon,
  Search01Icon,
  Add01Icon,
  CheckmarkCircle02Icon,
  ShoppingCart01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  UserIcon,
  SmartPhone01Icon,
  Mail01Icon,
  Location01Icon,
  NoteIcon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  getProductsForCartAction,
  createOrderAction,
} from "@/app/orders/actions";
import type {
  CartProduct,
  CartItem,
} from "@/app/orders/actions";
import "./new-order-modal.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartEntry extends CartItem {
  unit: string;
}

type Step = 1 | 2 | 3 | "success";

const PAYMENT_OPTIONS = [
  { value: "CASH",          label: "Tunai",         desc: "Bayar langsung",    icon: "💵" },
  { value: "QRIS",          label: "QRIS",          desc: "Scan & bayar",      icon: "📱" },
  { value: "BANK_TRANSFER", label: "Transfer Bank", desc: "BCA / Mandiri dll", icon: "🏦" },
  { value: "EWALLET",       label: "E-Wallet",      desc: "GoPay / OVO dll",   icon: "💳" },
  { value: "COD",           label: "COD",           desc: "Bayar di tempat",   icon: "🚚" },
];

const CHANNELS = ["WhatsApp", "WalkIn", "Website", "Tokopedia", "Shopee"] as const;

const STEPS = [
  { num: 1, label: "Pilih Produk" },
  { num: 2, label: "Info Pelanggan" },
  { num: 3, label: "Konfirmasi & Bayar" },
];

function fmt(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewOrderModal({ onClose }: Props) {
  const router = useRouter();

  // ── Products / loading
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ── Step state
  const [step, setStep] = useState<Step>(1);

  // ── Product search / filter
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Semua");

  // ── Cart
  const [cart, setCart] = useState<CartEntry[]>([]);

  // ── Step 2 form
  const [customer, setCustomer] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [addr, setAddr]         = useState("");
  const [channel, setChannel]   = useState<string>("WhatsApp");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [note, setNote]         = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount]       = useState(0);

  // ── Step 3
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [createdRef, setCreatedRef]       = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load products
  useEffect(() => {
    getProductsForCartAction().then(({ products: p }) => {
      setProducts(p);
      setLoadingProducts(false);
    });
  }, []);

  // ── Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Focus search on step 1
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [step]);

  // ── Derived
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category))).sort();
    return ["Semua", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCat === "Semua" || p.category === activeCat;
      const q = search.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, search, activeCat]);

  const cartTotal = useMemo(
    () => cart.reduce((s, it) => s + it.price * it.qty, 0),
    [cart]
  );
  const grandTotal = cartTotal + deliveryFee - discount;
  const cartCount  = cart.reduce((s, it) => s + it.qty, 0);

  // ── Cart helpers
  const addToCart = useCallback((p: CartProduct) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.productId === p.id);
      if (existing) {
        return prev.map((x) =>
          x.productId === p.id ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: p.price,
          qty: 1,
          unit: p.unit,
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((x) => x.productId !== productId));
    } else {
      setCart((prev) =>
        prev.map((x) => (x.productId === productId ? { ...x, qty } : x))
      );
    }
  }, []);

  const cartQty = (productId: string) =>
    cart.find((x) => x.productId === productId)?.qty ?? 0;

  // ── Navigation
  const canGoNext: Record<number, boolean> = {
    1: cart.length > 0,
    2: customer.trim().length > 0,
    3: true,
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  // ── Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const res = await createOrderAction({
      customer: customer.trim(),
      customerPhone: phone.trim() || undefined,
      customerEmail: email.trim() || undefined,
      deliveryAddr: addr.trim() || undefined,
      channel,
      priority,
      note: note.trim() || undefined,
      deliveryFee,
      discount,
      paymentMethod,
      items: cart.map(({ productId, name, price, qty, notes }) => ({
        productId, name, price, qty, notes,
      })),
    });

    setSubmitting(false);

    if (res.success && res.orderRef) {
      setCreatedRef(res.orderRef);
      setStep("success");
      router.refresh();
    } else {
      setSubmitError(res.error ?? "Terjadi kesalahan, coba lagi.");
    }
  };

  const stepNum = step === "success" ? 3 : (step as number);

  // ─── Render ────────────────────────────────────────────────
  return (
    <div
      className="nom-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Buat Order Baru"
    >
      <div className="nom-shell">

        {/* ── Header ── */}
        <div className="nom-header">
          <div className="nom-header__title">
            <h2>Buat Pesanan Baru</h2>
            <p>Lengkapi informasi untuk membuat order baru ke database</p>
          </div>
          <button
            className="nom-header__close"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Step indicator ── */}
        {step !== "success" && (
          <div className="nom-steps" aria-label="Langkah-langkah">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className={`nom-steps__item${s.num < stepNum ? " is-done" : s.num === stepNum ? " is-active" : ""}`}
              >
                <span className="nom-steps__item-num">
                  {s.num < stepNum
                    ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2.5} />
                    : s.num
                  }
                </span>
                <span className="nom-steps__item-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        <div className="nom-body">

          {/* ─── SUCCESS ─── */}
          {step === "success" && (
            <div className="nom-content">
              <div className="nom-success">
                <div className="nom-success__icon">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="nom-success__ref">{createdRef}</div>
                  <p className="nom-success__sub">
                    Pesanan berhasil dibuat dan tercatat di sistem. Status awal adalah{" "}
                    <strong>MENUNGGU</strong>.
                  </p>
                </div>
                <div className="nom-success__actions">
                  <button
                    className="nom-success__actions-secondary"
                    onClick={onClose}
                  >
                    Tutup
                  </button>
                  <button
                    className="nom-success__actions-primary"
                    onClick={() => {
                      onClose();
                      router.push(`/orders/${encodeURIComponent(createdRef ?? "")}`);
                    }}
                  >
                    Lihat Detail Pesanan
                    <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 1: Pilih Produk ─── */}
          {step === 1 && (
            <>
              <div className="nom-content">
                {/* Search */}
                <div className="nom-search">
                  <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari produk atau kode SKU..."
                    aria-label="Cari produk"
                  />
                </div>

                {/* Category tabs */}
                <div className="nom-category-tabs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={activeCat === cat ? "is-active" : ""}
                      onClick={() => setActiveCat(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product grid */}
                {loadingProducts ? (
                  <div className="nom-product-grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="nom-skeleton"
                        style={{ height: 220, borderRadius: "var(--radius-lg)" }}
                      />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "var(--space-8) 0" }}>
                    Tidak ada produk yang sesuai.
                  </p>
                ) : (
                  <div className="nom-product-grid">
                    {filteredProducts.map((p) => {
                      const qty = cartQty(p.id);
                      const inCart = qty > 0;
                      return (
                        <div
                          key={p.id}
                          className={`nom-product-card${inCart ? " is-in-cart" : ""}`}
                          onClick={() => addToCart(p)}
                        >
                          {inCart && (
                            <span className="nom-product-card__in-cart-badge">{qty}</span>
                          )}
                          <div className="nom-product-card__img">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} />
                              : p.name.slice(0, 2).toUpperCase()
                            }
                          </div>
                          <div className="nom-product-card__body">
                            <div className="nom-product-card__category">{p.category}</div>
                            <div className="nom-product-card__name">{p.name}</div>
                            <div className="nom-product-card__price">{fmt(p.price)}<small style={{ fontSize: "var(--font-size-2xs)", color: "var(--text-muted)", marginLeft: 4 }}>/{p.unit}</small></div>
                          </div>
                          <button
                            type="button"
                            className="nom-product-card__add"
                            onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                            aria-label={`Tambah ${p.name} ke keranjang`}
                          >
                            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                            {inCart ? `${qty} di keranjang` : "Tambah"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart sidebar */}
              <CartSidebar
                cart={cart}
                cartTotal={cartTotal}
                deliveryFee={deliveryFee}
                discount={discount}
                grandTotal={grandTotal}
                onSetQty={setQty}
              />
            </>
          )}

          {/* ─── STEP 2: Info Pelanggan ─── */}
          {step === 2 && (
            <>
              <div className="nom-content">
                <div className="nom-form">
                  {/* Nama */}
                  <div className="nom-form__group">
                    <label htmlFor="nom-customer">
                      Nama Pelanggan <span className="required">*</span>
                    </label>
                    <input
                      id="nom-customer"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      placeholder="Contoh: Rina Dewi"
                      autoFocus
                    />
                  </div>

                  <div className="nom-form__row">
                    {/* Telepon */}
                    <div className="nom-form__group">
                      <label htmlFor="nom-phone">Nomor Telepon</label>
                      <input
                        id="nom-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+62 812 xxxx xxxx"
                        type="tel"
                      />
                    </div>
                    {/* Email */}
                    <div className="nom-form__group">
                      <label htmlFor="nom-email">Email</label>
                      <input
                        id="nom-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@contoh.com"
                        type="email"
                      />
                    </div>
                  </div>

                  {/* Alamat */}
                  <div className="nom-form__group">
                    <label htmlFor="nom-addr">Alamat Pengiriman</label>
                    <textarea
                      id="nom-addr"
                      value={addr}
                      onChange={(e) => setAddr(e.target.value)}
                      placeholder="Jl. Contoh No. 123, Jakarta Selatan..."
                      rows={2}
                    />
                  </div>

                  <div className="nom-form__row">
                    {/* Channel */}
                    <div className="nom-form__group">
                      <label htmlFor="nom-channel">Channel Pesanan</label>
                      <select
                        id="nom-channel"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                      >
                        {CHANNELS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="nom-form__group">
                      <label>Prioritas</label>
                      <div className="nom-priority-toggle">
                        <label
                          className={priority === "NORMAL" ? "is-normal-active" : ""}
                          onClick={() => setPriority("NORMAL")}
                        >
                          <input type="radio" name="priority" value="NORMAL" readOnly checked={priority === "NORMAL"} />
                          Normal
                        </label>
                        <label
                          className={priority === "URGENT" ? "is-urgent-active" : ""}
                          onClick={() => setPriority("URGENT")}
                        >
                          <input type="radio" name="priority" value="URGENT" readOnly checked={priority === "URGENT"} />
                          🚨 Urgent
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="nom-form__row">
                    {/* Ongkir */}
                    <div className="nom-form__group">
                      <label htmlFor="nom-delivery-fee">Ongkos Kirim (Rp)</label>
                      <input
                        id="nom-delivery-fee"
                        type="number"
                        min="0"
                        step="1000"
                        value={deliveryFee || ""}
                        onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    {/* Diskon */}
                    <div className="nom-form__group">
                      <label htmlFor="nom-discount">Diskon (Rp)</label>
                      <input
                        id="nom-discount"
                        type="number"
                        min="0"
                        step="1000"
                        value={discount || ""}
                        onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="nom-form__group">
                    <label htmlFor="nom-note">Catatan Pesanan</label>
                    <textarea
                      id="nom-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Catatan khusus untuk dapur atau pengiriman..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Cart sidebar readonly */}
              <CartSidebar
                cart={cart}
                cartTotal={cartTotal}
                deliveryFee={deliveryFee}
                discount={discount}
                grandTotal={grandTotal}
                onSetQty={setQty}
                readonly
              />
            </>
          )}

          {/* ─── STEP 3: Konfirmasi & Bayar ─── */}
          {step === 3 && (
            <div className="nom-content">
              {/* Order summary */}
              <div className="nom-summary">
                <div className="nom-summary__title">
                  <HugeiconsIcon icon={ShoppingCart01Icon} size={16} strokeWidth={1.8} />
                  Ringkasan Pesanan ({cart.length} produk, {cartCount} item)
                </div>
                <div className="nom-summary__items">
                  {cart.map((it) => (
                    <div key={it.productId} className="nom-summary__item">
                      <span>{it.name} ×{it.qty}</span>
                      <span>{fmt(it.price * it.qty)}</span>
                    </div>
                  ))}
                  {deliveryFee > 0 && (
                    <div className="nom-summary__item">
                      <span>Ongkos Kirim</span>
                      <span>{fmt(deliveryFee)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="nom-summary__item" style={{ color: "var(--color-success)" }}>
                      <span>Diskon</span>
                      <span>−{fmt(discount)}</span>
                    </div>
                  )}
                </div>
                <div className="nom-summary__total">
                  <span>Total Pembayaran</span>
                  <strong>{fmt(grandTotal)}</strong>
                </div>
              </div>

              {/* Customer summary */}
              <div className="nom-customer-summary">
                <div className="nom-customer-summary__header">
                  <div className="nom-customer-summary__avatar">
                    {customer.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="nom-customer-summary__name">{customer}</div>
                    <div className="nom-customer-summary__channel">{channel}</div>
                  </div>
                </div>
                <div className="nom-customer-summary__details">
                  {phone && (
                    <div className="nom-customer-summary__row">
                      <span><HugeiconsIcon icon={SmartPhone01Icon} size={13} strokeWidth={1.8} /> Telepon</span>
                      <strong>{phone}</strong>
                    </div>
                  )}
                  {email && (
                    <div className="nom-customer-summary__row">
                      <span><HugeiconsIcon icon={Mail01Icon} size={13} strokeWidth={1.8} /> Email</span>
                      <strong>{email}</strong>
                    </div>
                  )}
                  {addr && (
                    <div className="nom-customer-summary__row">
                      <span><HugeiconsIcon icon={Location01Icon} size={13} strokeWidth={1.8} /> Alamat</span>
                      <strong>{addr}</strong>
                    </div>
                  )}
                  {note && (
                    <div className="nom-customer-summary__row">
                      <span><HugeiconsIcon icon={NoteIcon} size={13} strokeWidth={1.8} /> Catatan</span>
                      <strong>{note}</strong>
                    </div>
                  )}
                  <div className="nom-customer-summary__row">
                    <span><HugeiconsIcon icon={UserIcon} size={13} strokeWidth={1.8} /> Prioritas</span>
                    <strong style={{ color: priority === "URGENT" ? "var(--color-danger)" : "var(--text-primary)" }}>
                      {priority}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="nom-section-label">Metode Pembayaran</p>
                <div className="nom-payment-methods">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`nom-payment-card${paymentMethod === opt.value ? " is-selected" : ""}`}
                      onClick={() => setPaymentMethod(opt.value)}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={opt.value}
                        readOnly
                        checked={paymentMethod === opt.value}
                      />
                      <span className="nom-payment-card__icon">{opt.icon}</span>
                      <span className="nom-payment-card__label">{opt.label}</span>
                      <span className="nom-payment-card__desc">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {submitError && (
                <div className="nom-error">
                  <HugeiconsIcon icon={Alert01Icon} size={16} strokeWidth={2} />
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step !== "success" && (
          <div className="nom-footer">
            <div className="nom-footer__left">
              {step > 1 && (
                <button
                  type="button"
                  className="nom-footer__back"
                  onClick={handleBack}
                  disabled={submitting}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
                  Kembali
                </button>
              )}
              {step === 1 && (
                <span className="nom-footer__cart-count">
                  <strong>{cartCount}</strong> item di keranjang
                </span>
              )}
            </div>

            {step < 3 ? (
              <button
                type="button"
                className="nom-footer__next"
                onClick={handleNext}
                disabled={!canGoNext[step as number]}
              >
                {step === 1 ? "Info Pelanggan" : "Konfirmasi Pesanan"}
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                className="nom-footer__next nom-footer__next--submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                    Buat Pesanan · {fmt(grandTotal)}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cart Sidebar Sub-component ───────────────────────────────────────────────

function CartSidebar({
  cart,
  cartTotal,
  deliveryFee,
  discount,
  grandTotal,
  onSetQty,
  readonly = false,
}: {
  cart: CartEntry[];
  cartTotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  onSetQty: (productId: string, qty: number) => void;
  readonly?: boolean;
}) {
  const totalItems = cart.reduce((s, x) => s + x.qty, 0);

  return (
    <div className="nom-cart">
      <div className="nom-cart__header">
        Keranjang
        {totalItems > 0 && (
          <span className="nom-cart__badge">{totalItems}</span>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="nom-cart__empty">
          <HugeiconsIcon icon={ShoppingCart01Icon} size={32} strokeWidth={1.2} />
          <p>Keranjang masih kosong</p>
        </div>
      ) : (
        <div className="nom-cart__items">
          {cart.map((it) => (
            <div key={it.productId} className="nom-cart-item">
              <div className="nom-cart-item__info">
                <strong>{it.name}</strong>
                <span>{fmt(it.price)} /{it.unit}</span>
              </div>
              {!readonly ? (
                <div className="nom-cart-item__controls">
                  <button
                    type="button"
                    className={`nom-cart-item__qty-btn${it.qty <= 1 ? " is-remove" : ""}`}
                    onClick={() => onSetQty(it.productId, it.qty - 1)}
                    aria-label="Kurangi"
                  >
                    {it.qty <= 1 ? "×" : "−"}
                  </button>
                  <span className="nom-cart-item__qty">{it.qty}</span>
                  <button
                    type="button"
                    className="nom-cart-item__qty-btn"
                    onClick={() => onSetQty(it.productId, it.qty + 1)}
                    aria-label="Tambah"
                  >
                    +
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", flexShrink: 0 }}>×{it.qty}</span>
              )}
              <span className="nom-cart-item__price">{fmt(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="nom-cart__footer">
        <div className="nom-cart__row">
          <span>Subtotal</span>
          <strong>{fmt(cartTotal)}</strong>
        </div>
        {deliveryFee > 0 && (
          <div className="nom-cart__row">
            <span>Ongkir</span>
            <strong>{fmt(deliveryFee)}</strong>
          </div>
        )}
        {discount > 0 && (
          <div className="nom-cart__row" style={{ color: "var(--color-success)" }}>
            <span>Diskon</span>
            <strong>−{fmt(discount)}</strong>
          </div>
        )}
        <div className="nom-cart__row nom-cart__row--total">
          <span>Total</span>
          <strong>{fmt(grandTotal)}</strong>
        </div>
      </div>
    </div>
  );
}
