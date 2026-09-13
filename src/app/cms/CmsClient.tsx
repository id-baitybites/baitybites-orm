"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  ImageAdd01Icon,
  StarIcon,
  PencilEdit02Icon,
  Delete01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Add01Icon,
  Search01Icon,
  SparklesIcon,
  Store01Icon,
  Notification01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type {
  GalleryItemData,
  TestimonialData,
  ThemeSettingData,
} from "./actions";
import {
  createGalleryItemAction,
  updateGalleryItemAction,
  deleteGalleryItemAction,
  toggleGalleryActiveAction,
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialFeaturedAction,
  updateThemeSettingAction,
} from "./actions";
import "./cms.scss";

// ─── Constants ──────────────────────────────────────────────────────────────

const GALLERY_CATEGORIES = [
  { value: "PRODUK", label: "Menu & Produk" },
  { value: "PROSES_DAPUR", label: "Proses Dapur" },
  { value: "EVENT_HAMPERS", label: "Event & Hampers" },
  { value: "TESTIMONI", label: "Foto Testimoni" },
] as const;

interface CmsClientProps {
  initialTheme: ThemeSettingData | null;
  initialGallery: GalleryItemData[];
  initialTestimonials: TestimonialData[];
}

export function CmsClient({
  initialTheme,
  initialGallery,
  initialTestimonials,
}: CmsClientProps) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<"gallery" | "testimonials" | "theme" | "announcements">("gallery");

  // Data states
  const [gallery, setGallery] = useState<GalleryItemData[]>(initialGallery);
  const [testimonials, setTestimonials] = useState<TestimonialData[]>(initialTestimonials);
  const [theme, setTheme] = useState<ThemeSettingData | null>(initialTheme);

  // Filter states - Gallery
  const [galleryCategory, setGalleryCategory] = useState<string>("ALL");
  const [gallerySearch, setGallerySearch] = useState<string>("");
  const [galleryStatus, setGalleryStatus] = useState<"all" | "active" | "inactive">("all");

  // Filter states - Testimonials
  const [testiFilter, setTestiFilter] = useState<"all" | "featured" | "archived">("all");
  const [testiSearch, setTestiSearch] = useState<string>("");

  // Transitions
  const [isPending, startTransition] = useTransition();

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Modals
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItemData | null>(null);
  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);
  const [galleryImagePreview, setGalleryImagePreview] = useState<string>("");
  const [galleryImageBase64, setGalleryImageBase64] = useState<string>("");

  const openAddGalleryModal = () => {
    setEditingGallery(null);
    setGalleryImagePreview("");
    setGalleryImageBase64("");
    setGalleryModalOpen(true);
  };

  const openEditGalleryModal = (item: GalleryItemData) => {
    setEditingGallery(item);
    setGalleryImagePreview(item.imageUrl);
    setGalleryImageBase64("");
    setGalleryModalOpen(true);
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setGalleryImagePreview(result);
        setGalleryImageBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [testiModalOpen, setTestiModalOpen] = useState(false);
  const [editingTesti, setEditingTesti] = useState<TestimonialData | null>(null);
  const [deleteTestiId, setDeleteTestiId] = useState<string | null>(null);

  // Theme Form inputs for live preview
  const [themeForm, setThemeForm] = useState({
    brandName: theme?.brandName || "Baitybites",
    tagline: theme?.tagline || "Bite The Best",
    heroTitle: theme?.heroTitle || "Sensasi Risol Mayo Meleleh",
    heroTitleAccent: theme?.heroTitleAccent || "Double Cheese & Smoked Beef",
    heroDescription: theme?.heroDescription || "Dibuat dari bahan-bahan pilihan dengan isian daging asap premium...",
    heroImage: theme?.heroImage || "/images/backgrounds/hero-risol.jpg",
    primaryColor: theme?.primaryColor || "#F97316",
    accentColor: theme?.accentColor || "#10B981",
    whatsappNumber: theme?.whatsappNumber || "+62 812 8888 2345",
    instagramUrl: theme?.instagramUrl || "https://instagram.com/baitybites.id",
    announcementText: theme?.announcementText || "Nikmati Diskon 20% Pembelian Risol Frozen Khusus Order via WhatsApp!",
    isActive: theme?.isActive ?? true,
  });

  // ─── Filtered Lists ─────────────────────────────────────────────────────────

  const filteredGallery = useMemo(() => {
    return gallery.filter((item) => {
      const matchCat = galleryCategory === "ALL" || item.category === galleryCategory;
      const matchStatus =
        galleryStatus === "all" ||
        (galleryStatus === "active" && item.isActive) ||
        (galleryStatus === "inactive" && !item.isActive);
      const matchSearch =
        !gallerySearch.trim() ||
        item.title.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(gallerySearch.toLowerCase()));
      return matchCat && matchStatus && matchSearch;
    });
  }, [gallery, galleryCategory, galleryStatus, gallerySearch]);

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((t) => {
      const matchStatus =
        testiFilter === "all" ||
        (testiFilter === "featured" && t.isFeatured) ||
        (testiFilter === "archived" && !t.isFeatured);
      const matchSearch =
        !testiSearch.trim() ||
        t.author.toLowerCase().includes(testiSearch.toLowerCase()) ||
        t.quote.toLowerCase().includes(testiSearch.toLowerCase()) ||
        (t.city && t.city.toLowerCase().includes(testiSearch.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [testimonials, testiFilter, testiSearch]);

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const activeGalleryCount = gallery.filter((g) => g.isActive).length;
  const featuredTestiCount = testimonials.filter((t) => t.isFeatured).length;
  const avgRating =
    testimonials.length > 0
      ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
      : "5.0";

  // ─── Handlers: Gallery ──────────────────────────────────────────────────────

  const handleToggleGalleryActive = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleGalleryActiveAction(id, !current);
      if (res.success) {
        setGallery((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: !current } : item))
        );
        showToast("success", `Status foto berhasil diubah ke ${!current ? "Aktif" : "Nonaktif"}.`);
      } else {
        showToast("error", res.error || "Gagal mengubah status.");
      }
    });
  };

  const handleSaveGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      if (editingGallery) {
        const res = await updateGalleryItemAction(editingGallery.id, formData);
        if (res.success && res.data) {
          setGallery((prev) => prev.map((it) => (it.id === editingGallery.id ? res.data! : it)));
          setGalleryModalOpen(false);
          setEditingGallery(null);
          showToast("success", "Foto galeri berhasil diperbarui.");
        } else {
          showToast("error", res.error || "Gagal memperbarui galeri.");
        }
      } else {
        const res = await createGalleryItemAction(formData);
        if (res.success && res.data) {
          setGallery((prev) => [res.data!, ...prev]);
          setGalleryModalOpen(false);
          showToast("success", "Foto baru berhasil ditambahkan ke galeri.");
        } else {
          showToast("error", res.error || "Gagal menambahkan foto galeri.");
        }
      }
    });
  };

  const handleDeleteGallery = (id: string) => {
    startTransition(async () => {
      const res = await deleteGalleryItemAction(id);
      if (res.success) {
        setGallery((prev) => prev.filter((it) => it.id !== id));
        setDeleteGalleryId(null);
        showToast("success", "Foto galeri berhasil dihapus.");
      } else {
        showToast("error", res.error || "Gagal menghapus foto galeri.");
      }
    });
  };

  // ─── Handlers: Testimonials ─────────────────────────────────────────────────

  const handleToggleTestiFeatured = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleTestimonialFeaturedAction(id, !current);
      if (res.success) {
        setTestimonials((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isFeatured: !current } : item))
        );
        showToast(
          "success",
          !current
            ? "Testimoni kini ditampilkan di beranda publik."
            : "Testimoni dinonaktifkan dari beranda."
        );
      } else {
        showToast("error", res.error || "Gagal mengubah status testimoni.");
      }
    });
  };

  const handleSaveTestimonial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      if (editingTesti) {
        const res = await updateTestimonialAction(editingTesti.id, formData);
        if (res.success && res.data) {
          setTestimonials((prev) => prev.map((t) => (t.id === editingTesti.id ? res.data! : t)));
          setTestiModalOpen(false);
          setEditingTesti(null);
          showToast("success", "Ulasan testimoni berhasil diperbarui.");
        } else {
          showToast("error", res.error || "Gagal memperbarui testimoni.");
        }
      } else {
        const res = await createTestimonialAction(formData);
        if (res.success && res.data) {
          setTestimonials((prev) => [res.data!, ...prev]);
          setTestiModalOpen(false);
          showToast("success", "Testimoni baru berhasil ditambahkan.");
        } else {
          showToast("error", res.error || "Gagal menambahkan testimoni.");
        }
      }
    });
  };

  const handleDeleteTestimonial = (id: string) => {
    startTransition(async () => {
      const res = await deleteTestimonialAction(id);
      if (res.success) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        setDeleteTestiId(null);
        showToast("success", "Testimoni berhasil dihapus.");
      } else {
        showToast("error", res.error || "Gagal menghapus testimoni.");
      }
    });
  };

  // ─── Handlers: Theme & Announcements ────────────────────────────────────────

  const handleSaveTheme = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!theme?.id) {
      showToast("error", "Data konfigurasi tema tidak ditemukan di database.");
      return;
    }
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateThemeSettingAction(theme.id, formData);
      if (res.success && res.data) {
        setTheme(res.data);
        showToast("success", "Pengaturan konten web publik berhasil disimpan!");
      } else {
        showToast("error", res.error || "Gagal menyimpan pengaturan web.");
      }
    });
  };

  return (
    <div className="cms-page">
      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`cms-toast cms-toast--${toast.type}`}>
          <HugeiconsIcon
            icon={toast.type === "success" ? CheckmarkCircle02Icon : Cancel01Icon}
            size={18}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="cms-header">
        <div className="cms-header__info">
          <span className="cms-header__eyebrow">BAITYBITES OMS / CONTENT</span>
          <h1 className="cms-header__title">Sistem Manajemen Konten (CMS)</h1>
          <p className="cms-header__desc">
            Pusat kontrol materi visual web publik: kelola foto galeri menu, moderasi testimoni pelanggan, serta sesuaikan teks hero dan banner promosi secara langsung.
          </p>
        </div>
        <div className="cms-header__actions">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            title="Buka beranda web publik di tab baru"
          >
            <span>Lihat Web Publik</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* ── STATS BAR ── */}
      <div className="cms-stats-grid">
        <div className="cms-stat-card">
          <div className="cms-stat-card__icon cms-stat-card__icon--orange">
            <HugeiconsIcon icon={Image01Icon} size={22} strokeWidth={1.8} />
          </div>
          <div className="cms-stat-card__details">
            <span className="cms-stat-card__val">{gallery.length}</span>
            <span className="cms-stat-card__lbl">Total Foto Galeri ({activeGalleryCount} Aktif)</span>
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-card__icon cms-stat-card__icon--green">
            <HugeiconsIcon icon={StarIcon} size={22} strokeWidth={1.8} />
          </div>
          <div className="cms-stat-card__details">
            <span className="cms-stat-card__val">{featuredTestiCount} / {testimonials.length}</span>
            <span className="cms-stat-card__lbl">Testimoni Ditampilkan (Featured)</span>
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-card__icon cms-stat-card__icon--purple">
            <HugeiconsIcon icon={SparklesIcon} size={22} strokeWidth={1.8} />
          </div>
          <div className="cms-stat-card__details">
            <span className="cms-stat-card__val">{avgRating} ★</span>
            <span className="cms-stat-card__lbl">Rata-rata Rating Kepuasan</span>
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-card__icon cms-stat-card__icon--blue">
            <HugeiconsIcon icon={Store01Icon} size={22} strokeWidth={1.8} />
          </div>
          <div className="cms-stat-card__details">
            <span className="cms-stat-card__val">{theme?.brandName || "Baitybites"}</span>
            <span className="cms-stat-card__lbl">Tema Web & Promo Aktif</span>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <nav className="cms-nav-tabs" aria-label="CMS Tabs">
        <button
          type="button"
          className={`cms-tab-btn ${activeTab === "gallery" ? "is-active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <HugeiconsIcon icon={Image01Icon} size={16} strokeWidth={1.8} />
          <span>Galeri Foto & Menu</span>
          <span className="tab-badge has-count">{gallery.length}</span>
        </button>

        <button
          type="button"
          className={`cms-tab-btn ${activeTab === "testimonials" ? "is-active" : ""}`}
          onClick={() => setActiveTab("testimonials")}
        >
          <HugeiconsIcon icon={StarIcon} size={16} strokeWidth={1.8} />
          <span>Moderasi Testimoni</span>
          <span className="tab-badge has-count">{testimonials.length}</span>
        </button>

        <button
          type="button"
          className={`cms-tab-btn ${activeTab === "theme" ? "is-active" : ""}`}
          onClick={() => setActiveTab("theme")}
        >
          <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={1.8} />
          <span>Konten Hero & Tampilan</span>
        </button>

        <button
          type="button"
          className={`cms-tab-btn ${activeTab === "announcements" ? "is-active" : ""}`}
          onClick={() => setActiveTab("announcements")}
        >
          <HugeiconsIcon icon={Notification01Icon} size={16} strokeWidth={1.8} />
          <span>Banner Pengumuman & Promo</span>
        </button>
      </nav>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. TAB: GALERI FOTO                                                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "gallery" && (
        <section className="cms-section" aria-label="Galeri Foto">
          {/* Toolbar */}
          <div className="cms-toolbar">
            <div className="cms-toolbar__filters">
              {/* Category Pills */}
              <button
                type="button"
                className={`cms-toolbar__filter-pill ${galleryCategory === "ALL" ? "is-active" : ""}`}
                onClick={() => setGalleryCategory("ALL")}
              >
                Semua Kategori
              </button>
              {GALLERY_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`cms-toolbar__filter-pill ${galleryCategory === c.value ? "is-active" : ""}`}
                  onClick={() => setGalleryCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}

              {/* Status Filter */}
              <select
                value={galleryStatus}
                onChange={(e) => setGalleryStatus(e.target.value as "all" | "active" | "inactive")}
                className="cms-toolbar__filter-pill"
                style={{ height: "32px", padding: "0 10px", outline: "none" }}
              >
                <option value="all">Semua Status</option>
                <option value="active">Hanya Aktif</option>
                <option value="inactive">Hanya Nonaktif</option>
              </select>
            </div>

            <div className="cms-toolbar__actions">
              <div style={{ position: "relative", width: "220px" }}>
                <input
                  type="text"
                  placeholder="Cari foto..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  style={{
                    height: "36px",
                    width: "100%",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    padding: "0 32px 0 10px",
                    fontSize: "var(--font-size-xs)",
                    background: "var(--color-surface)",
                  }}
                />
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={14}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "11px",
                    color: "var(--color-text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={openAddGalleryModal}
              >
                <HugeiconsIcon icon={ImageAdd01Icon} size={16} strokeWidth={2} />
                <span>Tambah Foto Galeri</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredGallery.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                background: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <HugeiconsIcon icon={Image01Icon} size={40} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Tidak ada foto galeri yang cocok dengan filter.</p>
            </div>
          ) : (
            <div className="gallery-cards-grid">
              {filteredGallery.map((item) => (
                <article className="gallery-admin-card" key={item.id}>
                  <div className="gallery-admin-card__thumb">
                    <Image
                      src={item.imageUrl || "/images/backgrounds/hero-risol.jpg"}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                    <div className="gallery-admin-card__badges">
                      <span className={`tag-category tag-category--${item.category}`}>
                        {GALLERY_CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                      </span>
                      <span className="gallery-admin-card__order-badge" style={{ fontSize: "10px" }}>
                        {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <div className="gallery-admin-card__content">
                    <h3 className="gallery-admin-card__title">{item.title}</h3>
                    {item.description && <p className="gallery-admin-card__desc">{item.description}</p>}

                    <div className="gallery-admin-card__footer">
                      <button
                        type="button"
                        className={`status-pill status-pill--${item.isActive ? "active" : "inactive"}`}
                        onClick={() => handleToggleGalleryActive(item.id, item.isActive)}
                        title="Klik untuk mengubah status aktif"
                        style={{ background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        {item.isActive ? "Aktif di Web" : "Nonaktif"}
                      </button>

                      <div className="gallery-admin-card__actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => openEditGalleryModal(item)}
                          title="Edit Foto Galeri"
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={15} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action btn-icon-action--danger"
                          onClick={() => setDeleteGalleryId(item.id)}
                          title="Hapus Foto"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. TAB: MODERASI TESTIMONI                                               */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "testimonials" && (
        <section className="cms-section" aria-label="Moderasi Testimoni">
          {/* Toolbar */}
          <div className="cms-toolbar">
            <div className="cms-toolbar__filters">
              <button
                type="button"
                className={`cms-toolbar__filter-pill ${testiFilter === "all" ? "is-active" : ""}`}
                onClick={() => setTestiFilter("all")}
              >
                Semua Ulasan ({testimonials.length})
              </button>
              <button
                type="button"
                className={`cms-toolbar__filter-pill ${testiFilter === "featured" ? "is-active" : ""}`}
                onClick={() => setTestiFilter("featured")}
              >
                Ditampilkan di Web ({featuredTestiCount})
              </button>
              <button
                type="button"
                className={`cms-toolbar__filter-pill ${testiFilter === "archived" ? "is-active" : ""}`}
                onClick={() => setTestiFilter("archived")}
              >
                Disimpan / Nonaktif ({testimonials.length - featuredTestiCount})
              </button>
            </div>

            <div className="cms-toolbar__actions">
              <div style={{ position: "relative", width: "220px" }}>
                <input
                  type="text"
                  placeholder="Cari pelanggan / ulasan..."
                  value={testiSearch}
                  onChange={(e) => setTestiSearch(e.target.value)}
                  style={{
                    height: "36px",
                    width: "100%",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    padding: "0 32px 0 10px",
                    fontSize: "var(--font-size-xs)",
                    background: "var(--color-surface)",
                  }}
                />
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={14}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "11px",
                    color: "var(--color-text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditingTesti(null);
                  setTestiModalOpen(true);
                }}
              >
                <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
                <span>Tambah Testimoni</span>
              </button>
            </div>
          </div>

          {/* Testimonials List */}
          {filteredTestimonials.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                background: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <HugeiconsIcon icon={StarIcon} size={40} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Tidak ada ulasan testimoni yang cocok.</p>
            </div>
          ) : (
            <div className="testimonial-list">
              {filteredTestimonials.map((t) => (
                <article
                  key={t.id}
                  className={`testimonial-card ${t.isFeatured ? "is-featured" : ""}`}
                >
                  <div className="testimonial-card__header">
                    <div className="testimonial-card__user">
                      <div className="testimonial-card__avatar">
                        {t.avatarUrl ? (
                          <Image src={t.avatarUrl} alt={t.author} width={42} height={42} />
                        ) : (
                          <span>{t.author.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="testimonial-card__meta">
                        <span className="testimonial-card__name">{t.author}</span>
                        <span className="testimonial-card__subtitle">
                          {t.role || "Pelanggan"} {t.city ? `• ${t.city}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="testimonial-card__rating">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HugeiconsIcon
                          key={i}
                          icon={StarIcon}
                          size={16}
                          strokeWidth={i < t.rating ? 2 : 1}
                          style={{
                            fill: i < t.rating ? "#F59E0B" : "transparent",
                            color: i < t.rating ? "#F59E0B" : "#CBD5E1",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <blockquote className="testimonial-card__quote">
                    "{t.quote}"
                  </blockquote>

                  <div className="testimonial-card__footer">
                    <div className="testimonial-card__status-ctrl">
                      <button
                        type="button"
                        className={`status-pill status-pill--${t.isFeatured ? "active" : "inactive"}`}
                        onClick={() => handleToggleTestiFeatured(t.id, t.isFeatured)}
                        title="Klik untuk mengubah moderasi tampil di web"
                        style={{ background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        {t.isFeatured ? "✓ Ditampilkan di Beranda" : "Disimpan (Draft)"}
                      </button>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        Urutan Tampil: #{t.displayOrder}
                      </span>
                    </div>

                    <div className="gallery-admin-card__actions">
                      <button
                        type="button"
                        className="btn-icon-action"
                        onClick={() => {
                          setEditingTesti(t);
                          setTestiModalOpen(true);
                        }}
                        title="Edit Ulasan"
                      >
                        <HugeiconsIcon icon={PencilEdit02Icon} size={15} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action btn-icon-action--danger"
                        onClick={() => setDeleteTestiId(t.id)}
                        title="Hapus Testimoni"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. TAB: KONTEN HERO & TAMPILAN                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "theme" && (
        <form onSubmit={handleSaveTheme} className="theme-form-container">
          {/* Live Preview Card */}
          <div className="settings-card-section">
            <div className="settings-card-section__header">
              <h3>Live Preview Hero Web Publik</h3>
              <p>Pratinjau tampilan banner utama yang langsung dilihat pengunjung ketika membuka beranda Baitybites.</p>
            </div>

            <div className="hero-preview-box">
              <span className="hero-preview-box__eyebrow">{themeForm.tagline}</span>
              <h2 className="hero-preview-box__title">
                {themeForm.heroTitle} <span>{themeForm.heroTitleAccent}</span>
              </h2>
              <p className="hero-preview-box__desc">{themeForm.heroDescription}</p>
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", background: themeForm.primaryColor, color: "#fff", padding: "4px 12px", borderRadius: "var(--radius-md)", fontWeight: 600 }}>
                  Tombol Pesan (WhatsApp)
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Tautan WA: {themeForm.whatsappNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Identitas & Teks Hero */}
          <div className="settings-card-section">
            <div className="settings-card-section__header">
              <h3>Teks Hero & Identitas Brand</h3>
              <p>Atur nama brand, tagline, serta judul dan deskripsi di banner utama beranda.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brandName">Nama Brand</label>
                <input
                  id="brandName"
                  name="brandName"
                  type="text"
                  value={themeForm.brandName}
                  onChange={(e) => setThemeForm({ ...themeForm, brandName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tagline">Tagline / Eyebrow Banner</label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  value={themeForm.tagline}
                  onChange={(e) => setThemeForm({ ...themeForm, tagline: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="heroTitle">Judul Utama Hero</label>
                <input
                  id="heroTitle"
                  name="heroTitle"
                  type="text"
                  value={themeForm.heroTitle}
                  onChange={(e) => setThemeForm({ ...themeForm, heroTitle: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="heroTitleAccent">Aksen Judul (Warna Terang)</label>
                <input
                  id="heroTitleAccent"
                  name="heroTitleAccent"
                  type="text"
                  value={themeForm.heroTitleAccent}
                  onChange={(e) => setThemeForm({ ...themeForm, heroTitleAccent: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="heroDescription">Deskripsi Hero</label>
              <textarea
                id="heroDescription"
                name="heroDescription"
                value={themeForm.heroDescription}
                onChange={(e) => setThemeForm({ ...themeForm, heroDescription: e.target.value })}
                required
              />
              <span className="form-help">Jelaskan keistimewaan risol atau produk unggulan Anda dalam 2-3 kalimat menarik.</span>
            </div>

            <div className="form-group">
              <label htmlFor="heroImage">URL Gambar Latar Hero</label>
              <input
                id="heroImage"
                name="heroImage"
                type="text"
                value={themeForm.heroImage}
                onChange={(e) => setThemeForm({ ...themeForm, heroImage: e.target.value })}
                required
              />
              <span className="form-help">Pilihan gambar lokal: <code>/images/backgrounds/hero-risol.jpg</code> atau <code>/images/backgrounds/hero-matcha.jpg</code></span>
            </div>
          </div>

          {/* Section: Kontak & Aksen Brand */}
          <div className="settings-card-section">
            <div className="settings-card-section__header">
              <h3>Kontak & Warna Aksen</h3>
              <p>Pengaturan nomor WhatsApp pemesanan dan akun Instagram resmi.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="whatsappNumber">Nomor WhatsApp Pemesanan</label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="text"
                  value={themeForm.whatsappNumber}
                  onChange={(e) => setThemeForm({ ...themeForm, whatsappNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="instagramUrl">URL Instagram</label>
                <input
                  id="instagramUrl"
                  name="instagramUrl"
                  type="url"
                  value={themeForm.instagramUrl}
                  onChange={(e) => setThemeForm({ ...themeForm, instagramUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="primaryColor">Warna Brand Primer</label>
                <div className="color-input-wrapper">
                  <input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    value={themeForm.primaryColor}
                    onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                  />
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{themeForm.primaryColor}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="accentColor">Warna Brand Sekunder / Aksen</label>
                <div className="color-input-wrapper">
                  <input
                    id="accentColor"
                    name="accentColor"
                    type="color"
                    value={themeForm.accentColor}
                    onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                  />
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{themeForm.accentColor}</span>
                </div>
              </div>
            </div>

            <input type="hidden" name="isActive" value="true" />
            <input type="hidden" name="announcementText" value={themeForm.announcementText} />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button type="submit" className="btn-primary" disabled={isPending}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                <span>{isPending ? "Menyimpan Perubahan..." : "Simpan Pengaturan Konten Web"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 4. TAB: BANNER PENGUMUMAN & PROMO                                        */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "announcements" && (
        <form onSubmit={handleSaveTheme} className="theme-form-container">
          <div className="settings-card-section">
            <div className="settings-card-section__header">
              <h3>Banner Promosi Berjalan (Announcement Bar)</h3>
              <p>Teks pengumuman yang muncul di baris paling atas halaman web untuk menginfokan promo, voucher, atau jadwal buka.</p>
            </div>

            {/* Live Preview */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "6px" }}>
                PRATINJAU BANNER WEB:
              </span>
              <div className="announcement-banner-preview" style={{ background: themeForm.primaryColor }}>
                <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} />
                <span>{themeForm.announcementText || "Tuliskan teks promo di bawah..."}</span>
              </div>
            </div>

            {/* Preset selector */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", display: "block", marginBottom: "8px" }}>
                Gunakan Template Cepat Promo:
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  "Nikmati Diskon 20% Pembelian Risol Frozen Khusus Order via WhatsApp!",
                  "🎉 Pre-Order Hampers Idul Fitri / Liburan Dibuka! Kuota Terbatas.",
                  "✨ Gratis Ongkir Sameday untuk Pesanan Minimal Rp 75.000 Hari Ini!",
                  "🔥 Risol Mayo Double Cheese Ready to Eat Fresh Digoreng Tiap Pukul 14.00",
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="cms-toolbar__filter-pill"
                    onClick={() => setThemeForm({ ...themeForm, announcementText: txt })}
                  >
                    Template #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="announcementText">Isi Pesan Promosi</label>
              <textarea
                id="announcementText"
                name="announcementText"
                value={themeForm.announcementText}
                onChange={(e) => setThemeForm({ ...themeForm, announcementText: e.target.value })}
                placeholder="Tuliskan promo yang sedang berjalan..."
                rows={3}
                required
              />
            </div>

            {/* Hidden inputs to preserve other theme settings */}
            <input type="hidden" name="brandName" value={themeForm.brandName} />
            <input type="hidden" name="tagline" value={themeForm.tagline} />
            <input type="hidden" name="heroTitle" value={themeForm.heroTitle} />
            <input type="hidden" name="heroTitleAccent" value={themeForm.heroTitleAccent} />
            <input type="hidden" name="heroDescription" value={themeForm.heroDescription} />
            <input type="hidden" name="heroImage" value={themeForm.heroImage} />
            <input type="hidden" name="primaryColor" value={themeForm.primaryColor} />
            <input type="hidden" name="accentColor" value={themeForm.accentColor} />
            <input type="hidden" name="whatsappNumber" value={themeForm.whatsappNumber} />
            <input type="hidden" name="instagramUrl" value={themeForm.instagramUrl} />
            <input type="hidden" name="isActive" value="true" />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button type="submit" className="btn-primary" disabled={isPending}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                <span>{isPending ? "Menyimpan..." : "Publikasikan Banner Promo"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: TAMBAH / EDIT GALERI                                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {galleryModalOpen && (
        <div className="cms-modal-backdrop" onClick={() => setGalleryModalOpen(false)}>
          <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal__header">
              <h3>{editingGallery ? "Edit Foto Galeri" : "Tambah Foto Galeri Baru"}</h3>
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => setGalleryModalOpen(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSaveGallery}>
              <div className="cms-modal__body">
                <div className="form-group">
                  <label htmlFor="galTitle">Judul Foto / Menu</label>
                  <input
                    id="galTitle"
                    name="title"
                    type="text"
                    defaultValue={editingGallery?.title || ""}
                    placeholder="Contoh: Risol Mayo Melted Double Cheese"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="galCategory">Kategori Galeri</label>
                  <select
                    id="galCategory"
                    name="category"
                    defaultValue={editingGallery?.category || "PRODUK"}
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unggah Berkas Foto (Penyimpanan Cloudinary: Folder Gallery)</label>
                  <div
                    style={{
                      border: "2px dashed var(--color-border, #cbd5e1)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "var(--color-surface-hover, #f8fafc)",
                      position: "relative",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="file"
                      name="imageFile"
                      accept="image/*"
                      onChange={handleGalleryFileChange}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <HugeiconsIcon icon={ImageAdd01Icon} size={28} style={{ color: "var(--color-primary)" }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
                        Klik atau pilih file gambar foto
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
                        Format PNG, JPG, JPEG, WEBP • Disimpan di folder <strong>Gallery</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {galleryImagePreview && (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "170px",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      border: "1px solid var(--color-border, #e2e8f0)",
                      background: "#f1f5f9",
                    }}
                  >
                    <Image
                      src={galleryImagePreview}
                      alt="Preview Galeri"
                      fill
                      sizes="500px"
                      style={{ objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        background: "rgba(15, 23, 42, 0.85)",
                        backdropFilter: "blur(4px)",
                        color: "#34d399",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>Preview Foto Galeri</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryImagePreview("");
                        setGalleryImageBase64("");
                      }}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(15, 23, 42, 0.75)",
                        border: "none",
                        color: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}

                <input type="hidden" name="imageBase64" value={galleryImageBase64} />

                <div className="form-group">
                  <label htmlFor="galImage">Atau Masukkan Tautan / URL Gambar</label>
                  <input
                    id="galImage"
                    name="imageUrl"
                    type="text"
                    defaultValue={editingGallery?.imageUrl || ""}
                    placeholder="https://res.cloudinary.com/... atau tautan gambar"
                    onChange={(e) => {
                      if (!galleryImageBase64) {
                        setGalleryImagePreview(e.target.value);
                      }
                    }}
                  />
                  <span className="form-help">
                    Jika memasukkan tautan gambar eksternal, sistem akan otomatis mengunggahnya ke Cloudinary di folder <strong>Gallery</strong>.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="galDesc">Deskripsi Singkat (Opsional)</label>
                  <textarea
                    id="galDesc"
                    name="description"
                    defaultValue={editingGallery?.description || ""}
                    placeholder="Keterangan foto atau bahan..."
                    rows={2}
                  />
                </div>

                <div className="form-group" style={{ marginTop: "6px" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      value="true"
                      defaultChecked={editingGallery ? editingGallery.isActive : true}
                      style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
                    />
                    <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
                      Publikasikan Foto (Aktif di Website)
                    </span>
                  </label>
                  <span className="form-help" style={{ marginTop: "4px" }}>
                    Foto akan otomatis ditampilkan di awal galeri website publik secara FIFO (foto terbaru selalu di depan).
                  </span>
                </div>
              </div>

              <div className="cms-modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setGalleryModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                  <span>{isPending ? "Menyimpan..." : "Simpan Foto"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: TAMBAH / EDIT TESTIMONI                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {testiModalOpen && (
        <div className="cms-modal-backdrop" onClick={() => setTestiModalOpen(false)}>
          <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal__header">
              <h3>{editingTesti ? "Edit Ulasan Testimoni" : "Tambah Testimoni Baru"}</h3>
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => setTestiModalOpen(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial}>
              <div className="cms-modal__body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="testiAuthor">Nama Pelanggan</label>
                    <input
                      id="testiAuthor"
                      name="author"
                      type="text"
                      defaultValue={editingTesti?.author || ""}
                      placeholder="Contoh: Adelwy Saputri"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="testiCity">Kota / Domisili</label>
                    <input
                      id="testiCity"
                      name="city"
                      type="text"
                      defaultValue={editingTesti?.city || "Jakarta"}
                      placeholder="Contoh: Jakarta Selatan"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="testiRole">Label / Peran Pelanggan</label>
                    <input
                      id="testiRole"
                      name="role"
                      type="text"
                      defaultValue={editingTesti?.role || "Pelanggan Setia"}
                      placeholder="Contoh: Food Enthusiast / 10x Repeat Order"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="testiRating">Rating (Bintang)</label>
                    <select
                      id="testiRating"
                      name="rating"
                      defaultValue={editingTesti?.rating || 5}
                    >
                      <option value="5">5 Bintang — Sangat Puas (Sempurna)</option>
                      <option value="4">4 Bintang — Puas</option>
                      <option value="3">3 Bintang — Cukup</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="testiQuote">Isi Ulasan / Kutipan</label>
                  <textarea
                    id="testiQuote"
                    name="quote"
                    defaultValue={editingTesti?.quote || ""}
                    placeholder="Tuliskan pengalaman pelanggan menikmati menu Baitybites..."
                    rows={3}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="testiOrder">Urutan Tampilan</label>
                    <input
                      id="testiOrder"
                      name="displayOrder"
                      type="number"
                      defaultValue={editingTesti?.displayOrder ?? 1}
                      min={0}
                    />
                  </div>

                  <div className="form-group" style={{ justifyContent: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "18px" }}>
                      <input
                        type="checkbox"
                        name="isFeatured"
                        value="true"
                        defaultChecked={editingTesti ? editingTesti.isFeatured : true}
                        style={{ width: "18px", height: "18px" }}
                      />
                      <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 500 }}>
                        Tampilkan di Beranda Publik (Featured)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="cms-modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTestiModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  <span>{isPending ? "Menyimpan..." : "Simpan Testimoni"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: KONFIRMASI HAPUS GALERI                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {deleteGalleryId && (
        <div className="cms-modal-backdrop" onClick={() => setDeleteGalleryId(null)}>
          <div className="cms-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal__header">
              <h3 style={{ color: "#dc2626" }}>Hapus Foto Galeri?</h3>
              <button type="button" className="btn-icon-action" onClick={() => setDeleteGalleryId(null)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="cms-modal__body">
              <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus foto galeri ini? Foto yang dihapus tidak akan lagi muncul di website publik.
              </p>
            </div>
            <div className="cms-modal__footer">
              <button type="button" className="btn-secondary" onClick={() => setDeleteGalleryId(null)}>
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#dc2626" }}
                disabled={isPending}
                onClick={() => handleDeleteGallery(deleteGalleryId)}
              >
                <span>{isPending ? "Menghapus..." : "Ya, Hapus"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: KONFIRMASI HAPUS TESTIMONI                                        */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {deleteTestiId && (
        <div className="cms-modal-backdrop" onClick={() => setDeleteTestiId(null)}>
          <div className="cms-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal__header">
              <h3 style={{ color: "#dc2626" }}>Hapus Testimoni?</h3>
              <button type="button" className="btn-icon-action" onClick={() => setDeleteTestiId(null)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="cms-modal__body">
              <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus ulasan testimoni pelanggan ini?
              </p>
            </div>
            <div className="cms-modal__footer">
              <button type="button" className="btn-secondary" onClick={() => setDeleteTestiId(null)}>
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#dc2626" }}
                disabled={isPending}
                onClick={() => handleDeleteTestimonial(deleteTestiId)}
              >
                <span>{isPending ? "Menghapus..." : "Ya, Hapus"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
