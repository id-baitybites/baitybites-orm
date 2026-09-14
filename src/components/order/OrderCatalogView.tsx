"use client";

import { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  SparklesIcon,
  FireIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CartDrawer } from "@/components/public/CartDrawer";
import { ProductCard, type CatalogProduct } from "./ProductCard";
import type { CheckoutItem } from "@/app/actions/checkout";
import "@/components/public/public-site.scss";
import "./order-catalog.scss";

const emptySubscribe = () => () => {};

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface OrderCatalogViewProps {
  initialCustomer?: CustomerInfo | null;
  products?: CatalogProduct[];
}

export function OrderCatalogView({ initialCustomer, products = [] }: OrderCatalogViewProps) {
  // State Cart Persisten dengan proteksi Hydration
  const [cartItems, setCartItems] = useState<CheckoutItem[]>([]);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // State Search & Category Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // State Carousel Highlight
  const [activeHighlightSlide, setActiveHighlightSlide] = useState(0);
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");
  const [carouselAddedId, setCarouselAddedId] = useState<string | null>(null);

  // Mount effect
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
      // ignore
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("baitybites_cart", JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems, isMounted]);

  // Daftar kategori dinamis
  const categories = useMemo(() => {
    const list = ["Semua"];
    products.forEach((p) => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [products]);

  // Section 1: Produk Highlight / Best Seller
  const highlightedProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.isHighlighted ||
        p.tag?.toLowerCase().includes("best") ||
        p.tag?.toLowerCase().includes("special") ||
        p.tag?.toLowerCase().includes("gift")
    );
  }, [products]);

  // Auto-slide carousel highlight jika ada lebih dari 1 slide
  useEffect(() => {
    if (highlightedProducts.length <= 1) return;
    const interval = setInterval(() => {
      setSlideDir("next");
      setActiveHighlightSlide((prev) => (prev + 1) % highlightedProducts.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [highlightedProducts.length]);

  // Section 3: Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "Semua" || p.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handler add to cart
  const handleAddToCart = (product: CatalogProduct, qty: number) => {
    setCartItems((prev) => {
      const existing = prev.find((x) => x.id === product.id);
      if (existing) {
        return prev.map((x) => (x.id === product.id ? { ...x, qty: x.qty + qty } : x));
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          qty,
          unit: product.unit,
          category: product.category,
        },
      ];
    });
  };

  const handleCarouselQuickAdd = (product: CatalogProduct) => {
    handleAddToCart(product, 1);
    setCarouselAddedId(product.id);
    setTimeout(() => {
      setCarouselAddedId(null);
    }, 1200);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCartItems((prev) => prev.map((x) => (x.id === id ? { ...x, notes } : x)));
  };

  const totalCartCount = isMounted ? cartItems.reduce((acc, it) => acc + it.qty, 0) : 0;

  const currentPromo = highlightedProducts[activeHighlightSlide] || highlightedProducts[0];

  return (
    <div className="order-catalog-page">
      {/* ── Public Header ── */}
      <PublicHeader
        initialCustomer={initialCustomer}
        cartCount={totalCartCount}
        onCartOpen={() => setIsCartOpen(true)}
      />

      {/* ── SECTION 1: CAROUSEL PRODUK HIGHLIGHT & PROMO SPESIAL ── */}
      {highlightedProducts.length > 0 && currentPromo && (
        <section className="catalog-highlight-section">
          <div className="catalog-highlight-section__inner">
            <div className="highlight-header">
              <div>
                <span className="eyebrow-pill">
                  <HugeiconsIcon icon={FireIcon} size={14} strokeWidth={2.2} />
                  Pilihan Paling Digemari
                </span>
                <h1>Highlight &amp; Promo Spesial</h1>
                <p>
                  Nikmati koleksi rasa istimewa dengan jaminan mutu rasa segar, packaging higienis, dan pengiriman Paxel Cold-Chain.
                </p>
              </div>

              <div className="highlight-controls-top">
                <div className="highlight-badge-accent">
                  <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} />
                  <span>Garansi Dingin Paxel Cold-Chain</span>
                </div>

                <div className="carousel-nav-arrows">
                  <button
                    type="button"
                    className="arrow-btn"
                    onClick={() => {
                      setSlideDir("prev");
                      setActiveHighlightSlide((prev) =>
                        prev === 0 ? highlightedProducts.length - 1 : prev - 1
                      );
                    }}
                    aria-label="Promo sebelumnya"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    className="arrow-btn"
                    onClick={() => {
                      setSlideDir("next");
                      setActiveHighlightSlide((prev) => (prev + 1) % highlightedProducts.length);
                    }}
                    aria-label="Promo berikutnya"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── CAROUSEL BANNER HERO CARD ── */}
            <div className="highlight-carousel-container">
              <div className="carousel-slide-card" key={activeHighlightSlide}>
                {/* Visual Image */}
                <div className="slide-media">
                  {currentPromo.imageUrl ? (
                    <Image
                      src={currentPromo.imageUrl}
                      alt={currentPromo.name}
                      fill
                      sizes="(max-width: 960px) 100vw, 50vw"
                      className="slide-img"
                      priority
                    />
                  ) : (
                    <div className="slide-placeholder-art">
                      <span className="art-emoji">
                        {currentPromo.category.includes("Cendol")
                          ? "🥤"
                          : currentPromo.category.includes("Hampers")
                          ? "🎁"
                          : "🥟❄️"}
                      </span>
                    </div>
                  )}

                  <div className="slide-tag-group">
                    <span className="category-pill">{currentPromo.category}</span>
                    {currentPromo.tag && (
                      <span className="promo-pill">
                        <HugeiconsIcon icon={StarIcon} size={12} strokeWidth={2} />
                        {currentPromo.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info & Action Body */}
                <div className="slide-body">
                  <div className="slide-badge-row">
                    <span className="badge-official">Official Highlight</span>
                    <span className="stock-info">
                      Stok: <strong>{currentPromo.stock} {currentPromo.unit}</strong>
                    </span>
                  </div>

                  <h2 className="slide-title">{currentPromo.name}</h2>
                  <p className="slide-description">{currentPromo.description}</p>

                  <div className="slide-price-row">
                    <div className="price-tag">
                      <span className="currency">Rp</span>
                      <span className="amount">{currentPromo.price.toLocaleString("id-ID")}</span>
                      <span className="unit">/{currentPromo.unit}</span>
                    </div>

                    <button
                      type="button"
                      className={`btn-slide-order ${carouselAddedId === currentPromo.id ? "is-added" : ""}`}
                      onClick={() => handleCarouselQuickAdd(currentPromo)}
                    >
                      {carouselAddedId === currentPromo.id ? (
                        <>
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2.5} />
                          <span>Berhasil Masuk Keranjang!</span>
                        </>
                      ) : (
                        <>
                          <span>Pesan Langsung</span>
                          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.2} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Autoplay Progress Bar */}
              {highlightedProducts.length > 1 && (
                <div className="carousel-progress">
                  <div className="carousel-progress__bar" key={activeHighlightSlide} />
                </div>
              )}

              {/* Carousel Indicators */}
              <div className="carousel-indicators">
                {highlightedProducts.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`indicator-pill ${idx === activeHighlightSlide ? "is-active" : ""}`}
                    onClick={() => {
                      setSlideDir(idx > activeHighlightSlide ? "next" : "prev");
                      setActiveHighlightSlide(idx);
                    }}
                    aria-label={`Slide ke ${idx + 1}: ${p.name}`}
                  >
                    <span className="indicator-title">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 2: FILTER DAN SEARCH BAR ── */}
      <section className="catalog-toolbar-section">
        <div className="catalog-toolbar-section__inner">
          <div className="search-input-wrap">
            <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={2} />
            <input
              type="search"
              placeholder="Cari risol mayo, beef mushroom, cendol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari produk di katalog"
            />
          </div>

          <div className="category-tabs" role="tablist" aria-label="Filter kategori">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`tab-btn ${selectedCategory === cat ? "is-active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: GRID PRODUK LENGKAP ── */}
      <section className="catalog-products-section">
        <div className="catalog-products-section__inner">
          <div className="section-meta-bar">
            <span>
              Menampilkan <strong>{filteredProducts.length}</strong> menu{" "}
              {selectedCategory !== "Semua" && `kategori ${selectedCategory}`}
            </span>
            {searchQuery && (
              <span>
                Pencarian: &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="catalog-products-grid">
              {filteredProducts.map((p) => {
                const inCart = cartItems.find((x) => x.id === p.id)?.qty || 0;
                return (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    inCartQty={inCart}
                  />
                );
              })}
            </div>
          ) : (
            <div className="catalog-empty-state">
              <HugeiconsIcon icon={Search01Icon} size={36} strokeWidth={1.5} color="#94a3b8" />
              <h4>Tidak ada menu yang cocok</h4>
              <p>Coba gunakan kata kunci pencarian lain atau pilih kategori &quot;Semua&quot;.</p>
              {(searchQuery || selectedCategory !== "Semua") && (
                <button
                  type="button"
                  className="btn-reset-filter"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Semua");
                  }}
                >
                  Reset Pencarian &amp; Filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Public Footer ── */}
      <PublicFooter />

      {/* ── Cart Drawer (Paxel Cold-Chain Checkout) ── */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onUpdateNotes={handleUpdateNotes}
        onRemoveItem={(id) => setCartItems((prev) => prev.filter((x) => x.id !== id))}
        onClearCart={() => setCartItems([])}
        customer={initialCustomer ? {
          id: initialCustomer.id,
          name: initialCustomer.name,
          email: initialCustomer.email,
          avatarUrl: initialCustomer.avatarUrl,
        } : null}
        onTrackOrder={(orderRef) => {
          window.location.href = `/tracking?ref=${encodeURIComponent(orderRef)}`;
        }}
      />
    </div>
  );
}
