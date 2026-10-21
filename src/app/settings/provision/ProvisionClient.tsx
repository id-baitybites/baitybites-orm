"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  GitForkIcon,
  SourceCodeIcon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  SparklesIcon,
  AlertCircleIcon,
  FolderOpenIcon,
  LinkSquare02Icon,
  SecurityCheckIcon,
  RocketIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { provisionClientRepository, type ProvisionResult } from "./actions";

export default function ProvisionClient() {
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || "";
  const initialEmail = searchParams.get("email") || "";
  const [clientName, setClientName] = useState(initialName);
  const [clientEmail, setClientEmail] = useState(initialEmail);
  const [brandSlug, setBrandSlug] = useState(
    initialName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
  );
  const TARGET_ORG = "id-baitybites";
  const TEMPLATE_REPO = "id-baitybites/baitybites-orm";
  const [isPrivate, setIsPrivate] = useState(true);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-generate slug dari nama klien jika diubah
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    if (!brandSlug || brandSlug === clientName.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setBrandSlug(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await provisionClientRepository({
        clientName,
        clientEmail: clientEmail.trim() || undefined,
        brandSlug,
        targetOrgOrUser: TARGET_ORG,
        templateRepo: TEMPLATE_REPO,
        isPrivate,
      });
      setResult(res);
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const directTemplateUrl = `https://github.com/${TEMPLATE_REPO}/generate`;

  return (
    <div className="provision-grid">
      {/* Kolom Kiri: Form Generator */}
      <div className="provision-card">
        <h3 className="provision-card__title">
          <HugeiconsIcon icon={GitForkIcon} size={20} />
          Generator Instance Klien Baru
        </h3>
        <p className="provision-card__desc">
          Buat repositori dedicated untuk klien yang telah menyelesaikan pembayaran langganan.
          Tidak butuh coding — cukup masukkan nama brand klien dan generate link aksesnya.
        </p>

        <form onSubmit={handleSubmit} className="provision-form">
          <div className="form-group">
            <label>Nama Klien / Bisnis</label>
            <input
              type="text"
              placeholder="Contoh: Kopi Kenangan, Dapur Padang Raya"
              value={clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              required
            />
            <span className="form-hint">Nama brand atau legalitas bisnis pemesan.</span>
          </div>

          <div className="form-group">
            <label>Email Klien (Kirim Otomatis Kredensial &amp; Konfigurasi)</label>
            <input
              type="email"
              placeholder="contoh: lestari.test@gmail.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            <span className="form-hint">
              URL repo, instruksi clone, dan preset .env akan otomatis dikirimkan ke email ini.
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Repository Slug (Nama Folder Git)</label>
              <input
                type="text"
                placeholder="client-kopi-kenangan"
                value={brandSlug}
                onChange={(e) => setBrandSlug(e.target.value)}
                required
              />
              <span className="form-hint">Hanya huruf kecil, angka, dan strip (-).</span>
            </div>

            <div className="form-group">
              <label>Target Organisasi / Akun Repositori</label>
              <div className="readonly-display-box">
                <span className="readonly-value">{TARGET_ORG}</span>
                <span className="lock-tag">
                  <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
                  <span>Akun Resmi</span>
                </span>
              </div>
              <span className="form-hint">Dikelola otomatis di bawah akun repositori resmi vendor Anda.</span>
            </div>
          </div>

          <div className="form-group">
            <label>Master Template Source (Upstream Core)</label>
            <div className="readonly-display-box">
              <span className="readonly-value">{TEMPLATE_REPO}</span>
              <span className="lock-tag">
                <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
                <span>Cetak Biru Master</span>
              </span>
            </div>
            <span className="form-hint">Cetak biru resmi Baitybites ORM yang otomatis disalin untuk klien.</span>
          </div>

          <div className="toggle-box">
            <input
              type="checkbox"
              id="private-check"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <label htmlFor="private-check" style={{ cursor: "pointer", margin: 0 }}>
              <span>Jadikan Repository Private (Direkomendasikan untuk Klien Berbayar)</span>
            </label>
          </div>

          <div className="form-hint" style={{ marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "6px", color: "#059669" }}>
            <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
            <span>Otomatisasi repositori &amp; skema database diamankan via environment secret server-side.</span>
          </div>

          <button type="submit" className="btn-submit" disabled={isPending}>
            <HugeiconsIcon icon={SparklesIcon} size={18} />
            <span>{isPending ? "Menyiapkan Blueprint Klien..." : "Generate Repository Klien"}</span>
          </button>
        </form>
      </div>

      {/* Kolom Kanan: Hasil & One-Click Launchers */}
      <div className="provision-card">
        <h3 className="provision-card__title">
          <HugeiconsIcon icon={SourceCodeIcon} size={20} />
          Akses Klien & Launcher Instan
        </h3>
        <p className="provision-card__desc">
          Tautan dan instruksi yang siap dikirimkan langsung ke tim atau klien Anda.
        </p>

        {result ? (
          <div className="provision-result">
            <div className={`result-banner ${result.success ? "is-success" : "is-error"}`}>
              {result.success ? (
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
              ) : (
                <HugeiconsIcon icon={AlertCircleIcon} size={18} />
              )}
              <span>{result.message || result.error}</span>
            </div>

            {result.success && (
              <>
                {result.emailSent && (
                  <div className="result-banner is-success" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
                    <span>
                      Instruksi &amp; preset .env berhasil dikirimkan ke email: <strong>{result.emailRecipient}</strong>!
                    </span>
                  </div>
                )}

                {result.schemaCreated && (
                  <div className="result-banner is-success" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
                    <span>
                      Skema database terisolasi <code>{result.schemaName}</code> aktif di Neon PostgreSQL. Data 100% terpisah dari klien lain!
                    </span>
                  </div>
                )}

                <div className="quick-links">
                  {/* Launcher VS Code Web (Bisa diedit langsung tanpa install lokal) */}
                  <a
                    href={result.vscodeDevUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn action-btn--vscode"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <HugeiconsIcon icon={RocketIcon} size={16} />
                      Buka di VS Code Web (vscode.dev)
                    </span>
                    <HugeiconsIcon icon={LinkSquare02Icon} size={16} />
                  </a>

                  {/* Buka Template Generator Langsung */}
                  <a
                    href={directTemplateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn action-btn--template"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <HugeiconsIcon icon={Copy01Icon} size={16} />
                      Salin dari Template Repositori
                    </span>
                    <HugeiconsIcon icon={LinkSquare02Icon} size={16} />
                  </a>

                  {/* Buka Repository Target */}
                  <a
                    href={result.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn action-btn--github"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <HugeiconsIcon icon={LinkSquare02Icon} size={16} />
                      Buka Repositori Kode Klien
                    </span>
                    <HugeiconsIcon icon={LinkSquare02Icon} size={16} />
                  </a>
                </div>

                {/* Salin URL Repo untuk Klien */}
                <div className="copy-card">
                  <div className="copy-card__header">
                    <span>URL Repository Klien:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.repoUrl || "", "repoUrl")}
                    >
                      {copiedKey === "repoUrl" ? "Tersalin!" : "Salin URL"}
                    </button>
                  </div>
                  <code>{result.repoUrl}</code>
                </div>

                {/* Salin Perintah Clone */}
                <div className="copy-card">
                  <div className="copy-card__header">
                    <span>Perintah Clone (Terminal / VS Code):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.cloneCommand || "", "cloneCmd")}
                    >
                      {copiedKey === "cloneCmd" ? "Tersalin!" : "Salin Command"}
                    </button>
                  </div>
                  <code>{result.cloneCommand}</code>
                </div>

                {/* Salin Konfigurasi .env Toko Klien */}
                {result.envPreset && (
                  <div className="copy-card">
                    <div className="copy-card__header">
                      <span>Preset Konfigurasi Lingkungan (.env Toko Klien):</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.envPreset || "", "envPreset")}
                      >
                        {copiedKey === "envPreset" ? "Tersalin!" : "Salin .env"}
                      </button>
                    </div>
                    <pre style={{ fontSize: "0.74rem", background: "#f8fafc", padding: "0.5rem", borderRadius: "4px", overflowX: "auto", margin: 0, maxHeight: "150px" }}>
                      <code>{result.envPreset}</code>
                    </pre>
                  </div>
                )}

                <div className="steps-guide">
                  <h4 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                    Yang Perlu Dikirim ke Klien:
                  </h4>
                  <ol>
                    <li>Kirimkan URL repository atau link vscode.dev di atas.</li>
                    <li>Instruksikan klien membuka terminal dan ketik <code>npm install && npm run dev</code>.</li>
                    <li>Klien langsung diarahkan ke form wizard <code>/onboarding</code> di browser mereka.</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
            <HugeiconsIcon icon={FolderOpenIcon} size={48} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Isi data brand klien di samping untuk menghasilkan tautan GitHub Repository &amp; akses vscode.dev secara otomatis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
