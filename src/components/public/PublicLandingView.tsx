"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, useSyncExternalStore, useTransition } from "react";
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
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CartDrawer } from "@/components/public/CartDrawer";
import { trackOrderAction, type TrackedOrderResult } from "@/app/tracking/actions";
import type { CheckoutItem } from "@/app/actions/checkout";
import { submitTestimoniAction } from "@/app/actions/testimoni";
import "@/components/public/public-site.scss";

const emptySubscribe = () => () => {};

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
  initialGallery?: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    category: string;
  }>;
  initialPendingTestimoni?: {
    id: string;
    author: string;
    role: string | null;
    city: string | null;
    quote: string;
    rating: number;
    avatarUrl: string | null;
    createdAt?: Date;
    isFeatured?: boolean;
  } | null;
}

export function PublicLandingView({
  initialCustomer,
  initialTestimonials,
  initialTheme,
  initialGallery,
  initialPendingTestimoni,
}: PublicLandingViewProps = {}) {
  // ── TESTIMONI FORM & PREVIEW STATE ─────────────────────
  const [pendingTestimoni, setPendingTestimoni] = useState(initialPendingTestimoni ?? null);
  const [testimoniRating, setTestimoniRating] = useState(5);
  const [testimoniHoverRating, setTestimoniHoverRating] = useState(0);
  const [testimoniQuote, setTestimoniQuote] = useState("");
  const [testimoniStatus, setTestimoniStatus] = useState<"idle" | "success" | "error">("idle");
  const [testimoniError, setTestimoniError] = useState<string | null>(null);
  const [isTestimoniPending, startTestimoniTransition] = useTransition();

  const handleSubmitTestimoni = () => {
    setTestimoniError(null);
    startTestimoniTransition(async () => {
      const res = await submitTestimoniAction({ quote: testimoniQuote, rating: testimoniRating });
      if (res.success) {
        setTestimoniStatus("success");
        if (res.data) {
          setPendingTestimoni(res.data);
        } else {
          setPendingTestimoni({
            id: "temp-" + Date.now(),
            author: initialCustomer?.name || "Pelanggan",
            role: "Pelanggan Setia",
            city: "Indonesia",
            quote: testimoniQuote,
            rating: testimoniRating,
            avatarUrl: initialCustomer?.avatarUrl || null,
          });
        }
        setTestimoniQuote("");
        setTestimoniRating(5);
      } else {
        setTestimoniStatus("error");
        setTestimoniError(res.error || "Gagal mengirim ulasan.");
      }
    });
  };

  // State Hero Carousel
  const [activeSlide, setActiveSlide] = useState(0);

  // ── CART STATE (persisted ke localStorage) ──────────────
  const [cartItems, setCartItems] = useState<CheckoutItem[]>([]);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Ambil dari localStorage setelah client mount untuk mencegah hydration mismatch
  useEffect(() => {
    let cancelled = false;
    try {
      const saved = localStorage.getItem("baitybites_cart");
      if (saved) {
        const savedItems = JSON.parse(saved) as CheckoutItem[];
        queueMicrotask(() => {
          if (!cancelled) setCartItems(savedItems);
        });
      }
    } catch {
      // Abaikan jika parse error
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Simpan ke localStorage setiap kali cartItems berubah (hanya setelah mounted)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("baitybites_cart", JSON.stringify(cartItems));
    } catch {
      // Abaikan jika storage penuh
    }
  }, [cartItems, isMounted]);

  // totalCartItems hanya dihitung ketika isMounted bernilai true agar SSR dan First Client Render identik
  const totalCartItems = isMounted ? cartItems.reduce((s, it) => s + it.qty, 0) : 0;

  const handleAddToCart = useCallback((product: { id: string; name: string; price: number; unit?: string; category?: string }) => {
    setCartItems((prev) => {
      const existing = prev.find((x) => x.id === product.id);
      if (existing) {
        return prev.map((x) => x.id === product.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1, unit: product.unit, category: product.category }];
    });
    // Cart drawer hanya dibuka melalui klik tombol cart, bukan saat tambah produk
  }, []);

  const handleUpdateQty = useCallback((id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((x) => x.id === id ? { ...x, qty: x.qty + delta } : x)
        .filter((x) => x.qty > 0)
    );
  }, []);

  const handleUpdateNotes = useCallback((id: string, notes: string) => {
    setCartItems((prev) => prev.map((x) => x.id === id ? { ...x, notes } : x));
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setIsCartOpen(false);
    // Bersihkan localStorage setelah checkout berhasil
    try { localStorage.removeItem("baitybites_cart"); } catch { /* noop */ }
  }, []);

  // ── ORDER CATALOG STATE ────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

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
      <PublicHeader
        initialCustomer={initialCustomer}
        cartCount={totalCartItems}
        onCartOpen={() => setIsCartOpen(true)}
      />

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
            {(initialGallery && initialGallery.length > 0
              ? initialGallery.slice(0, 8)
              : MENU_PRODUCTS.slice(0, 8)
            ).map((item) => {
              const isGalleryItem = "imageUrl" in item;
              const title = isGalleryItem ? item.title : item.name;
              const imgUrl = isGalleryItem ? item.imageUrl : null;
              const categoryLabel = isGalleryItem
                ? (item.category === "PRODUK"
                  ? "Menu & Produk"
                  : item.category === "PROSES_DAPUR"
                    ? "Proses Dapur"
                    : "Event & Hampers")
                : item.tag || item.category;

              return (
                <article className="gallery-card" key={item.id}>
                  <div className="gallery-card__visual">

                    {categoryLabel && <span className="product-tag">{categoryLabel}</span>}
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="product-graphic">
                        <HugeiconsIcon
                          icon={item.category.includes("Cendol") ? SparklesIcon : FireIcon}
                          size={36}
                          strokeWidth={1.8}
                        />
                      </div>
                    )}
                  </div>
                  <div className="gallery-card__body">
                    <div className="gallery-content">
                      <div className="gallery-title">
                        {title}
                      </div>
                      <Link
                        href="/order"
                        className="order-btn"
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                      </Link>

                    </div>
                  </div>
                </article>
              );
            })}
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
            {/* ── PREVIEW TESTIMONI PRIBADI (Hanya terlihat oleh pembuatnya sebelum disetujui moderator) ── */}
            {initialCustomer && pendingTestimoni && (
              <article className="testimony-card testimony-card--pending-preview">
                <div className="pending-badge-wrap">
                  <span className="pending-badge">
                    <HugeiconsIcon icon={Clock01Icon} size={13} strokeWidth={2} />
                    Menunggu Moderasi
                  </span>
                  <span className="pending-hint">Hanya terlihat oleh Anda</span>
                </div>

                <div>
                  <div className="stars">
                    {Array.from({ length: pendingTestimoni.rating }).map((_, i) => (
                      <HugeiconsIcon key={i} icon={StarIcon} size={16} strokeWidth={2} />
                    ))}
                  </div>
                  <blockquote>&ldquo;{pendingTestimoni.quote}&rdquo;</blockquote>
                </div>

                <div className="author-info">
                  <div className="author-avatar">
                    {pendingTestimoni.avatarUrl ? (
                      <Image
                        src={pendingTestimoni.avatarUrl}
                        alt={pendingTestimoni.author}
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      pendingTestimoni.author.charAt(0)
                    )}
                  </div>
                  <div>
                    <strong>{pendingTestimoni.author}</strong>
                    <span>
                      {pendingTestimoni.city || "Indonesia"} &bull; {pendingTestimoni.role || "Pelanggan Setia"}
                    </span>
                  </div>
                </div>
              </article>
            )}

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

          {/* ── FORM TESTIMONI (hanya untuk pelanggan yang sudah login) ── */}
          <div className="testimony-form-wrap">
            {!initialCustomer ? (
              // Guest: tampilkan ajakan login
              <div className="testimony-login-prompt">
                <div className="prompt-icon">⭐</div>
                <div>
                  <strong>Punya pengalaman dengan Baitybites?</strong>
                  <p>Masuk dengan akun Google untuk meninggalkan ulasan dan membantu pelanggan lain.</p>
                </div>
                <a href="/api/auth/google?returnTo=/" className="btn-login-testimony">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Masuk via Google untuk Menulis Ulasan</span>
                </a>
              </div>
            ) : pendingTestimoni ? (
              // Sudah memiliki ulasan yang menunggu moderasi
              <div className="testimony-pending-status-card">
                <div className="status-header">
                  <span className="pending-badge">
                    <HugeiconsIcon icon={Clock01Icon} size={15} strokeWidth={2} />
                    Menunggu Moderasi
                  </span>
                  <span className="status-timestamp">Ulasan Anda sedang ditinjau</span>
                </div>
                <div className="status-body">
                  <strong>Terima kasih atas ulasan Anda, {initialCustomer.name.split(" ")[0]}!</strong>
                  <p>
                    Ulasan Anda telah kami terima dan saat ini sedang dalam proses verifikasi oleh tim moderator Baitybites.
                    Preview ulasan di atas hanya dapat dilihat oleh Anda sampai ulasan disetujui untuk tampil di beranda utama.
                  </p>
                </div>
              </div>
            ) : (
              // Form Testimoni
              <div className="testimony-form">
                <div className="form-header">
                  <div className="author-avatar-sm">
                    {initialCustomer.avatarUrl ? (
                      <Image
                        src={initialCustomer.avatarUrl}
                        alt={initialCustomer.name}
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <span>{initialCustomer.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <strong>Tulis Ulasan Anda</strong>
                    <span>sebagai {initialCustomer.name}</span>
                  </div>
                </div>

                {/* Bintang Rating */}
                <div className="star-rating-input">
                  <span className="rating-label">Rating:</span>
                  <div className="stars-interactive">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${(testimoniHoverRating || testimoniRating) >= star ? "is-active" : ""
                          }`}
                        onClick={() => setTestimoniRating(star)}
                        onMouseEnter={() => setTestimoniHoverRating(star)}
                        onMouseLeave={() => setTestimoniHoverRating(0)}
                        aria-label={`Beri rating ${star} bintang`}
                      >
                        <HugeiconsIcon icon={StarIcon} size={22} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                  <span className="rating-text">
                    {["Buruk", "Cukup", "Baik", "Bagus", "Sempurna!"][(testimoniHoverRating || testimoniRating) - 1]}
                  </span>
                </div>

                {/* Textarea ulasan */}
                <textarea
                  className="testimony-textarea"
                  rows={4}
                  placeholder="Ceritakan pengalaman Anda memesan di Baitybites — rasa, pelayanan, pengiriman, atau apapun yang berkesan..."
                  value={testimoniQuote}
                  onChange={(e) => setTestimoniQuote(e.target.value)}
                  maxLength={500}
                />
                <div className="textarea-meta">
                  <span className="char-count">{testimoniQuote.length} / 500 karakter</span>
                  {testimoniError && <span className="form-error">{testimoniError}</span>}
                </div>

                <button
                  type="button"
                  className="btn-submit-testimony"
                  onClick={handleSubmitTestimoni}
                  disabled={isTestimoniPending || testimoniQuote.trim().length < 10}
                >
                  {isTestimoniPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} size={16} className="spinner-icon" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={StarIcon} size={16} strokeWidth={2} />
                      <span>Kirim Ulasan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. CTA EKSPLORASI MENU & ORDER ONLINE ── */}
      <section className="order-cta-section">
        <div className="order-cta-section__inner">
          <div className="cta-banner-card">
            <div className="cta-content">
              <span className="cta-eyebrow">
                <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2.2} />
                Pemesanan Online Terintegrasi
              </span>
              <h2>Siap Menikmati Risol Mayo Artisan &amp; Cendol Signature?</h2>
              <p>
                Jelajahi seluruh varian menu favorit, pilih ukuran pack atau satuan, dan nikmati pengiriman ekspres dingin terjamin dengan kurir resmi <strong>Paxel Cold-Chain</strong>.
              </p>

              <div className="cta-action-group">
                <Link href="/order" className="btn-cta-primary">
                  <HugeiconsIcon icon={ShoppingBag01Icon} size={18} strokeWidth={2} />
                  <span>Buka Katalog &amp; Pesan Online</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </Link>

                <Link href="/tracking" className="btn-cta-secondary">
                  <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} />
                  <span>Lacak Pesanan Aktif</span>
                </Link>
              </div>
            </div>

            <div className="cta-features">
              <div className="feature-item">
                <span className="feat-icon">❄️</span>
                <div>
                  <strong>Paxel Cold-Chain</strong>
                  <span>Garansi tetap dingin &amp; higienis sampai depan pintu</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feat-icon">⚡</span>
                <div>
                  <strong>Same Day Delivery</strong>
                  <span>Pesan pagi, nikmati hangat/dingin di hari yang sama</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feat-icon">🏪</span>
                <div>
                  <strong>Self Pickup Tersedia</strong>
                  <span>Ambil langsung bebas ongkir di outlet Sawangan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FOOTER ── */}
      <PublicFooter />

      {/* ── FLOATING CART BUTTON ── */}
      {totalCartItems > 0 && !isCartOpen && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Buka keranjang (${totalCartItems} item)`}
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 9000,
            width: "58px",
            height: "58px",
            borderRadius: "50%",
            border: "none",
            background: "linear-gradient(135deg, #ff7a00 0%, #ff9d3a 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 24px rgba(255, 122, 0, 0.45)",
            cursor: "pointer",
            transition: "transform 150ms ease, box-shadow 150ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(255,122,0,0.55)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(255,122,0,0.45)";
          }}
        >
          <HugeiconsIcon icon={ShoppingBag01Icon} size={24} strokeWidth={2} />
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "22px",
              height: "22px",
              padding: "0 5px",
              background: "#fff",
              color: "#ff7a00",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              lineHeight: 1,
            }}
          >
            {totalCartItems}
          </span>
        </button>
      )}

      {/* ── CART DRAWER ── */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onUpdateNotes={handleUpdateNotes}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        customer={initialCustomer ? {
          id: initialCustomer.id,
          name: initialCustomer.name,
          email: initialCustomer.email,
          avatarUrl: initialCustomer.avatarUrl,
        } : null}
        whatsappNumber={initialTheme?.whatsappNumber}
        onTrackOrder={(orderRef) => {
          setIsCartOpen(false);
          setTrackingInput(orderRef);
          handleSearchTracking(undefined, orderRef);
          const el = document.getElementById("tracking");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }}
      />
    </div>
  );
}
