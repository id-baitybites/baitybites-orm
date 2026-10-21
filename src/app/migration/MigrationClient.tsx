"use client";

import { useState, useTransition, useCallback } from "react";
import {
  ShieldKeyIcon,
  Key01Icon,
  Loading03Icon,
  AlertDiamondIcon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  InformationCircleIcon,
  RefreshIcon,
  LockPasswordIcon,
  Database01Icon,
  CloudUploadIcon,
  GlobalIcon,
  GoogleIcon,
  SecurityCheckIcon,
  ArrowReloadHorizontalIcon,
  FloppyDiskIcon,
  ArrowMoveUpRightIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  verifyMigrationPin,
  runMigrationChecks,
  revokeMigrationSession,
  getReleaseConfig,
  updateReleaseConfig,
  testDatabaseConnection,
  generateProductionEnvBundle,
  type MigrationCheckResult,
  type CheckItem,
  type ReleaseConfig,
  type EnvironmentCredentials,
} from "./actions";
import "./migration.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "config-wizard" | "release" | "database" | "hosting" | "domain" | "oauth" | "security";

const TABS: { id: TabId; label: string; icon: typeof DatabaseIcon }[] = [
  { id: "config-wizard", label: "Migrator & Env Wizard", icon: CloudUploadIcon },
  { id: "release", label: "Release Version & Env", icon: ArrowMoveUpRightIcon },
  { id: "database", label: "Database", icon: Database01Icon },
  { id: "hosting", label: "Server & Hosting", icon: CloudUploadIcon },
  { id: "domain", label: "Domain", icon: GlobalIcon },
  { id: "oauth", label: "Google OAuth", icon: GoogleIcon },
  { id: "security", label: "Keamanan & Lainnya", icon: SecurityCheckIcon },
];

const CATEGORY_META: Record<TabId, { title: string; desc: string; color: string; bg: string }> = {
  "config-wizard": {
    title: "Environment Migration Wizard (All-in-One)",
    desc: "Input sembarang kredensial baru (Database, Domain, Hosting, Google OAuth, Cloudinary). Uji koneksi real-time dan generate bundle .env produksi instan.",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
  },
  release: {
    title: "Konfigurasi Release Version & Environment",
    desc: "Atur versi aplikasi, tag rilis, channel, domain publik, dan sakelar maintenance mode untuk publikasi.",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
  },
  database: {
    title: "Migrasi Database",
    desc: "Koneksi, struktur tabel, indexes, backup, dan integritas data.",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
  },
  hosting: {
    title: "Server & Hosting",
    desc: "Environment variables, Vercel deployment, dan konfigurasi runtime.",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
  },
  domain: {
    title: "Migrasi Domain",
    desc: "Custom domain, DNS records, SSL/TLS, dan robots.txt.",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
  oauth: {
    title: "Google OAuth",
    desc: "Client ID/Secret, redirect URI, consent screen, dan verifikasi domain.",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
  },
  security: {
    title: "Keamanan & Integrasi",
    desc: "Cloudinary, CSP, rate limiting, headers, dan API pihak ketiga.",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
  },
};

// Workaround untuk type icon yang benar
type IconType = typeof Database01Icon;
const DatabaseIcon = Database01Icon;

// ─── Status helpers ───────────────────────────────────────────────────────────

function getStatusIcon(status: CheckItem["status"]): { icon: IconType; cls: string } {
  switch (status) {
    case "ok":      return { icon: CheckmarkCircle02Icon, cls: "--ok" };
    case "warning": return { icon: Alert02Icon,           cls: "--warning" };
    case "error":   return { icon: AlertDiamondIcon,      cls: "--error" };
    case "info":    return { icon: InformationCircleIcon, cls: "--info" };
    default:        return { icon: RefreshIcon,            cls: "--pending" };
  }
}

function getBadgeLabel(status: CheckItem["status"]): string {
  switch (status) {
    case "ok":      return "Siap";
    case "warning": return "Perhatikan";
    case "error":   return "Belum";
    case "info":    return "Info";
    default:        return "Menunggu";
  }
}

function countByCategory(
  results: MigrationCheckResult[],
  category: string
): { ok: number; warn: number; error: number } {
  const cat = results.find((r) => r.category === category);
  if (!cat) return { ok: 0, warn: 0, error: 0 };
  return {
    ok:    cat.items.filter((i) => i.status === "ok" || i.status === "info").length,
    warn:  cat.items.filter((i) => i.status === "warning").length,
    error: cat.items.filter((i) => i.status === "error").length,
  };
}

function overallProgress(results: MigrationCheckResult[]): {
  total: number; ok: number; warn: number; error: number; pct: number;
} {
  let total = 0, ok = 0, warn = 0, error = 0;
  for (const r of results) {
    for (const item of r.items) {
      total++;
      if (item.status === "ok" || item.status === "info") ok++;
      else if (item.status === "warning") warn++;
      else if (item.status === "error") error++;
    }
  }
  return { total, ok, warn, error, pct: total > 0 ? Math.round((ok / total) * 100) : 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChecklistItem({ item }: { item: CheckItem }) {
  const { icon, cls } = getStatusIcon(item.status);
  return (
    <div className="migration-item">
      <div className={`migration-item__icon migration-item__icon${cls}`}>
        <HugeiconsIcon icon={icon} size={12} strokeWidth={2.2} />
      </div>
      <div className="migration-item__body">
        <div className="migration-item__label">{item.label}</div>
        <div className="migration-item__detail">{item.detail}</div>
        {item.action && (
          <div className="migration-item__action">{item.action}</div>
        )}
      </div>
      <span className={`migration-item__badge migration-item__badge${cls}`}>
        {getBadgeLabel(item.status)}
      </span>
    </div>
  );
}

// ─── Lock Screen ──────────────────────────────────────────────────────────────

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || pin.length < 4) {
      setError("Masukkan Security PIN 4 digit Anda.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await verifyMigrationPin(pin);
      if (result.success) {
        onUnlock();
      } else {
        setError(result.error || "PIN tidak valid.");
        setPin("");
      }
    });
  };

  return (
    <div className="migration-lock">
      <div className="migration-lock__card">
        <div className="migration-lock__icon">
          <HugeiconsIcon icon={ShieldKeyIcon} size={28} strokeWidth={1.5} />
        </div>

        <div className="migration-lock__badge">
          <HugeiconsIcon icon={LockPasswordIcon} size={10} strokeWidth={2.5} />
          Area Terbatas · Superadmin Only
        </div>

        <h1 className="migration-lock__title">Verifikasi Identitas</h1>
        <p className="migration-lock__subtitle">
          Modul Migration hanya dapat diakses oleh Superadmin yang telah diverifikasi.
          Masukkan Security PIN Anda untuk melanjutkan.
        </p>

        {error && (
          <div className="migration-lock__error">
            <HugeiconsIcon icon={AlertDiamondIcon} size={15} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form className="migration-lock__form" onSubmit={handleSubmit}>
          <div>
            <label className="migration-lock__pin-label" htmlFor="migration-pin">
              Security PIN (4 Digit)
            </label>
            <div className="migration-lock__pin-row">
              <input
                id="migration-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                placeholder="• • • •"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                autoFocus
                autoComplete="off"
                disabled={isPending}
              />
            </div>
          </div>

          <button
            type="submit"
            className="migration-lock__submit"
            disabled={isPending || pin.length < 4}
          >
            {isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Key01Icon} size={16} strokeWidth={2} />
                <span>Verifikasi &amp; Buka Modul</span>
              </>
            )}
          </button>
        </form>

        <p className="migration-lock__footer">
          Sesi verifikasi aktif selama 30 menit. Modul ini tidak dapat diakses
          oleh admin biasa tanpa izin dari Superadmin.
        </p>
      </div>
    </div>
  );
}

// ─── Release Version Configuration Component ─────────────────────────────────

function ReleaseConfigPanel({
  initialConfig,
}: {
  initialConfig: ReleaseConfig | null;
}) {
  const [config, setConfig] = useState<ReleaseConfig>(
    initialConfig || {
      appVersion: "1.0.0",
      releaseTag: "v1.0.0-gold",
      environment: "production",
      targetDomain: "https://baitybites.com",
      maintenanceMode: false,
      maintenanceNotice: "Sistem sedang dalam proses pemeliharaan rilis baru.",
      forceHttps: true,
      blockSearchEngines: false,
      enableApiDocs: false,
      minSupportedAppVersion: "1.0.0",
      changelogNotes: "Rilis Publik Perdana BaityBites (Full Production Stack)",
      deployedAt: new Date().toISOString(),
      releaseChannel: "stable",
    }
  );

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    startTransition(async () => {
      const res = await updateReleaseConfig(config);
      if (res.success) {
        setToast({ type: "success", text: res.message || "Konfigurasi rilis berhasil disimpan!" });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({ type: "error", text: res.error || "Gagal menyimpan konfigurasi rilis." });
      }
    });
  };

  const getEnvBadgeClass = (env: string) => {
    switch (env) {
      case "production":
        return "migration-release__card-badge--prod";
      case "staging":
        return "migration-release__card-badge--staging";
      default:
        return "migration-release__card-badge--dev";
    }
  };

  return (
    <div className="migration-release">
      {/* Toast Alert */}
      {toast && (
        <div className={`migration-release__toast migration-release__toast--${toast.type}`}>
          <HugeiconsIcon
            icon={toast.type === "success" ? CheckmarkCircle02Icon : AlertDiamondIcon}
            size={16}
          />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="migration-release__overview">
        <div className="migration-release__card">
          <span className="migration-release__card-label">App Release Version</span>
          <div className="migration-release__card-val">
            v{config.appVersion}
            <span className="migration-release__card-sub">({config.releaseTag})</span>
          </div>
          <span className="migration-release__card-sub">Channel: {config.releaseChannel.toUpperCase()}</span>
        </div>

        <div className="migration-release__card">
          <span className="migration-release__card-label">Target Environment</span>
          <div className="migration-release__card-val">
            <span className={`migration-release__card-badge ${getEnvBadgeClass(config.environment)}`}>
              {config.environment}
            </span>
          </div>
          <span className="migration-release__card-sub">{config.targetDomain}</span>
        </div>

        <div className="migration-release__card">
          <span className="migration-release__card-label">Status Akses Publik</span>
          <div className="migration-release__card-val">
            {config.maintenanceMode ? (
              <span className="migration-release__card-badge migration-release__card-badge--staging">
                Maintenance ON
              </span>
            ) : (
              <span className="migration-release__card-badge migration-release__card-badge--prod">
                Live &amp; Public
              </span>
            )}
          </div>
          <span className="migration-release__card-sub">
            {config.forceHttps ? "HTTPS Enforced" : "HTTP Allowed"}
          </span>
        </div>
      </div>

      {/* Form Konfigurasi */}
      <form onSubmit={handleSave} className="migration-release__form">
        <div>
          <h3 className="migration-release__section-title">
            <HugeiconsIcon icon={ArrowMoveUpRightIcon} size={18} />
            Versioning &amp; Deployment Metadata
          </h3>
          <p className="migration-release__section-desc">
            Informasi versi resmi yang disematkan ke antarmuka publik dan respon header server.
          </p>

          <div className="migration-release__grid">
            <div className="migration-release__field">
              <label htmlFor="rel-version">Release Version (SemVer)</label>
              <input
                id="rel-version"
                type="text"
                placeholder="1.0.0"
                value={config.appVersion}
                onChange={(e) => setConfig({ ...config, appVersion: e.target.value })}
                required
              />
            </div>

            <div className="migration-release__field">
              <label htmlFor="rel-tag">Release Tag / Build ID</label>
              <input
                id="rel-tag"
                type="text"
                placeholder="v1.0.0-gold"
                value={config.releaseTag}
                onChange={(e) => setConfig({ ...config, releaseTag: e.target.value })}
                required
              />
            </div>

            <div className="migration-release__field">
              <label htmlFor="rel-env">Target Environment</label>
              <select
                id="rel-env"
                value={config.environment}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    environment: e.target.value as "development" | "staging" | "production",
                  })
                }
              >
                <option value="production">Production (Live)</option>
                <option value="staging">Staging / UAT</option>
                <option value="development">Development (Local)</option>
              </select>
            </div>

            <div className="migration-release__field">
              <label htmlFor="rel-channel">Release Channel</label>
              <select
                id="rel-channel"
                value={config.releaseChannel}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    releaseChannel: e.target.value as "stable" | "beta" | "rc",
                  })
                }
              >
                <option value="stable">Stable (General Availability)</option>
                <option value="rc">Release Candidate (RC)</option>
                <option value="beta">Beta / Early Access</option>
              </select>
            </div>

            <div className="migration-release__field">
              <label htmlFor="rel-domain">Canonical Public URL</label>
              <input
                id="rel-domain"
                type="text"
                placeholder="https://baitybites.com"
                value={config.targetDomain}
                onChange={(e) => setConfig({ ...config, targetDomain: e.target.value })}
                required
              />
            </div>

            <div className="migration-release__field">
              <label htmlFor="rel-min-ver">Minimum Supported Version</label>
              <input
                id="rel-min-ver"
                type="text"
                placeholder="1.0.0"
                value={config.minSupportedAppVersion}
                onChange={(e) => setConfig({ ...config, minSupportedAppVersion: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div>
          <h3 className="migration-release__section-title">
            <HugeiconsIcon icon={SecurityCheckIcon} size={18} />
            Kebijakan Akses &amp; Traffic Switch
          </h3>
          <p className="migration-release__section-desc">
            Kontrol langsung lalu lintas pengguna saat pemindahan server atau cut-over berlangsung.
          </p>

          <div className="migration-release__toggles">
            <div className="migration-release__toggle-row">
              <div className="migration-release__toggle-row-info">
                <span className="migration-release__toggle-row-label">Maintenance Mode (Under Maintenance)</span>
                <span className="migration-release__toggle-row-hint">
                  Jika aktif, pengguna umum akan melihat pesan pemeliharaan sistem sementara admin tetap dapat mengakses Back Office.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
              />
            </div>

            {config.maintenanceMode && (
              <div className="migration-release__field">
                <label htmlFor="rel-notice">Pesan Pengumuman Pemeliharaan</label>
                <textarea
                  id="rel-notice"
                  value={config.maintenanceNotice}
                  onChange={(e) => setConfig({ ...config, maintenanceNotice: e.target.value })}
                  placeholder="Contoh: Kami sedang meningkatkan infrastruktur BaityBites. Layanan kembali normal dalam beberapa saat."
                />
              </div>
            )}

            <div className="migration-release__toggle-row">
              <div className="migration-release__toggle-row-info">
                <span className="migration-release__toggle-row-label">Paksa HTTPS (Strict Transport Security)</span>
                <span className="migration-release__toggle-row-hint">
                  Otomatis me-redirect seluruh trafik HTTP tidak terenkripsi ke HTTPS produksi.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.forceHttps}
                onChange={(e) => setConfig({ ...config, forceHttps: e.target.checked })}
              />
            </div>

            <div className="migration-release__toggle-row">
              <div className="migration-release__toggle-row-info">
                <span className="migration-release__toggle-row-label">Blokir Robot Search Engine (noindex, nofollow)</span>
                <span className="migration-release__toggle-row-hint">
                  Aktifkan ini jika rilis ini masih bersifat Staging / Pre-launch agar tidak terindeks oleh Google bot.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.blockSearchEngines}
                onChange={(e) => setConfig({ ...config, blockSearchEngines: e.target.checked })}
              />
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div className="migration-release__field">
          <label htmlFor="rel-notes">Release Notes &amp; Changelog Ringkas</label>
          <textarea
            id="rel-notes"
            value={config.changelogNotes}
            onChange={(e) => setConfig({ ...config, changelogNotes: e.target.value })}
            placeholder="Catatan perubahan yang dirilis pada versi ini..."
          />
        </div>

        {/* Action Button */}
        <div className="migration-release__actions">
          <button
            type="submit"
            className="migration-release__save-btn"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={15} />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={FloppyDiskIcon} size={15} strokeWidth={2} />
                <span>Simpan Konfigurasi Release</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Environment Migration Suite Component (Just Input Any Config) ────────────

function EnvironmentMigratorSuite({
  initialCredentials,
}: {
  initialCredentials: EnvironmentCredentials | null;
}) {
  const [creds, setCreds] = useState<EnvironmentCredentials>(
    initialCredentials || {
      databaseUrl: "",
      directUrl: "",
      nextAuthUrl: "https://baitybites.com",
      nextPublicAppUrl: "https://baitybites.com",
      googleClientId: "",
      googleClientSecret: "",
      cloudinaryUrl: "",
      geminiApiKey: "",
      superadminPin: "889900",
    }
  );

  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isTestingDb, startDbTest] = useTransition();
  const [generatedEnv, setGeneratedEnv] = useState<string>("");
  const [callbackHelp, setCallbackHelp] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleTestDatabase = () => {
    setDbTestResult(null);
    startDbTest(async () => {
      const res = await testDatabaseConnection(creds.databaseUrl);
      setDbTestResult(res);
    });
  };

  const handleGenerateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    const bundle = await generateProductionEnvBundle(creds);
    setGeneratedEnv(bundle.envString);
    setCallbackHelp(bundle.redirectUriHelp);
  };

  const handleCopy = () => {
    if (!generatedEnv) return;
    navigator.clipboard.writeText(generatedEnv);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="mig-env-suite">
      <form onSubmit={handleGenerateBundle} className="mig-env-suite__box">
        <div className="mig-env-suite__box-header">
          <div>
            <h3 className="mig-env-suite__box-title">
              <HugeiconsIcon icon={CloudUploadIcon} size={18} />
              Target Environment &amp; Credential Wizard
            </h3>
            <p className="mig-env-suite__box-desc">
              Input kredensial baru (Database, Domain, Hosting, Google OAuth, Cloudinary, AI). Uji koneksi secara langsung sebelum migrasi.
            </p>
          </div>
        </div>

        {/* 1. DATABASE BARU */}
        <div className="mig-env-suite__group">
          <label htmlFor="env-db-url">
            1. Target Database PostgreSQL (Pooled URL)
            <span className="hint">Penyedia Basis Data Cloud / VPS</span>
          </label>
          <div className="mig-env-suite__input-action-row">
            <input
              id="env-db-url"
              type="text"
              placeholder="postgresql://user:password@host-pooler.neon.tech/neondb?sslmode=require"
              value={creds.databaseUrl}
              onChange={(e) => {
                setCreds({ ...creds, databaseUrl: e.target.value });
                setDbTestResult(null);
              }}
              required
            />
            <button
              type="button"
              className="mig-env-suite__btn-test"
              onClick={handleTestDatabase}
              disabled={isTestingDb || !creds.databaseUrl}
              title="Uji apakah URL database valid dan bisa dihubungi"
            >
              {isTestingDb ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={14} />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Database01Icon} size={14} />
                  <span>Test Koneksi DB</span>
                </>
              )}
            </button>
          </div>

          {dbTestResult && (
            <div
              className={`mig-env-suite__ping-result mig-env-suite__ping-result--${
                dbTestResult.success ? "success" : "fail"
              }`}
            >
              <HugeiconsIcon
                icon={dbTestResult.success ? CheckmarkCircle02Icon : AlertDiamondIcon}
                size={14}
              />
              <span>{dbTestResult.message}</span>
            </div>
          )}
        </div>

        <div className="mig-env-suite__group">
          <label htmlFor="env-direct-url">
            Direct Connection TCP URL (Opsional / Prisma Migrations)
            <span className="hint">Tanpa PgBouncer port 5432</span>
          </label>
          <input
            id="env-direct-url"
            type="text"
            placeholder="postgresql://user:password@host-direct.neon.tech/neondb?sslmode=require (kosongkan jika sama)"
            value={creds.directUrl}
            onChange={(e) => setCreds({ ...creds, directUrl: e.target.value })}
          />
        </div>

        {/* 2. DOMAIN & HOSTING BARU */}
        <div className="mig-env-suite__row">
          <div className="mig-env-suite__group">
            <label htmlFor="env-nextauth-url">
              2. Target Canonical Domain (NEXTAUTH_URL)
              <span className="hint">https://nama-domain-anda.com</span>
            </label>
            <input
              id="env-nextauth-url"
              type="text"
              placeholder="https://baitybites.com"
              value={creds.nextAuthUrl}
              onChange={(e) => setCreds({ ...creds, nextAuthUrl: e.target.value })}
              required
            />
          </div>

          <div className="mig-env-suite__group">
            <label htmlFor="env-pin">
              Super Admin Security PIN
              <span className="hint">PIN untuk kunci modul migrasi</span>
            </label>
            <input
              id="env-pin"
              type="text"
              placeholder="889900"
              value={creds.superadminPin}
              onChange={(e) => setCreds({ ...creds, superadminPin: e.target.value })}
              required
            />
          </div>
        </div>

        {/* 3. GOOGLE OAUTH BARU */}
        <div className="mig-env-suite__row">
          <div className="mig-env-suite__group">
            <label htmlFor="env-google-id">
              3. Google OAuth Client ID
              <span className="hint">Dari Google Cloud Console</span>
            </label>
            <input
              id="env-google-id"
              type="text"
              placeholder="xxxx.apps.googleusercontent.com"
              value={creds.googleClientId}
              onChange={(e) => setCreds({ ...creds, googleClientId: e.target.value })}
            />
          </div>

          <div className="mig-env-suite__group">
            <label htmlFor="env-google-secret">
              Google OAuth Client Secret
              <span className="hint">GOCSPX-xxxx</span>
            </label>
            <input
              id="env-google-secret"
              type="password"
              placeholder="GOCSPX-xxxx"
              value={creds.googleClientSecret}
              onChange={(e) => setCreds({ ...creds, googleClientSecret: e.target.value })}
            />
          </div>
        </div>

        {creds.nextAuthUrl && (
          <div className="mig-env-suite__callback-card">
            <span className="mig-env-suite__callback-card-title" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <HugeiconsIcon icon={InformationCircleIcon} size={14} />
              Salin URL Callback ini ke Google Cloud Console (Authorized Redirect URIs):
            </span>
            <code className="mig-env-suite__callback-card-url">
              {creds.nextAuthUrl.replace(/\/+$/, "")}/api/auth/callback/google
            </code>
          </div>
        )}

        {/* 4. CLOUDINARY & GEMINI */}
        <div className="mig-env-suite__row">
          <div className="mig-env-suite__group">
            <label htmlFor="env-cloudinary">
              4. Cloudinary URL (Foto Produk &amp; Galeri)
              <span className="hint">cloudinary://key:secret@cloudname</span>
            </label>
            <input
              id="env-cloudinary"
              type="password"
              placeholder="cloudinary://key:secret@cloudname"
              value={creds.cloudinaryUrl}
              onChange={(e) => setCreds({ ...creds, cloudinaryUrl: e.target.value })}
            />
          </div>

          <div className="mig-env-suite__group">
            <label htmlFor="env-gemini">
              Google Gemini AI API Key
              <span className="hint">Dari Google AI Studio</span>
            </label>
            <input
              id="env-gemini"
              type="password"
              placeholder="AIzaSyxxxx"
              value={creds.geminiApiKey}
              onChange={(e) => setCreds({ ...creds, geminiApiKey: e.target.value })}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="migration-release__actions">
          <button type="submit" className="migration-release__save-btn">
            <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={15} strokeWidth={2} />
            <span>Generate &amp; Validasi Bundle Environment</span>
          </button>
        </div>
      </form>

      {/* HASIL BUNDLE GENERATOR */}
      {generatedEnv && (
        <div className="mig-env-suite__generator">
          <div className="mig-env-suite__generator-header">
            <span className="mig-env-suite__generator-title">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
              Bundle .env Siap Pakai untuk Server / Cloud Baru
            </span>
            <button
              type="button"
              className="mig-env-suite__generator-copy-btn"
              onClick={handleCopy}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              <span>{copied ? "Berhasil Disalin!" : "Salin Seluruh .env"}</span>
            </button>
          </div>

          <pre className="mig-env-suite__generator-pre">{generatedEnv}</pre>

          <p style={{ margin: 0, fontSize: "11px", color: "#a1a1aa", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span><strong>Langkah Terakhir:</strong> Salin teks di atas, lalu tempelkan ke menu <em>Project Settings → Environment Variables</em> penyedia hosting Anda atau ke file <code>.env</code> di VPS baru Anda. Restart / Redeploy aplikasi untuk menerapkan seluruh perubahan secara permanen.</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Migration Dashboard ─────────────────────────────────────────────────

function MigrationDashboard({
  initialResults,
  initialReleaseConfig,
  initialCredentials,
  onLock,
}: {
  initialResults: MigrationCheckResult[];
  initialReleaseConfig: ReleaseConfig | null;
  initialCredentials: EnvironmentCredentials | null;
  onLock: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("config-wizard");
  const [results, setResults] = useState<MigrationCheckResult[]>(initialResults);
  const [isRefreshing, startRefresh] = useTransition();

  const handleRefresh = useCallback(() => {
    startRefresh(async () => {
      const fresh = await runMigrationChecks();
      setResults(fresh);
    });
  }, []);

  const handleLock = () => {
    startRefresh(async () => {
      await revokeMigrationSession();
      onLock();
    });
  };

  const progress = overallProgress(results);
  const barClass =
    progress.error > 0
      ? "has-error"
      : progress.warn > 0
      ? "has-warning"
      : "";

  const activeResults = results.find((r) => r.category === activeTab);
  const meta = CATEGORY_META[activeTab];

  return (
    <div className="migration-page">
      {/* HEADING */}
      <div className="migration-heading">
        <div className="migration-heading__left">
          <p className="eyebrow">BAITYBITES OMS / DEPLOYMENT</p>
          <h1>Migration &amp; Release Control</h1>
          <p>
            Pusat kendali migrasi database, domain, server, rilis versi publik, dan verifikasi checklist sebelum aplikasi diluncurkan.
          </p>
        </div>
        <div className="migration-heading__actions">
          <button
            type="button"
            className="migration-reload-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Jalankan ulang semua pengecekan"
          >
            <HugeiconsIcon
              icon={ArrowReloadHorizontalIcon}
              size={14}
              strokeWidth={2}
              style={{ transform: isRefreshing ? "rotate(180deg)" : undefined, transition: "transform 500ms" }}
            />
            {isRefreshing ? "Memeriksa..." : "Refresh Checks"}
          </button>
        </div>
      </div>

      {/* WARNING BANNER */}
      <div className="migration-warning-banner">
        <HugeiconsIcon icon={AlertDiamondIcon} size={16} strokeWidth={2} className="migration-warning-banner__icon" />
        <div>
          <strong>Zona Sensitif — Superadmin &amp; Lead Engineer Only</strong>
          Konfigurasi release dan kredensial di modul ini memengaruhi langsung ketersediaan layanan publik (live traffic).
          Akses terlindungi verifikasi PIN dengan masa aktif 30 menit.
          <button
            type="button"
            onClick={handleLock}
            style={{ marginLeft: 12, fontSize: "var(--font-size-xs)", color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Kunci sekarang
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="migration-progress">
        <span className="migration-progress__label">Kesiapan Produksi</span>
        <div className={`migration-progress__bar ${barClass}`}>
          <div
            className="migration-progress__bar-fill"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <span className="migration-progress__count">
          {progress.ok}/{progress.total} item siap
          {progress.error > 0 && ` · ${progress.error} error`}
          {progress.warn > 0 && ` · ${progress.warn} peringatan`}
        </span>
        <button
          type="button"
          className="migration-progress__lock-btn"
          onClick={handleLock}
          title="Kunci modul migration"
        >
          <HugeiconsIcon icon={LockPasswordIcon} size={12} strokeWidth={2.2} />
          Kunci
        </button>
      </div>

      {/* TABS */}
      <div className="migration-tabs">
        {TABS.map((tab) => {
          const counts = countByCategory(results, tab.id);
          const hasBadge = counts.error > 0 || counts.warn > 0;
          const badgeType = counts.error > 0 ? "error" : counts.warn > 0 ? "warn" : "ok";
          const badgeNum = counts.error > 0 ? counts.error : counts.warn > 0 ? counts.warn : counts.ok;

          return (
            <button
              key={tab.id}
              type="button"
              className={`migration-tabs__btn${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <HugeiconsIcon icon={tab.icon} size={14} strokeWidth={1.8} />
              {tab.label}
              {hasBadge && (
                <span className={`migration-tabs__badge migration-tabs__badge--${badgeType}`}>
                  {badgeNum}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === "config-wizard" ? (
        <EnvironmentMigratorSuite initialCredentials={initialCredentials} />
      ) : activeTab === "release" ? (
        <ReleaseConfigPanel initialConfig={initialReleaseConfig} />
      ) : (
        /* CATEGORY CHECKLIST CONTENT */
        activeResults && (
          <div className="migration-category">
            <div className="migration-category__header">
              <div
                className="migration-category__header-icon"
                style={{ background: meta.bg, color: meta.color }}
              >
                {(() => {
                  const tab = TABS.find((t) => t.id === activeTab)!;
                  return (
                    <HugeiconsIcon icon={tab.icon} size={20} strokeWidth={1.8} />
                  );
                })()}
              </div>
              <div className="migration-category__header-text">
                <h2>{meta.title}</h2>
                <p>{meta.desc}</p>
              </div>
            </div>

            <div className="migration-checklist">
              {activeResults.items.map((item) => (
                <ChecklistItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function MigrationClient({
  initialVerified,
  initialResults,
  initialReleaseConfig,
  initialCredentials,
}: {
  initialVerified: boolean;
  initialResults: MigrationCheckResult[];
  initialReleaseConfig: ReleaseConfig | null;
  initialCredentials: EnvironmentCredentials | null;
}) {
  const [isVerified, setIsVerified] = useState(initialVerified);

  if (!isVerified) {
    return <LockScreen onUnlock={() => setIsVerified(true)} />;
  }

  return (
    <MigrationDashboard
      initialResults={initialResults}
      initialReleaseConfig={initialReleaseConfig}
      initialCredentials={initialCredentials}
      onLock={() => setIsVerified(false)}
    />
  );
}
