"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  Cancel01Icon,
  ImageAdd01Icon,
  SparklesIcon,
  CheckmarkCircle02Icon,
  PackageIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { generateProductWithAi } from "@/app/products/actions";
import "./add-product-modal.scss";

export interface NewProductData {
  name: string;
  description: string;
  category: string;
  image?: File | null;
  imagePreview?: string | null;
  price: number;
  unit: string;
  initialStock: number;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: NewProductData) => void;
}

const CATEGORIES = [
  "Risol Frozen",
  "Risol Ready to Eat",
  "Minuman Tradisional",
  "Cendol Cup",
  "Paket Hampers & Snack Box",
];

export function AddProductModal({ isOpen, onClose, onSubmit }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [price, setPrice] = useState<number | "">("");
  const [unit, setUnit] = useState("Pack");
  const [initialStock, setInitialStock] = useState<number | "">(20);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAiMagic = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await generateProductWithAi(name.trim() || undefined);

      if (res.success && res.data) {
        setName(res.data.name);
        setDescription(res.data.description);
        setCategory(res.data.category);
        setPrice(res.data.price);
        setUnit(res.data.unit);
        setInitialStock(res.data.initialStock);
      } else {
        setAiError(res.error || "Gagal menghasilkan produk dengan AI.");
      }
    } catch (err: unknown) {
      console.error("Failed to generate with AI:", err);
      setAiError("Terjadi kendala saat menghubungi AI.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      category,
      image: imageFile,
      imagePreview,
      price: Number(price) || 0,
      unit,
      initialStock: Number(initialStock) || 0,
    });
    onClose();
  };

  return (
    <div
      className="product-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="product-modal">
        {/* HEADER */}
        <header className="product-modal__header">
          <div className="product-modal__header-info">
            <div className="product-modal__header-icon">
              <HugeiconsIcon icon={PackageIcon} size={22} strokeWidth={1.8} />
            </div>
            <div className="product-modal__header-text">
              <h2 id="add-product-title">Tambah Produk Baru</h2>
              <p>Isi rincian informasi dan spesifikasi katalog produk Baitybites.</p>
            </div>
          </div>
          <button
            type="button"
            className="product-modal__header-close"
            onClick={onClose}
            aria-label="Tutup form"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </header>

        {/* FORM */}
        <form className="product-modal__form" onSubmit={handleSubmit}>
          <div className="product-modal__body">
            {aiError && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: "12px",
                }}
              >
                ⚠️ {aiError}
              </div>
            )}

            {/* 1. Product Name */}
            <div className="form-group">
              <label htmlFor="product-name">
                <span>
                  Product Name <span className="required">*</span>
                </span>
              </label>
              <input
                id="product-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Ketik ide nama (misal: risol ayam keju) lalu klik AI Magic..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* 2. Description */}
            <div className="form-group">
              <label htmlFor="product-description">
                <span>Description</span>
              </label>
              <textarea
                id="product-description"
                name="description"
                className="form-textarea"
                placeholder="Tuliskan deskripsi lengkap, komposisi, atau panduan penyajian..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* 3. Category */}
            <div className="form-group">
              <label htmlFor="product-category">
                <span>
                  Category <span className="required">*</span>
                </span>
              </label>
              <select
                id="product-category"
                name="category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Product Image (File Upload) */}
            <div className="form-group">
              <label htmlFor="product-image">
                <span>Product Image</span>
              </label>
              <div className="file-dropzone">
                <input
                  ref={fileInputRef}
                  id="product-image"
                  name="image"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="file-dropzone__preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" />
                    <div className="file-dropzone__preview-info">
                      <strong>{imageFile?.name || "Foto produk terlampir"}</strong>
                      <span>
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Siap disimpan"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="file-dropzone__preview-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      title="Hapus foto"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} />
                    </button>
                  </div>
                ) : (
                  <div className="file-dropzone__content">
                    <HugeiconsIcon icon={ImageAdd01Icon} size={28} strokeWidth={1.8} />
                    <strong>Klik atau seret file gambar ke sini</strong>
                    <span>Format: JPG, PNG, atau WebP (maks. 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Stock Details (5. Price, 6. Unit, 7. Initial Stock) */}
            <div className="form-row--triplet">
              {/* 5. Price (Rp) */}
              <div className="form-group">
                <label htmlFor="product-price">
                  <span>
                    Price (Rp) <span className="required">*</span>
                  </span>
                </label>
                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="500"
                  className="form-input"
                  placeholder="35000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                />
              </div>

              {/* 6. Unit */}
              <div className="form-group">
                <label htmlFor="product-unit">
                  <span>
                    Unit <span className="required">*</span>
                  </span>
                </label>
                <input
                  id="product-unit"
                  name="unit"
                  type="text"
                  className="form-input"
                  placeholder="Pack / Pcs / Cup"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              {/* 7. Initial Stock */}
              <div className="form-group">
                <label htmlFor="product-stock">
                  <span>
                    Initial Stock <span className="required">*</span>
                  </span>
                </label>
                <input
                  id="product-stock"
                  name="initialStock"
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={initialStock}
                  onChange={(e) =>
                    setInitialStock(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <footer className="product-modal__footer">
            {/* 8. AI Magic Button */}
            <button
              type="button"
              className="ai-magic-btn"
              onClick={handleAiMagic}
              disabled={isGeneratingAi}
              title="Generate otomatis rincian produk rekomendasi AI"
            >
              <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2} />
              <span>{isGeneratingAi ? "Generating AI..." : "AI Magic"}</span>
            </button>

            <div className="product-modal__footer-group">
              {/* 9. Cancel Button */}
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>

              {/* 10. Save Product (Submit Button) */}
              <button type="submit" className="btn-submit">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                <span>Save Product</span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
