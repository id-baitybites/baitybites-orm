"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldKeyIcon,
  Store01Icon,
  Package01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Loading03Icon,
  AlertDiamondIcon,
  SparklesIcon,
  LockPasswordIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { executeOnboarding, type OnboardingPayload } from "./actions";
import "./onboarding.scss";

const STEPS = [
  { id: 1, label: "Super Admin", icon: ShieldKeyIcon },
  { id: 2, label: "Brand Identity", icon: Store01Icon },
  { id: 3, label: "Desain & Warna", icon: SparklesIcon },
  { id: 4, label: "Katalog & Luncurkan", icon: Package01Icon },
];

export default function OnboardingClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OnboardingPayload>({
    // Step 1: Admin
    adminUsername: "",
    adminDisplayName: "",
    adminPassword: "",
    adminPin: "",

    // Step 2: Brand
    brandName: "",
    tagline: "Bite The Best",
    heroTitle: "Sensasi Kuliner Pilihan Terbaik",
    heroTitleAccent: "Spesial Untuk Anda",
    heroDescription:
      "Dibuat dengan bahan baku berkualitas premium, rasa autentik, dan penyajian istimewa yang siap memanjakan selera Anda.",
    whatsappNumber: "+62 812 0000 0000",
    instagramUrl: "https://instagram.com/mybrand",

    // Step 3: Colors
    primaryColor: "#ff7a00",
    accentColor: "#10b981",

    // Step 4: Mode
    sampleDataMode: "clean",
  });

  const nextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.adminUsername.trim() || !formData.adminPassword.trim()) {
        setError("Username dan password Super Admin wajib diisi.");
        return;
      }
      if (formData.adminPin.trim().length !== 4) {
        setError("Security PIN wajib 4 digit angka (misal: 1234).");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.brandName.trim()) {
        setError("Nama Brand wajib diisi.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await executeOnboarding(formData);
      if (result.success) {
        router.push("/dashboard?onboarded=true");
      } else {
        setError(result.error || "Gagal menyelesaikan onboarding.");
      }
    });
  };

  return (
    <div className="onboarding-layout">
      {/* Top Header */}
      <header className="onboarding-layout__header">
        <div className="onboarding-layout__header-brand">
          <span>Brand Setup Wizard</span>
          <span className="badge">Exclusive Instance</span>
        </div>
        <div className="onboarding-layout__header-badge">
          <HugeiconsIcon icon={LockPasswordIcon} size={14} />
          <span>Inisialisasi Sistem Baru</span>
        </div>
      </header>

      <main className="onboarding-layout__content">
        {/* Stepper Progress Bar */}
        <div className="onboarding-stepper">
          <div className="onboarding-stepper__line">
            <div
              className="onboarding-stepper__line-fill"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`onboarding-stepper__item ${
                  isActive ? "is-active" : ""
                } ${isCompleted ? "is-completed" : ""}`}
              >
                <div className="onboarding-stepper__item-circle">
                  {isCompleted ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="onboarding-stepper__item-label">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <HugeiconsIcon icon={AlertDiamondIcon} size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="onboarding-card">
          {/* STEP 1: SUPER ADMIN */}
          {currentStep === 1 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={ShieldKeyIcon} size={24} />
                </div>
                <div>
                  <h1>1. Akun Super Admin &amp; Security PIN</h1>
                  <p>
                    Kredensial tertinggi untuk mengelola seluruh operasional,
                    keuangan, pesanan, dan pengaturan sistem Anda.
                  </p>
                </div>
              </div>

              <div className="onboarding-card__grid">
                <div className="onboarding-card__field">
                  <label htmlFor="adm-username">
                    Username Super Admin <span className="required">*</span>
                  </label>
                  <input
                    id="adm-username"
                    type="text"
                    placeholder="misal: admin / owner"
                    value={formData.adminUsername}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adminUsername: e.target.value.toLowerCase().trim(),
                      })
                    }
                    autoFocus
                    required
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="adm-display">Nama Lengkap / Panggilan</label>
                  <input
                    id="adm-display"
                    type="text"
                    placeholder="misal: Owner BaityBites"
                    value={formData.adminDisplayName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adminDisplayName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="adm-password">
                    Password Admin <span className="required">*</span>
                  </label>
                  <input
                    id="adm-password"
                    type="password"
                    placeholder="Kombinasi password yang kuat"
                    value={formData.adminPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, adminPassword: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="adm-pin">
                    Security PIN (4 Digit Angka) <span className="required">*</span>
                  </label>
                  <input
                    id="adm-pin"
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="misal: 8899"
                    value={formData.adminPin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adminPin: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 2: BRAND IDENTITY */}
          {currentStep === 2 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={Store01Icon} size={24} />
                </div>
                <div>
                  <h1>2. Identitas Brand &amp; Kontak Toko</h1>
                  <p>
                    Nama bisnis, slogan, dan informasi kontak yang akan tampil di
                    seluruh antarmuka pelanggan dan nota pesanan.
                  </p>
                </div>
              </div>

              <div className="onboarding-card__grid">
                <div className="onboarding-card__field">
                  <label htmlFor="brand-name">
                    Nama Brand Bisnis <span className="required">*</span>
                  </label>
                  <input
                    id="brand-name"
                    type="text"
                    placeholder="misal: BaityBites / Dapur Lezat"
                    value={formData.brandName}
                    onChange={(e) =>
                      setFormData({ ...formData, brandName: e.target.value })
                    }
                    autoFocus
                    required
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="brand-tagline">Slogan / Tagline</label>
                  <input
                    id="brand-tagline"
                    type="text"
                    placeholder="misal: Bite The Best"
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="brand-wa">Nomor WhatsApp Customer Service</label>
                  <input
                    id="brand-wa"
                    type="text"
                    placeholder="+62 812 3456 7890"
                    value={formData.whatsappNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="brand-ig">Akun Instagram Toko</label>
                  <input
                    id="brand-ig"
                    type="text"
                    placeholder="https://instagram.com/mybrand"
                    value={formData.instagramUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagramUrl: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="onboarding-card__field" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="brand-desc">Deskripsi Singkat Toko</label>
                  <textarea
                    id="brand-desc"
                    value={formData.heroDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        heroDescription: e.target.value,
                      })
                    }
                    placeholder="Deskripsi bisnis Anda yang tampil pada banner utama website..."
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 3: THEME COLORS */}
          {currentStep === 3 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={SparklesIcon} size={24} />
                </div>
                <div>
                  <h1>3. Palet Warna &amp; Visual Brand</h1>
                  <p>
                    Tentukan warna identitas visual toko Anda untuk tombol, banner,
                    dan elemen antarmuka pemesanan.
                  </p>
                </div>
              </div>

              <div className="onboarding-card__grid">
                <div className="onboarding-card__field">
                  <label htmlFor="color-primary">Warna Utama (Primary Brand Color)</label>
                  <div className="onboarding-card__color-picker-row">
                    <input
                      id="color-primary"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryColor: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryColor: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="color-accent">Warna Aksen (Secondary / Badge)</label>
                  <div className="onboarding-card__color-picker-row">
                    <input
                      id="color-accent"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accentColor: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accentColor: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Preview Button */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "8px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Pratinjau Tombol Utama &amp; Aksen:
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    style={{
                      background: formData.primaryColor,
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Tombol Pesan Sekarang
                  </button>
                  <span
                    style={{
                      background: formData.accentColor,
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Badge Best Seller
                  </span>
                </div>
              </div>
            </>
          )}

          {/* STEP 4: CATALOG & LAUNCH */}
          {currentStep === 4 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={SparklesIcon} size={24} />
                </div>
                <div>
                  <h1>4. Data Awal &amp; Siap Meluncurkan</h1>
                  <p>
                    Tentukan bagaimana Anda ingin mengawali database produk sebelum
                    mengakses dashboard admin utama.
                  </p>
                </div>
              </div>

              <div className="onboarding-card__data-choice">
                <div
                  className={`onboarding-card__data-choice-option ${
                    formData.sampleDataMode === "clean" ? "is-selected" : ""
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, sampleDataMode: "clean" })
                  }
                >
                  <div className="onboarding-card__data-choice-option-title">
                    <HugeiconsIcon icon={Store01Icon} size={18} />
                    <span>Mulai Database Bersih (Rekomendasi)</span>
                  </div>
                  <p className="onboarding-card__data-choice-option-desc">
                    Mulai dengan katalog kosong yang siap Anda isi dengan menu
                    dan produk asli bisnis Anda sendiri dari halaman manajemen
                    produk.
                  </p>
                </div>

                <div
                  className={`onboarding-card__data-choice-option ${
                    formData.sampleDataMode === "sample" ? "is-selected" : ""
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, sampleDataMode: "sample" })
                  }
                >
                  <div className="onboarding-card__data-choice-option-title">
                    <HugeiconsIcon icon={Package01Icon} size={18} />
                    <span>Pertahankan Contoh Produk F&amp;B</span>
                  </div>
                  <p className="onboarding-card__data-choice-option-desc">
                    Mempertahankan contoh data risoles, minuman, dan pesanan
                    sebagai referensi format sebelum Anda menggantinya nanti.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Actions Bar */}
          <div className="onboarding-card__actions">
            {currentStep > 1 ? (
              <button
                type="button"
                className="onboarding-card__btn-prev"
                onClick={prevStep}
                disabled={isPending}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <button
                type="button"
                className="onboarding-card__btn-next"
                onClick={nextStep}
              >
                <span>Lanjutkan</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="onboarding-card__btn-next"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={16} />
                    <span>Menginisialisasi Sistem...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                    <span>Selesaikan &amp; Buka Dashboard</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
