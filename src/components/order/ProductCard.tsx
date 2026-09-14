"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  tag?: string;
  stock: number | string;
  imageUrl?: string | null;
  isHighlighted?: boolean;
}

interface ProductCardProps {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  inCartQty?: number;
}

export function ProductCard({ product, onAddToCart, inCartQty = 0 }: ProductCardProps) {
  const [selectedQty, setSelectedQty] = useState(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  // Cek apakah produk frozen untuk menampilkan icon snowflake
  const isFrozen = product.category.toLowerCase().includes("frozen");
  const isDrink = product.category.toLowerCase().includes("minuman") || product.category.toLowerCase().includes("cendol");

  // Format kategori ringkas untuk badge visual di foto
  const shortCategory = isFrozen
    ? "Risol ❄"
    : isDrink
    ? "Minuman 🥤"
    : product.category.toLowerCase().includes("hampers") || product.category.toLowerCase().includes("box")
    ? "Hampers 🎁"
    : "Risol ✨";

  // Hitung angka stok numerik jika ada
  const stockNum = typeof product.stock === "number" ? product.stock : parseInt(String(product.stock), 10);
  const isOutOfStock = !isNaN(stockNum) && stockNum <= 0;
  const stockDisplay = isOutOfStock
    ? "Habis"
    : typeof product.stock === "number"
    ? `Stok: ${product.stock} ${product.unit}`
    : `Stok: ${product.stock}`;

  const handleIncrement = () => {
    if (!isNaN(stockNum) && selectedQty >= stockNum) return;
    setSelectedQty((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setSelectedQty((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleAdd = () => {
    if (selectedQty <= 0 || isOutOfStock) return;
    onAddToCart(product, selectedQty);
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
    }, 1200);
  };

  return (
    <article className={`bb-product-card ${product.isHighlighted ? "is-highlighted" : ""}`}>
      {/* ── Visual Media & Floating Badge ── */}
      <div className="bb-product-card__visual">
        <span className={`category-tag ${isFrozen ? "is-frozen" : ""}`}>
          {shortCategory}
        </span>

        {product.tag && (
          <span className="promo-badge">
            <HugeiconsIcon icon={SparklesIcon} size={11} strokeWidth={2} />
            {product.tag}
          </span>
        )}

        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="product-image"
          />
        ) : (
          <div className="product-placeholder-graphic">
            <span className="food-emoji">
              {isDrink ? "🥤" : isFrozen ? "🥟❄️" : "🥐"}
            </span>
          </div>
        )}
      </div>

      {/* ── Content Details ── */}
      <div className="bb-product-card__content">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        <p className="product-desc" title={product.description}>
          {product.description}
        </p>

        {/* ── Price & Stock Pill ── */}
        <div className="bb-product-card__meta">
          <div className="product-price">
            <span className="price-val">Rp {product.price.toLocaleString("id-ID")}</span>
            <span className="price-unit">/{product.unit}</span>
          </div>

          <span className={`stock-pill ${isOutOfStock ? "is-empty" : ""}`}>
            {stockDisplay}
          </span>
        </div>

        {/* ── Quantity Stepper & Order / Tambahkan Action ── */}
        <div className="bb-product-card__actions">
          <div className="stepper-wrap">
            <button
              type="button"
              className="stepper-btn"
              onClick={handleDecrement}
              disabled={selectedQty <= 0 || isOutOfStock}
              aria-label={`Kurangi kuantitas ${product.name}`}
            >
              &minus;
            </button>
            <span className="stepper-val">{selectedQty}</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={handleIncrement}
              disabled={isOutOfStock || (!isNaN(stockNum) && selectedQty >= stockNum)}
              aria-label={`Tambah kuantitas ${product.name}`}
            >
              &#43;
            </button>
          </div>

          <button
            type="button"
            className={`btn-order-action ${selectedQty > 0 && !isOutOfStock ? "is-active" : "is-disabled"} ${isAddedFeedback ? "is-success" : ""}`}
            onClick={handleAdd}
            disabled={selectedQty <= 0 || isOutOfStock}
          >
            {isAddedFeedback ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} strokeWidth={2.5} />
                <span>Masuk!</span>
              </>
            ) : selectedQty > 0 ? (
              <span>Tambahkan</span>
            ) : (
              <span>Order</span>
            )}
          </button>
        </div>

        {/* Status di keranjang (jika item sudah ada) */}
        {inCartQty > 0 && (
          <div className="in-cart-indicator">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} strokeWidth={2.2} />
            <span>{inCartQty} {product.unit} telah ada di keranjang</span>
          </div>
        )}
      </div>
    </article>
  );
}
