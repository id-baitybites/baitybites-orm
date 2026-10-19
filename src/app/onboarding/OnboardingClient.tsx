"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldKeyIcon,
  Settings01Icon,
  Building02Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Loading03Icon,
  AlertDiamondIcon,
  SparklesIcon,
  LockPasswordIcon,
  Database01Icon,
  GlobalIcon,
  GoogleIcon,
  CloudUploadIcon,
  Location01Icon,
  MailAtSign01Icon,
  Call02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  executeOnboarding,
  testOnboardingDatabaseConnection,
  type OnboardingPayload,
  type OnboardingResult,
  type OnboardingStepResult,
} from "./actions";
import "./onboarding.scss";

const STEPS = [
  { id: 1, label: "1. Otentikasi Admin", icon: ShieldKeyIcon },
  { id: 2, label: "2. Konfigurasi Sistem", icon: Settings01Icon },
  { id: 3, label: "3. Identitas Korporasi", icon: Building02Icon },
  { id: 4, label: "4. Branding & Visual", icon: SparklesIcon },
];

interface OnboardingClientProps {
  isReconfiguration?: boolean;
}

export default function OnboardingClient({
  isReconfiguration = false,
}: OnboardingClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null);

  // State Testing Database
  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTestingDb, startDbTest] = useTransition();

  const [formData, setFormData] = useState<OnboardingPayload>({
    // Langkah 1: Otentikasi Admin
    adminUsername: "",
    adminDisplayName: "",
    adminPassword: "",
    adminPin: "",

    // Langkah 2: Konfigurasi Sistem (.env)
    databaseUrl: "",
    directUrl: "",
    canonicalDomain: "https://mybrand.com",
    googleClientId: "",
    googleClientSecret: "",
    cloudinaryUrl: "",
    geminiApiKey: "",

    // Langkah 3: Identitas Korporasi
    companyLegalName: "",
    companyAddress: "",
    companyCity: "Jakarta",
    companyEmail: "",
    companyPhone: "+62 812 0000 0000",

    // Langkah 4: Branding Toko & Visual
    brandName: "",
    tagline: "The Best Experience",
    heroTitle: "Sensasi Pilihan Kuliner Terbaik",
    heroTitleAccent: "Spesial Untuk Anda",
    heroDescription:
      "Dibuat dengan bahan baku berkualitas premium, rasa autentik, dan penyajian istimewa yang siap memanjakan selera Anda.",
    primaryColor: "#ff7a00",
    accentColor: "#10b981",
    instagramUrl: "https://instagram.com/mybrand",
    sampleDataMode: "clean",
  });

  const handleTestDatabase = () => {
    setDbTestResult(null);
    startDbTest(async () => {
      const res = await testOnboardingDatabaseConnection(formData.databaseUrl);
      setDbTestResult(res);
    });
  };

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
      if (!formData.canonicalDomain.trim()) {
        setError("Domain resmi aplikasi wajib diisi.");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.companyLegalName.trim()) {
        setError("Nama Perusahaan / Bisnis wajib diisi.");
        return;
      }
    } else if (currentStep === 4) {
      if (!formData.brandName.trim()) {
        setError("Nama Brand Toko wajib diisi.");
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
      setOnboardingResult(result);
      if (!result.success) {
        setError(result.error || "Gagal menyelesaikan setup awal.");
      }
    });
  };

  // Redirect setelah user klik tombol di success screen
  const handleGoToDashboard = () => {
    // Role-aware redirect: platform owner ke /platform/console, store admin ke /dashboard
    const username = formData.adminUsername.trim().toLowerCase();
    const isOwner = username === "superadmin" || username === "platform.admin" || username === "owner";
    router.push(isOwner ? "/platform/console?onboarded=true" : "/dashboard?onboarded=true");
  };

  // Preview Env String
  const previewEnv = `# GENERATED ENVIRONMENT CONFIGURATION
DATABASE_URL="${formData.databaseUrl || "postgresql://..."}"
DIRECT_URL="${formData.directUrl || formData.databaseUrl || "postgresql://..."}"
NEXTAUTH_URL="${formData.canonicalDomain.replace(/\/+$/, "") || "https://..."}"
NEXT_PUBLIC_APP_URL="${formData.canonicalDomain.replace(/\/+$/, "") || "https://..."}"
GOOGLE_CLIENT_ID="${formData.googleClientId || ""}"
GOOGLE_CLIENT_SECRET="${formData.googleClientSecret || ""}"
CLOUDINARY_URL="${formData.cloudinaryUrl || ""}"
GEMINI_API_KEY="${formData.geminiApiKey || ""}"
SUPERADMIN_PIN="${formData.adminPin || "889900"}"
NODE_ENV="production"`;

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (onboardingResult?.success) {
    const steps = onboardingResult.steps ?? [];
    return (
      <div className="onboarding-layout">
        <header className="onboarding-layout__header">
          <div className="onboarding-layout__header-brand">
            <span>Client Onboarding Wizard</span>
            <span className="badge">Setup Selesai</span>
          </div>
        </header>
        <main className="onboarding-layout__content">
          <div className="onboarding-card" style={{ maxWidth: 600, margin: "0 auto" }}>
            <div className="onboarding-card__header">
              <div className="onboarding-card__header-icon" style={{ background: "rgba(16,185,129,0.15)" }}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} style={{ color: "#10b981" }} />
              </div>
              <div>
                <h1 style={{ color: "#10b981" }}>🎉 Sistem Berhasil Diinisialisasi!</h1>
                <p>{onboardingResult.message}</p>
              </div>
            </div>

            {/* Per-step results */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0 24px" }}>
              {steps.map((s: OnboardingStepResult, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: s.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${s.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    fontSize: "13px",
                  }}
                >
                  <HugeiconsIcon
                    icon={s.success ? CheckmarkCircle02Icon : AlertDiamondIcon}
                    size={16}
                    style={{ color: s.success ? "#10b981" : "#ef4444", flexShrink: 0, marginTop: 2 }}
                  />
                  <div>
                    <strong style={{ color: s.success ? "#065f46" : "#b91c1c", display: "block" }}>
                      {s.step}
                    </strong>
                    <span style={{ color: "#475569" }}>{s.message}</span>
                  </div>
                </div>
              ))}
            </div>

            {onboardingResult.dbMigrated && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "12px", color: "#1e40af", marginBottom: "16px" }}>
                <strong>✅ Database Target di-Provision:</strong> Schema PostgreSQL berhasil di-push via <code>prisma db push</code>. Instance toko siap digunakan.
              </div>
            )}
            {onboardingResult.dbSkipped && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "12px", color: "#166534", marginBottom: "16px" }}>
                <strong>ℹ️ Database:</strong> Menggunakan schema server yang sudah ada — tidak perlu migrasi.
              </div>
            )}

            <button
              id="onboarding-go-to-dashboard"
              type="button"
              className="onboarding-card__btn-next"
              onClick={handleGoToDashboard}
              style={{ width: "100%", justifyContent: "center" }}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              <span>Buka Dashboard Toko</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="onboarding-layout">
      {/* Top Header */}
      <header className="onboarding-layout__header">
        <div className="onboarding-layout__header-brand">
          <span>Client Onboarding Wizard</span>
          <span className="badge">White-Label Instance</span>
        </div>
        <div className="onboarding-layout__header-badge">
          <HugeiconsIcon icon={LockPasswordIcon} size={14} />
          <span>Setup Sistem Klien Baru</span>
        </div>
      </header>

      <main className="onboarding-layout__content">
        {isReconfiguration && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} style={{ color: "#3b82f6", flexShrink: 0 }} />
            <div>
              <strong>Mode Rekonfigurasi / Tinjauan Onboarding Aktif</strong>
              <p style={{ margin: "2px 0 0", color: "#1d4ed8" }}>
                Sistem instance ini telah terinisialisasi. Anda dapat memperbarui kredensial super admin, database connection, atau visual identity kapan saja.
              </p>
            </div>
          </div>
        )}

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
          {/* ─────────────────────────────────────────────────────────────
              LANGKAH 1: OTENTIKASI SUPER ADMIN
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={ShieldKeyIcon} size={24} />
                </div>
                <div>
                  <h1>Langkah 1: Akun Otentikasi Super Admin</h1>
                  <p>
                    Buat kredensial admin tertinggi yang akan Anda gunakan untuk
                    mengelola toko, pesanan, staf, dan pengaturan back office.
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
                    placeholder="misal: Hendra Setiawan"
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

          {/* ─────────────────────────────────────────────────────────────
              LANGKAH 2: KONFIGURASI SISTEM (.ENV SETUP)
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={Settings01Icon} size={24} />
                </div>
                <div>
                  <h1>Langkah 2: Konfigurasi Database &amp; Environment</h1>
                  <p>
                    Hubungkan database PostgreSQL Anda, domain canonical, serta
                    layanan pihak ketiga yang akan digenerate ke file konfigurasi.
                  </p>
                </div>
              </div>

              <div className="onboarding-card__grid">
                <div className="onboarding-card__field" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="cfg-db">
                    Database Connection URL (PostgreSQL Pooled)
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="cfg-db"
                      type="text"
                      placeholder="postgresql://user:password@host-pooler.neon.tech/neondb?sslmode=require"
                      value={formData.databaseUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, databaseUrl: e.target.value });
                        setDbTestResult(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleTestDatabase}
                      disabled={isTestingDb || !formData.databaseUrl}
                      style={{
                        padding: "0 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-default)",
                        background: "rgba(99,102,241,0.1)",
                        color: "#6366f1",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <HugeiconsIcon icon={Database01Icon} size={14} />
                      <span>{isTestingDb ? "Testing..." : "Test Koneksi"}</span>
                    </button>
                  </div>

                  {dbTestResult && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "12px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: dbTestResult.success
                          ? "rgba(16,185,129,0.1)"
                          : "rgba(239,68,68,0.1)",
                        color: dbTestResult.success ? "#10b981" : "#ef4444",
                      }}
                    >
                      {dbTestResult.message}
                    </div>
                  )}
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="cfg-domain">
                    Canonical Domain (NEXTAUTH_URL) <span className="required">*</span>
                  </label>
                  <input
                    id="cfg-domain"
                    type="text"
                    placeholder="https://tokoanda.com"
                    value={formData.canonicalDomain}
                    onChange={(e) =>
                      setFormData({ ...formData, canonicalDomain: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="cfg-cloudinary">Cloudinary Storage URL</label>
                  <input
                    id="cfg-cloudinary"
                    type="password"
                    placeholder="cloudinary://key:secret@cloudname"
                    value={formData.cloudinaryUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, cloudinaryUrl: e.target.value })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="cfg-google-id">Google OAuth Client ID</label>
                  <input
                    id="cfg-google-id"
                    type="text"
                    placeholder="xxxx.apps.googleusercontent.com"
                    value={formData.googleClientId}
                    onChange={(e) =>
                      setFormData({ ...formData, googleClientId: e.target.value })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="cfg-google-sec">Google OAuth Client Secret</label>
                  <input
                    id="cfg-google-sec"
                    type="password"
                    placeholder="GOCSPX-xxxx"
                    value={formData.googleClientSecret}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        googleClientSecret: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Preview Box File .env */}
              <div
                style={{
                  background: "#09090b",
                  border: "1px solid var(--border-default)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#a1a1aa",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Pratinjau File .env Server Anda:
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(previewEnv)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ff7a00",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Salin .env
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#4ade80",
                    maxHeight: "100px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {previewEnv}
                </pre>
              </div>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              LANGKAH 3: IDENTITAS KORPORASI
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={Building02Icon} size={24} />
                </div>
                <div>
                  <h1>Langkah 3: Identitas Korporasi &amp; Legalitas</h1>
                  <p>
                    Lengkapi identitas badan usaha, alamat operasional fisik, dan
                    kontak legal yang akan dicantumkan pada footer serta nota.
                  </p>
                </div>
              </div>

              <div className="onboarding-card__grid">
                <div className="onboarding-card__field">
                  <label htmlFor="corp-legal">
                    Nama Perusahaan / Badan Usaha <span className="required">*</span>
                  </label>
                  <input
                    id="corp-legal"
                    type="text"
                    placeholder="misal: PT Rasa Nusantara Sejahtera"
                    value={formData.companyLegalName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        companyLegalName: val,
                        brandName: formData.brandName || val,
                      });
                    }}
                    autoFocus
                    required
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="corp-email">Email Resmi Perusahaan</label>
                  <input
                    id="corp-email"
                    type="email"
                    placeholder="legal@perusahaan.com"
                    value={formData.companyEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, companyEmail: e.target.value })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="corp-phone">Telepon / WhatsApp Resmi</label>
                  <input
                    id="corp-phone"
                    type="text"
                    placeholder="+62 812 3456 7890"
                    value={formData.companyPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, companyPhone: e.target.value })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="corp-city">Kota Operasional</label>
                  <input
                    id="corp-city"
                    type="text"
                    placeholder="misal: Jakarta Selatan"
                    value={formData.companyCity}
                    onChange={(e) =>
                      setFormData({ ...formData, companyCity: e.target.value })
                    }
                  />
                </div>

                <div className="onboarding-card__field" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="corp-address">Alamat Kantor / Dapur Utama</label>
                  <textarea
                    id="corp-address"
                    value={formData.companyAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        companyAddress: e.target.value,
                      })
                    }
                    placeholder="Jl. Sudirman No. 12, Lantai 3, Jakarta..."
                  />
                </div>
              </div>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              LANGKAH 4: BRANDING TOKO & VISUAL IDENTITY
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <>
              <div className="onboarding-card__header">
                <div className="onboarding-card__header-icon">
                  <HugeiconsIcon icon={SparklesIcon} size={24} />
                </div>
                <div>
                  <h1>Langkah 4: Branding Toko &amp; Visual Identity</h1>
                  <p>
                    Tentukan nama brand publik, palet warna antarmuka, dan
                    bagaimana Anda ingin mengawali database katalog produk.
                  </p>
                </div>
              </div>

              <div className="onboarding-card__grid">
                <div className="onboarding-card__field">
                  <label htmlFor="brand-name">
                    Nama Brand Publik Toko <span className="required">*</span>
                  </label>
                  <input
                    id="brand-name"
                    type="text"
                    placeholder="misal: Dapur Lezat"
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
                    placeholder="misal: Sensasi Rasa Terbaik"
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                  />
                </div>

                <div className="onboarding-card__field">
                  <label htmlFor="color-primary">Warna Utama (Primary Color)</label>
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
                  <label htmlFor="color-accent">Warna Aksen (Badge / Secondary)</label>
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

                <div className="onboarding-card__field" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="brand-desc">Deskripsi Sambutan Website</label>
                  <textarea
                    id="brand-desc"
                    value={formData.heroDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        heroDescription: e.target.value,
                      })
                    }
                    placeholder="Kalimat sambutan hangat untuk pelanggan di banner utama website..."
                  />
                </div>
              </div>

              {/* Data Mode Choice */}
              <div style={{ marginTop: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>
                  Mode Data Katalog Awal:
                </label>
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
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                      <span>Mulai Database Bersih (Rekomendasi)</span>
                    </div>
                    <p className="onboarding-card__data-choice-option-desc">
                      Katalog kosong yang siap Anda isi dengan produk asli toko Anda.
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
                      <HugeiconsIcon icon={SparklesIcon} size={16} />
                      <span>Pertahankan Contoh Produk F&amp;B</span>
                    </div>
                    <p className="onboarding-card__data-choice-option-desc">
                      Gunakan contoh menu F&amp;B sebagai referensi format tampilan.
                    </p>
                  </div>
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
                    <span>Selesaikan Setup &amp; Buka Dashboard</span>
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
