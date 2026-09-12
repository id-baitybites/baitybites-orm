"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Search01Icon,
  ShoppingBag01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  SparklesIcon,
  FireIcon,
  Clock01Icon,
  ThumbsUpIcon,
  StarIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { trackOrderAction, type TrackedOrderResult } from "@/app/tracking/actions";
import "@/components/public/public-site.scss";

// ─── Data Produk Katalog ────────────────────────────────────────────────────────
const CATEGORIES = ["Semua", "Risol Frozen", "Risol Ready to Eat", "Minuman Cendol", "Paket Box"];

const MENU_PRODUCTS = [
  {
    id: "p1",
    name: "Risol Mayo Beef Double Cheese",
    category: "Risol Frozen",
    price: 48000,
    unit: "Pack (5 pcs)",
    description: "Smoked beef premium dengan saus mayo lumer racikan rahasia dan taburan double keju cheddar mozzarella.",
    tag: "Best Seller",
    stock: "Tersedia",
  },
  {
    id: "p2",
    name: "Risol Beef Mushroom Truffle",
    category: "Risol Ready to Eat",
    price: 12000,
    unit: "Pcs",
    description: "Daging cincang lada hitam berpadu jamur champignon lembut dan wangi aroma minyak truffle otentik.",
    tag: "Chef Special",
    stock: "Tersedia",
  },
  {
    id: "p3",
    name: "Risol Spicy Tuna Melt",
    category: "Risol Frozen",
    price: 45000,
    unit: "Pack (5 pcs)",
    description: "Ikan tuna suwir bumbu pedas gurih dipadu dengan keju leleh yang meleleh di setiap gigitan.",
    tag: "Favorit Pedas",
    stock: "Tersedia",
  },
  {
    id: "p4",
    name: "Cendol Coffee Signature",
    category: "Minuman Cendol",
    price: 22000,
    unit: "Cup 350ml",
    description: "Perpaduan cendol pandan kenyal asli dengan espresso robusta pilihan, santan kelapa creamy, dan gula aren legit.",
    tag: "Koleksi Baru",
    stock: "Tersedia",
  },
  {
    id: "p5",
    name: "Cendol Matcha Cup",
    category: "Minuman Cendol",
    price: 24000,
    unit: "Cup 350ml",
    description: "Rasa autentik matcha Uji berpadu manis legit gula aren murni dan tekstur lembut cendol tradisional.",
    tag: "Populer",
    stock: "Tersedia",
  },
  {
    id: "p6",
    name: "Risol Sayur Original Grandma",
    category: "Risol Ready to Eat",
    price: 8000,
    unit: "Pcs",
    description: "Resep legendaris dengan isian wortel manis, kentang dadu, dan seledri harum berbalut kulit renyah.",
    tag: "Klasik",
    stock: "Tersedia",
  },
  {
    id: "p7",
    name: "Hampers Family Gathering Box",
    category: "Paket Box",
    price: 145000,
    unit: "Box (15 pcs)",
    description: "Kombinasi 3 varian rasa terfavorit dalam packaging eksklusif yang rapi, cocok untuk arisan & kado.",
    tag: "Spesial Gift",
    stock: "Tersedia",
  },
  {
    id: "p8",
    name: "Risol Cokelat Lumer Keju",
    category: "Risol Ready to Eat",
    price: 9000,
    unit: "Pcs",
    description: "Sensasi manis legit cokelat Belgian lumer hangat berpadu dengan gurihnya potongan keju cheddar.",
    tag: "Varian Manis",
    stock: "Tersedia",
  },
];

// ─── Testimoni Pelanggan ────────────────────────────────────────────────────────
const TESTIMONIALS: Array<{
  author: string;
  city: string | null;
  role: string | null;
  quote: string;
  rating: number;
  avatarUrl: string | null;
}> = [
  {
    author: "Adelwy Saputri",
    city: "Jakarta Selatan",
    role: "Pelanggan Setia (12x Repeat Order)",
    quote: "Risol Mayo Double Cheese-nya beneran juara! Kulitnya super crispy dan mayonya melimpah gak pelit sama sekali. Buat stok sarapan di rumah selalu order yang frozen.",
    rating: 5,
    avatarUrl: null,
  },
  {
    author: "Bintang Wijaya",
    city: "Tangerang",
    role: "Food Enthusiast",
    quote: "Cendol Coffee-nya unik banget dan nyegerin. Gula arennya harum asli, gak bikin enek. Pas banget buat teman ngemil Risol Beef Mushroom hangat.",
    rating: 5,
    avatarUrl: null,
  },
  {
    author: "Merlin Oktaviana",
    city: "Depok",
    role: "Event Organizer",
    quote: "Kemarin pesan 100 pcs untuk snack box acara kantor, semuanya hangat dan packagingnya sangat rapi berkelas. Fitur tracking statusnya juga sangat membantu!",
    rating: 5,
    avatarUrl: null,
  },
];

// Data Slide Hero Highlight Produk
const HERO_SLIDES = [
  {
    id: "risol-mayo",
    badge: "Highlight Spesial",
    title: "Sensasi Risol Mayo Meleleh",
    titleAccent: "Double Cheese & Smoked Beef",
    description:
      "Dibuat dari bahan-bahan pilihan dengan isian daging asap premium, keju mozarella melimpah, dan racikan saus mayo creamy gurih yang memanjakan lidah di setiap gigitan.",
    image: "/images/backgrounds/hero-risol.jpg",
    rating: "4.9 / 5.0",
    reviewCount: "2.400+ Ulasan",
    salesCount: "18.500+ Pcs Terjual",
    featuredProduct: "Risol Mayo Beef Double Cheese",
    themeColor: "#ff7a00",
  },
  {
    id: "cendol-matcha",
    badge: "Menu Kesegaran Baru",
    title: "Artisan Minuman Cendol &",
    titleAccent: "Matcha Latte Segar Autentik",
    description:
      "Racikan sari pandan suji murni berpadu santan gurih, gula aren organik, dan sensasi creamy dingin menyegarkan — teman sempurna risol hangat Anda.",
    image: "/images/backgrounds/hero-matcha.jpg",
    rating: "5.0 / 5.0",
    reviewCount: "1.850+ Ulasan",
    salesCount: "12.200+ Cup Terjual",
    featuredProduct: "Signature Ice Cendol & Matcha Series",
    themeColor: "#10b981",
  },
];

interface PublicLandingViewProps {
  initialCustomer?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  } | null;
  initialTestimonials?: Array<{
    author: string;
    city: string | null;
    role: string | null;
    quote: string;
    rating: number;
    avatarUrl?: string | null;
  }>;
  initialTheme?: {
    brandName?: string;
    tagline?: string;
    heroTitle?: string;
    heroTitleAccent?: string;
    heroDescription?: string;
    heroImage?: string;
    announcementText?: string | null;
    primaryColor?: string;
    whatsappNumber?: string;
  } | null;
}

export function PublicLandingView({
  initialCustomer,
  initialTestimonials,
  initialTheme,
}: PublicLandingViewProps = {}) {
  // State Hero Carousel
  const [activeSlide, setActiveSlide] = useState(0);

  // State Order Catalog
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderToast, setOrderToast] = useState<string | null>(null);

  // State Tracking Order
  const [trackingInput, setTrackingInput] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<TrackedOrderResult | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Filter Produk
  const filteredProducts = MENU_PRODUCTS.filter((product) => {
    const matchCategory = selectedCategory === "Semua" || product.category === selectedCategory;
    const matchQuery =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  // Handler Tambah ke Pesanan (Simulasi Cart)
  const handleAddToCart = (productName: string) => {
    setOrderToast(`"${productName}" berhasil ditambahkan ke keranjang pesanan!`);
    setTimeout(() => setOrderToast(null), 3500);
  };

  // Handler Tracking Order
  const handleSearchTracking = async (e?: React.FormEvent, customNumber?: string) => {
    if (e) e.preventDefault();
    const query = customNumber ?? trackingInput;

    if (!query.trim()) {
      setTrackError("Silakan masukkan nomor order Anda.");
      return;
    }

    setIsTracking(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await trackOrderAction(query);
      if (res.success && res.data) {
        setTrackResult(res.data);
      } else {
        setTrackError(res.error || "Pesanan tidak ditemukan.");
      }
    } catch {
      setTrackError("Terjadi kesalahan sistem saat melacak pesanan.");
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="public-site">
      {/* ── BANNER PENGUMUMAN / PROMO CMS ── */}
      {initialTheme?.announcementText && (
        <div
          style={{
            background: initialTheme.primaryColor || "#ea580c",
            color: "#ffffff",
            padding: "8px 16px",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.02em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            zIndex: 50,
            position: "relative",
          }}
        >
          <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2} />
          <span>{initialTheme.announcementText}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <PublicHeader initialCustomer={initialCustomer} />

      {/* TOAST NOTIFIKASI */}
      {orderToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1000,
            background: "#0f172a",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: 500,
            border: "1px solid #334155",
          }}
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#00b887" />
          <span>{orderToast}</span>
        </div>
      )}

      {/* ── 1. FULLSCREEN HERO SECTION ── */}
      {(() => {
        const slide = HERO_SLIDES[activeSlide];
        return (
          <section id="hero" className="hero-fullscreen">
            {/* BACKGROUND IMAGES CAROUSEL */}
            <div className="hero-fullscreen__bg-track">
              {HERO_SLIDES.map((s, idx) => (
                <div
                  key={s.id}
                  className={`hero-fullscreen__bg-slide ${idx === activeSlide ? "is-active" : ""}`}
                >
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    priority={idx === 0}
                    className="hero-fullscreen__bg-image"
                    sizes="100vw"
                  />
                </div>
              ))}
            </div>

            {/* DARK LUXURY OVERLAY VIGNETTE */}
            <div className="hero-fullscreen__overlay" />

            {/* HERO CONTENT WRAPPER */}
            <div className="hero-fullscreen__inner">
              <div className="hero-fullscreen__content">
                <span className="hero-badge">
                  <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                  {slide.badge}
                </span>

                <h1>
                  {slide.title}{" "}
                  <span className="highlight">{slide.titleAccent}</span>
                </h1>

                <p className="lead">{slide.description}</p>

                <div className="hero-actions">
                  <a href="#order" className="btn-primary">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={18} strokeWidth={2} />
                    <span>Pesan Sekarang</span>
                  </a>
                  <a href="#tracking" className="btn-secondary">
                    <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={2} />
                    <span>Lacak Pesanan</span>
                  </a>
                </div>

                <div className="hero-features">
                  <div className="hero-features-item">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
                    <span>100% Halal &amp; Higienis</span>
                  </div>
                  <div className="hero-features-item">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
                    <span>Fresh Fried &amp; Frozen Pack</span>
                  </div>
                  <div className="hero-features-item">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
                    <span>Pengiriman Cepat Se-Jabodetabek</span>
                  </div>
                </div>
              </div>

              {/* FLOATING HIGHLIGHT PRODUCT CARD */}
              <div className="hero-fullscreen__visual">
                <div className="hero-card-banner">
                  <span className="banner-tag">Highlight Produk Unggulan</span>
                  <h3>{slide.featuredProduct}</h3>
                  <p>
                    Kelezatan autentik dengan racikan bahan kualitas tertinggi. Disajikan selalu segar untuk momen bersantap terbaik Anda.
                  </p>

                  <div className="banner-stats">
                    <div className="stat-box">
                      <strong>{slide.rating}</strong>
                      <span>{slide.reviewCount}</span>
                    </div>
                    <div className="stat-box">
                      <strong>{slide.salesCount}</strong>
                      <span>Reputasi Konsisten</span>
                    </div>
                  </div>
                </div>

                <div className="floating-badge">
                  <div className="badge-icon">
                    <HugeiconsIcon icon={FireIcon} size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <strong>Sensasi Hangat &amp; Nikmat</strong>
                    <small>Dibuat fresh setiap hari</small>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE NAVIGATION CONTROLS */}
            <div className="hero-fullscreen__controls">
              <div className="hero-fullscreen__dots">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`hero-dot ${idx === activeSlide ? "is-active" : ""}`}
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Slide ${idx + 1}: ${s.featuredProduct}`}
                  >
                    <span className="dot-label">{s.featuredProduct}</span>
                  </button>
                ))}
              </div>

              <div className="hero-fullscreen__arrows">
                <button
                  type="button"
                  className="hero-arrow-btn"
                  onClick={() =>
                    setActiveSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
                  }
                  aria-label="Slide sebelumnya"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="hero-arrow-btn"
                  onClick={() =>
                    setActiveSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1))
                  }
                  aria-label="Slide berikutnya"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2} />
                </button>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── 2. GALLERY SECTION ── */}
      <section id="gallery" className="gallery-section">
        <div className="gallery-section__inner">
          <div className="section-header">
            <span className="section-eyebrow">Galeri Menu Unggulan</span>
            <h2>Kelezatan Terbaik Dari Dapur Kami</h2>
            <p>
              Setiap menu diracik dengan resep istimewa, memadukan cita rasa lokal dengan kualitas penyajian modern yang higienis.
            </p>
          </div>

          <div className="gallery-grid">
            {MENU_PRODUCTS.slice(0, 6).map((item) => (
              <article className="gallery-card" key={item.id}>
                <div className="gallery-card__visual">
                  <span className="product-tag">{item.tag}</span>
                  <div className="product-graphic">
                    <HugeiconsIcon
                      icon={item.category.includes("Cendol") ? SparklesIcon : FireIcon}
                      size={36}
                      strokeWidth={1.8}
                    />
                  </div>
                </div>
                <div className="gallery-card__body">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="card-footer">
                    <span className="price">
                      Rp {item.price.toLocaleString("id-ID")} <small>/ {item.unit}</small>
                    </span>
                    <button
                      type="button"
                      className="order-btn"
                      onClick={() => handleAddToCart(item.name)}
                    >
                      <span>Tambah</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. TESTIMONY SECTION ── */}
      <section id="testimony" className="testimony-section">
        <div className="testimony-section__inner">
          <div className="section-header">
            <span className="section-eyebrow">Ulasan &amp; Cerita Pelanggan</span>
            <h2>Apa Kata Mereka Tentang Baitybites?</h2>
            <p>
              Kepuasan pelanggan adalah inspirasi kami untuk terus menjaga mutu rasa dan kerenyahan terbaik.
            </p>
          </div>

          <div className="testimony-grid">
            {(initialTestimonials && initialTestimonials.length > 0 ? initialTestimonials : TESTIMONIALS).map((t, idx) => (
              <article className="testimony-card" key={idx}>
                <div>
                  <div className="stars">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <HugeiconsIcon key={i} icon={StarIcon} size={16} strokeWidth={2} />
                    ))}
                  </div>
                  <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                </div>

                <div className="author-info">
                  <div className="author-avatar">
                    {t.avatarUrl ? (
                      <Image
                        src={t.avatarUrl}
                        alt={t.author}
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      t.author.charAt(0)
                    )}
                  </div>
                  <div>
                    <strong>{t.author}</strong>
                    <span>
                      {t.city} &bull; {t.role}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. ORDER SECTION (Search & Filter Bar Kategori) ── */}
      <section id="order" className="order-section">
        <div className="order-section__inner">
          <div className="section-header">
            <span className="section-eyebrow">Pemesanan Online</span>
            <h2>Pilih &amp; Pesan Menu Favorit Anda</h2>
            <p>Gunakan filter kategori dan pencarian untuk menemukan menu yang Anda inginkan dengan mudah.</p>
          </div>

          {/* FILTER BAR & SEARCH TOOLBAR */}
          <div className="order-toolbar">
            <div className="search-input-wrap">
              <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={2} />
              <input
                type="search"
                placeholder="Cari risol mayo, cendol, keju, hampers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari produk"
              />
            </div>

            <div className="category-tabs" role="tablist" aria-label="Filter kategori produk">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={selectedCategory === cat ? "is-active" : ""}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* GRID PRODUK */}
          <div className="order-products-grid">
            {filteredProducts.map((p) => (
              <div className="product-item-card" key={p.id}>
                <div>
                  <div className="item-top">
                    <span className="category-badge">{p.category}</span>
                    <span className="stock-status">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} strokeWidth={2} /> {p.stock}
                    </span>
                  </div>
                  <h4>{p.name}</h4>
                  <p className="item-desc">{p.description}</p>
                </div>

                <div className="item-bottom">
                  <div className="item-price">
                    Rp {p.price.toLocaleString("id-ID")} <small>/ {p.unit}</small>
                  </div>
                  <button
                    type="button"
                    className="btn-add-cart"
                    onClick={() => handleAddToCart(p.name)}
                    aria-label={`Pesan ${p.name}`}
                  >
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={14} strokeWidth={2} />
                    <span>Pesan</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="order-empty-state">
                <HugeiconsIcon icon={Search01Icon} size={32} strokeWidth={1.5} color="#94a3b8" />
                <p>Tidak ada menu yang sesuai dengan pencarian &quot;{searchQuery}&quot;.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. TRACKING ORDER SECTION ── */}
      <section id="tracking" className="tracking-section">
        <div className="tracking-section__inner">
          <div className="section-header">
            <span className="section-eyebrow">Status Produksi &amp; Pengiriman</span>
            <h2>Tracking Pesanan Real-Time</h2>
            <p>
              Pantau perjalanan pesanan Anda mulai dari antrian dapur hingga siap dijemput atau dikirim ke lokasi Anda.
            </p>
          </div>

          <div className="tracking-box">
            {/* Input Form */}
            <form className="tracking-form" onSubmit={(e) => handleSearchTracking(e)}>
              <div className="tracking-input-group">
                <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Masukkan Nomor Order (Contoh: #WA-DIR-8908)..."
                  value={trackingInput}
                  onChange={(e) => {
                    setTrackingInput(e.target.value);
                    if (trackError) setTrackError(null);
                  }}
                  required
                />
              </div>
              <button type="submit" className="btn-track" disabled={isTracking}>
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

            {/* Petunjuk Contoh No Order */}
            <div className="tracking-sample-hints">
              Contoh nomor pesanan untuk dicoba:
              <span
                className="hint-btn"
                onClick={() => {
                  setTrackingInput("#WA-DIR-8908");
                  handleSearchTracking(undefined, "#WA-DIR-8908");
                }}
              >
                #WA-DIR-8908
              </span>
              &bull;
              <span
                className="hint-btn"
                onClick={() => {
                  setTrackingInput("#WA-DIR-0230");
                  handleSearchTracking(undefined, "#WA-DIR-0230");
                }}
              >
                #WA-DIR-0230
              </span>
              &bull;
              <span
                className="hint-btn"
                onClick={() => {
                  setTrackingInput("#WA-DIR-3319");
                  handleSearchTracking(undefined, "#WA-DIR-3319");
                }}
              >
                #WA-DIR-3319
              </span>
            </div>

            {/* Error Message */}
            {trackError && (
              <div className="tracking-error">
                <span>⚠️ {trackError}</span>
              </div>
            )}

            {/* Result Box */}
            {trackResult && (
              <div className="tracking-result">
                <div className="tracking-result__header">
                  <div className="order-id-group">
                    <strong>{trackResult.orderRef}</strong>
                    <span>
                      Atas Nama: <strong>{trackResult.customer}</strong> ({trackResult.channel})
                    </span>
                  </div>

                  <span
                    className={`status-pill-lg status--${trackResult.status.toLowerCase()}`}
                  >
                    {trackResult.status === "MENUNGGU" && "Menunggu Antrean Dapur"}
                    {trackResult.status === "DIMASAK" && "Sedang Dimasak di Dapur"}
                    {trackResult.status === "SIAP_PICKUP" && "Siap Pickup / Kirim"}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="tracking-steps">
                  <div
                    className={`step-item ${
                      trackResult.status === "MENUNGGU"
                        ? "is-active"
                        : "is-passed"
                    }`}
                  >
                    <div className="step-num">1</div>
                    <div className="step-text">
                      <strong>Antrean Dapur</strong>
                      <small>Pesanan Diterima</small>
                    </div>
                  </div>

                  <div
                    className={`step-item ${
                      trackResult.status === "DIMASAK"
                        ? "is-active"
                        : trackResult.status === "SIAP_PICKUP"
                        ? "is-passed"
                        : ""
                    }`}
                  >
                    <div className="step-num">2</div>
                    <div className="step-text">
                      <strong>Proses Memasak</strong>
                      <small>
                        {trackResult.cookStartedAt ? "Sedang Dimasak" : "Menunggu Dapur"}
                      </small>
                    </div>
                  </div>

                  <div
                    className={`step-item ${
                      trackResult.status === "SIAP_PICKUP" ? "is-active is-passed" : ""
                    }`}
                  >
                    <div className="step-num">3</div>
                    <div className="step-text">
                      <strong>Siap Pickup</strong>
                      <small>Dikemas &amp; Siap</small>
                    </div>
                  </div>
                </div>

                {/* Rincian Item */}
                <div className="tracking-items">
                  <h5>Daftar Item Pesanan:</h5>
                  <ul>
                    {trackResult.items.map((item, i) => (
                      <li key={i}>
                        <span>{item.name}</span>
                        <strong>{item.qty} pcs</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. FOOTER ── */}
      <PublicFooter />
    </div>
  );
}
