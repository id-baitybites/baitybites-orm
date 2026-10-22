"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building02Icon,
  Database01Icon,
  Invoice01Icon,
  Notification01Icon,
  RocketIcon,
  UserStar01Icon,
  CheckmarkCircle02Icon,
  FloppyDiskIcon,
  ArrowRight01Icon,
  Globe02Icon,
  Mail01Icon,
  Call02Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import "./settings.scss";

// ─── Section Configuration for Platform Owner SaaS ───────────────────────────
const SECTIONS = [
  { id: "profil-platform", label: "Profil Platform & Vendor", icon: Building02Icon },
  { id: "multi-tenant-engine", label: "Multi-Tenant & Database", icon: Database01Icon },
  { id: "billing-vendor", label: "Rekening Billing Vendor", icon: Invoice01Icon },
  { id: "gateway-notifikasi", label: "Email & Notifikasi Gateway", icon: Notification01Icon },
  { id: "paket-lisensi", label: "Paket Lisensi & Kuota", icon: RocketIcon },
  { id: "pengguna-akses", label: "Tim Superadmin Platform", icon: UserStar01Icon },
];

// ─── Toggle Component ─────────────────────────────────────────────────────────
function SettingsToggle({
  label,
  description,
  defaultChecked = false,
  id,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
  id: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="settings-toggle">
      <div>
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        id={id}
        type="button"
        className={`toggle-switch ${checked ? "is-on" : ""}`}
        onClick={() => setChecked((v) => !v)}
      >
        <span className="toggle-switch__thumb" />
      </button>
    </div>
  );
}

// ─── 1. Profil Platform & Vendor ─────────────────────────────────────────────
function ProfilPlatformSection() {
  const [platformName, setPlatformName] = useState("Baitybites ORM (OMS Engine)");
  const [legalEntity, setLegalEntity] = useState("PT Baitybites Teknologi Nusantara");
  const [platformUrl, setPlatformUrl] = useState("https://baitybites.site");
  const [supportEmail, setSupportEmail] = useState("support@baitybites.site");
  const [hotlinePhone, setHotlinePhone] = useState("+62 812 8765 4321");

  return (
    <div className="settings-panel__body">
      <div className="settings-info-card settings-info-card--success">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
        <div>
          <strong>Platform Core Engine Operasional</strong>
          <p>
            Pusat konfigurasi global vendor Baitybites ORM untuk mengorkestrasi seluruh tenant kuliner F&amp;B,
            infrastruktur database terisolasi, serta gerbang komunikasi transaksional.
          </p>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Identitas Resmi SaaS &amp; Badan Usaha Vendor</p>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Building02Icon} size={14} />
            Nama Platform SaaS
          </span>
          <input
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            type="text"
            placeholder="Baitybites ORM"
          />
        </label>

        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Building02Icon} size={14} />
            Badan Usaha / Legalitas Vendor
          </span>
          <input
            value={legalEntity}
            onChange={(e) => setLegalEntity(e.target.value)}
            type="text"
            placeholder="PT / CV Vendor"
          />
        </label>

        <div className="settings-field-row">
          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Globe02Icon} size={14} />
              Domain Utama Platform (Root URL)
            </span>
            <input
              value={platformUrl}
              onChange={(e) => setPlatformUrl(e.target.value)}
              type="url"
              placeholder="https://domain-platform.com"
            />
          </label>

          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Mail01Icon} size={14} />
              Email Resmi Dukungan &amp; Billing
            </span>
            <input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              type="email"
              placeholder="support@domain-platform.com"
            />
          </label>
        </div>

        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Call02Icon} size={14} />
            Nomor Hotline WhatsApp Dukungan Klien (B2B)
          </span>
          <input
            value={hotlinePhone}
            onChange={(e) => setHotlinePhone(e.target.value)}
            type="tel"
            placeholder="+62 8xx xxxx xxxx"
          />
          <span className="settings-field__hint">
            Nomor resmi vendor yang tercantum pada lampiran invoice langganan dan footer onboarding klien.
          </span>
        </label>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Ekosistem Platform Owner &amp; Navigasi Cepat</p>
        <div className="settings-ecosystem-grid">
          <Link href="/platform/console" className="ecosystem-card">
            <div className="card-badge">Live Monitor</div>
            <strong>Platform Owner Console</strong>
            <p>Pantau metrik MRR, kurasi prospek baru, dan ringkasan seluruh tenant aktif.</p>
          </Link>
          <Link href="/settings/leads" className="ecosystem-card">
            <div className="card-badge">Kurasi Leads</div>
            <strong>Permintaan Klien Baru</strong>
            <p>Proses prospek masuk melalui 4 tahap kurasi (Invoice, Payment, Provision, Handover).</p>
          </Link>
          <Link href="/settings/provision" className="ecosystem-card">
            <div className="card-badge">Generator</div>
            <strong>Generator Instance Repositori</strong>
            <p>Otomasi duplikasi repositori blueprint dan isolasi skema Neon PostgreSQL klien baru.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Multi-Tenant Engine & Database ───────────────────────────────────────
function MultiTenantEngineSection() {
  const [dbProvider] = useState("Neon Serverless PostgreSQL (Singapore Region - ap-southeast-1)");
  const [masterRepo] = useState("id-baitybites/baitybites-orm");
  const [targetOrg] = useState("id-baitybites");

  return (
    <div className="settings-panel__body">
      <div className="settings-info-card settings-info-card--success">
        <HugeiconsIcon icon={SecurityCheckIcon} size={20} />
        <div>
          <strong>Router Multi-Tenant Database Terisolasi</strong>
          <p>
            Arsitektur <em>Schema-per-Tenant</em> aktif via Neon PostgreSQL. Data transaksi, katalog produk,
            dan konfigurasi tiap klien terpisah 100% pada namespace database mandiri (Zero Collision).
          </p>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Konfigurasi Engine &amp; Master Blueprint</p>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Database01Icon} size={14} />
            Penyedia Database Multi-Tenant
          </span>
          <input value={dbProvider} readOnly className="input-readonly" />
          <span className="settings-field__hint">
            Dikelola otomatis via connection string environment server <code>DATABASE_URL</code> dengan mode pooler PgBouncer.
          </span>
        </label>

        <div className="settings-field-row">
          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Globe02Icon} size={14} />
              Target Organisasi GitHub Klien
            </span>
            <input value={targetOrg} readOnly className="input-readonly" />
            <span className="settings-field__hint">
              Organisasi resmi GitHub tempat repositori private setiap klien digenerate.
            </span>
          </label>

          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Building02Icon} size={14} />
              Master Blueprint Template Repo
            </span>
            <input value={masterRepo} readOnly className="input-readonly" />
            <span className="settings-field__hint">
              Cetak biru resmi upstream Baitybites ORM yang disalin otomatis ke repositori klien.
            </span>
          </label>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Status Kapasitas &amp; Router Skema Aktif</p>
        <div className="instance-status-box">
          <div className="status-row">
            <span className="status-label">Status Router Multi-Tenant:</span>
            <strong className="status-badge">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              Neon Multi-Tenant Active &amp; Isolated
            </strong>
          </div>
          <div className="status-row">
            <span className="status-label">Status Skema Klien Terdaftar:</span>
            <span className="status-highlight">5 Tenant Schemas (Live &amp; Provisioned)</span>
          </div>
          <div className="status-row">
            <span className="status-label">PgBouncer Connection Pooling:</span>
            <code>Port 6543 (Transaction Pooler - Zero Leak)</code>
          </div>
          <div className="status-row">
            <span className="status-label">Pencegahan Tabrakan Data:</span>
            <span className="status-highlight">Tingkat Namespace Database (Zero Collision Guaranteed)</span>
          </div>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Backup Cloud Terjadwal &amp; Disaster Recovery</p>
        <div className="backup-callout-card">
          <div className="callout-info">
            <strong>Pencadangan Database &amp; Recovery Tool</strong>
            <span>
              Otomasi snapshot aktif harian (02:00 WIB / 19:00 UTC) via penjadwal cloud.
              Buat snapshot on-demand atau pulihkan seluruh database tenant kapan saja.
            </span>
          </div>
          <Link href="/settings/backup" className="callout-btn">
            Buka Modul Backup
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Billing & Rekening Vendor ───────────────────────────────────────────
function BillingVendorSection() {
  const [bcaAccount, setBcaAccount] = useState("8720-9918-22");
  const [bcaHolder, setBcaHolder] = useState("PT Baitybites Teknologi Nusantara");
  const [mandiriAccount, setMandiriAccount] = useState("123-00-9876543-1");
  const [mandiriHolder, setMandiriHolder] = useState("PT Baitybites Teknologi Nusantara");
  const [invoiceDueDays, setInvoiceDueDays] = useState("3");
  const [invoiceNote, setInvoiceNote] = useState(
    "Mohon sertakan Nomor Invoice atau Kode Unik pada berita transfer pembayaran langganan Baitybites ORM."
  );

  return (
    <div className="settings-panel__body">
      <div className="settings-info-card settings-info-card--primary">
        <HugeiconsIcon icon={Invoice01Icon} size={20} />
        <div>
          <strong>Rekening Resmi Penerimaan Langganan Vendor</strong>
          <p>
            Rekening bank di bawah ini digunakan secara otomatis pada <strong>Modal Invoice</strong> dan
            lampiran email penagihan ke klien saat mereka memesan paket langganan Baitybites ORM.
          </p>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Rekening Bank Utama (BCA)</p>
        <div className="settings-field-row">
          <label className="settings-field">
            <span>Nomor Rekening BCA</span>
            <input
              value={bcaAccount}
              onChange={(e) => setBcaAccount(e.target.value)}
              type="text"
              placeholder="Contoh: 8720-9918-22"
            />
          </label>
          <label className="settings-field">
            <span>Atas Nama Penerima (Nama Rekening)</span>
            <input
              value={bcaHolder}
              onChange={(e) => setBcaHolder(e.target.value)}
              type="text"
              placeholder="PT Baitybites Teknologi Nusantara"
            />
          </label>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Rekening Bank Kedua (Mandiri - Cadangan)</p>
        <div className="settings-field-row">
          <label className="settings-field">
            <span>Nomor Rekening Mandiri</span>
            <input
              value={mandiriAccount}
              onChange={(e) => setMandiriAccount(e.target.value)}
              type="text"
              placeholder="Contoh: 123-00-9876543-1"
            />
          </label>
          <label className="settings-field">
            <span>Atas Nama Penerima</span>
            <input
              value={mandiriHolder}
              onChange={(e) => setMandiriHolder(e.target.value)}
              type="text"
              placeholder="PT Baitybites Teknologi Nusantara"
            />
          </label>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Kebijakan Penagihan &amp; Catatan Invoice</p>
        <label className="settings-field">
          <span>Batas Waktu Jatuh Tempo Invoice (Hari)</span>
          <input
            value={invoiceDueDays}
            onChange={(e) => setInvoiceDueDays(e.target.value)}
            type="number"
            min={1}
            max={30}
          />
          <span className="settings-field__hint">
            Jumlah hari sebelum invoice kadaluarsa jika belum dilakukan verifikasi mutasi transfer.
          </span>
        </label>
        <label className="settings-field">
          <span>Catatan Kaki Invoice Resmi</span>
          <textarea
            value={invoiceNote}
            onChange={(e) => setInvoiceNote(e.target.value)}
            rows={3}
            placeholder="Catatan transfer untuk klien"
          />
        </label>
      </div>
    </div>
  );
}

// ─── 4. Email & Notifikasi Gateway ───────────────────────────────────────────
function GatewayNotifikasiSection() {
  const [senderEmail, setSenderEmail] = useState("system@baitybites.site");
  const [senderName, setSenderName] = useState("Baitybites ORM Platform");

  return (
    <div className="settings-panel__body">
      <div className="settings-section-group">
        <p className="settings-section-group__title">Pengirim Email Transaksional (Brevo &amp; Resend)</p>
        <div className="settings-field-row">
          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Mail01Icon} size={14} />
              Alamat Email Pengirim (Sender Email)
            </span>
            <input
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              type="email"
              placeholder="system@baitybites.site"
            />
          </label>

          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Building02Icon} size={14} />
              Nama Tampilan Pengirim (Sender Name)
            </span>
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              type="text"
              placeholder="Baitybites ORM Platform"
            />
          </label>
        </div>
        <div className="settings-field">
          <span className="settings-field__hint">
            Kredensial API Key diamankan via server environment secret <code>BREVO_API_KEY</code> &amp; <code>RESEND_API_KEY</code>.
          </span>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Otomasi Notifikasi Platform SaaS</p>
        <SettingsToggle
          id="notif-invoice"
          label="Kirim Invoice & Rekening Otomatis"
          description="Otomatis kirimkan email rincian invoice dan rekening transfer vendor saat admin mengklik Kirim Invoice di kurasi Leads."
          defaultChecked={true}
        />
        <SettingsToggle
          id="notif-onboarding"
          label="Kirim Undangan Onboarding Klien"
          description="Otomatis kirimkan tautan wizard onboarding dan kredensial akses saat repositori klien selesai diprovisioning."
          defaultChecked={true}
        />
        <SettingsToggle
          id="notif-lead-alert"
          label="Alert Lead Baru ke Platform Owner"
          description="Kirimkan notifikasi instan ke WhatsApp / Email Vendor saat calon klien baru mengisi form pendaftaran di landing page."
          defaultChecked={true}
        />
        <SettingsToggle
          id="notif-backup-failure"
          label="Peringatan Darurat Kegagalan Backup"
          description="Kirimkan alert prioritas tinggi kepada superadmin jika snapshot database cloud harian mengalami kendala."
          defaultChecked={true}
        />
      </div>
    </div>
  );
}

// ─── 5. Paket Lisensi & Kuota ────────────────────────────────────────────────
function PaketLisensiSection() {
  const [gracePeriod, setGracePeriod] = useState("7");
  const [snapshotRetention, setSnapshotRetention] = useState("30");

  return (
    <div className="settings-panel__body">
      <div className="settings-section-group">
        <p className="settings-section-group__title">Katalog Tingkatan Paket Langganan SaaS</p>
        <div className="settings-pricing-grid">
          <div className="pricing-card">
            <span className="tier-tag">Paket Dasar</span>
            <h3>Starter Instance</h3>
            <div className="tier-price">
              Rp 299.000 <span>/ bulan</span>
            </div>
            <ul className="tier-features">
              <li>1 Cabang Toko Kuliner</li>
              <li>Maks. 100 Menu / Produk</li>
              <li>2 Akun Staf / Kasir POS</li>
              <li>Multi-Tenant Isolated Schema</li>
              <li>Manual WhatsApp Ordering</li>
            </ul>
          </div>

          <div className="pricing-card pricing-card--featured">
            <span className="tier-tag tier-tag--featured">Paling Populer</span>
            <h3>Business Pro</h3>
            <div className="tier-price">
              Rp 699.000 <span>/ bulan</span>
            </div>
            <ul className="tier-features">
              <li>Hingga 3 Cabang Toko</li>
              <li>Unlimited Menu / Produk</li>
              <li>10 Akun Staf (Kasir + Dapur)</li>
              <li>Kitchen Display System (KDS)</li>
              <li>Integrasi WhatsApp Bot Otomatis</li>
            </ul>
          </div>

          <div className="pricing-card">
            <span className="tier-tag">Dedicated</span>
            <h3>Enterprise</h3>
            <div className="tier-price">
              Rp 1.499.000 <span>/ bulan</span>
            </div>
            <ul className="tier-features">
              <li>Unlimited Cabang &amp; Outlet</li>
              <li>100% Isolated Database Schema (Neon PostgreSQL)</li>
              <li>Prioritas SLA 99.9% High Availability</li>
              <li>Dukungan Custom Domain Mandiri</li>
              <li>Akses API &amp; Webhook Lengkap</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Kebijakan Grace Period &amp; Retensi Data Klien</p>
        <div className="settings-field-row">
          <label className="settings-field">
            <span>Masa Grace Period Penagihan (Hari)</span>
            <input
              value={gracePeriod}
              onChange={(e) => setGracePeriod(e.target.value)}
              type="number"
              min={1}
              max={30}
            />
            <span className="settings-field__hint">
              Waktu toleransi bagi klien untuk memperpanjang langganan sebelum akses instance dinonaktifkan sementara.
            </span>
          </label>

          <label className="settings-field">
            <span>Retensi File Snapshot Cadangan (Hari)</span>
            <input
              value={snapshotRetention}
              onChange={(e) => setSnapshotRetention(e.target.value)}
              type="number"
              min={7}
              max={90}
            />
            <span className="settings-field__hint">
              Lama penyimpanan snapshot database JSON di cloud sebelum file terlama dibersihkan otomatis.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── 6. Tim Superadmin Platform ──────────────────────────────────────────────
function PenggunaAksesSection() {
  return (
    <div className="settings-panel__body">
      <div className="settings-info-card settings-info-card--primary">
        <HugeiconsIcon icon={UserStar01Icon} size={20} />
        <div>
          <strong>Tata Kelola Superadmin Platform Owner</strong>
          <p>
            Kelola akun internal platform yang memiliki wewenang mengonfigurasi router database,
            mengurasi prospek klien, dan melakukan rilis versi cetak biru Baitybites ORM.
          </p>
        </div>
        <Link href="/settings/admins" className="settings-info-card__cta">
          Kelola Superadmin
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
        </Link>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Standar Keamanan Sesi &amp; Akses Platform</p>
        <SettingsToggle
          id="sec-session-timeout"
          label="Auto-Logout Sesi Superadmin Tidak Aktif"
          description="Otomatis mengeluarkan sesi superadmin jika tidak ada interaksi selama 60 menit berturut-turut."
          defaultChecked={true}
        />
        <SettingsToggle
          id="sec-audit-log"
          label="Pencatatan Audit Log Perubahan Skema"
          description="Rekam jejak setiap aksi mutasi status leads, eksekusi provisioning repositori, dan pemulihan snapshot database."
          defaultChecked={true}
        />
      </div>
    </div>
  );
}

// ─── Panel Mapping ────────────────────────────────────────────────────────────
const SECTION_PANEL: Record<
  string,
  { description: string; component: React.ReactNode }
> = {
  "profil-platform": {
    description: "Identitas resmi platform SaaS, badan usaha vendor, domain publik, dan kontak dukungan B2B.",
    component: <ProfilPlatformSection />,
  },
  "multi-tenant-engine": {
    description: "Infrastruktur database Neon PostgreSQL, router skema terisolasi, dan master blueprint upstream repositori.",
    component: <MultiTenantEngineSection />,
  },
  "billing-vendor": {
    description: "Rekening resmi bank vendor untuk penagihan transfer invoice otomatis dan kebijakan jatuh tempo langganan.",
    component: <BillingVendorSection />,
  },
  "gateway-notifikasi": {
    description: "Pengaturan pengirim email Brevo / Resend dan otomasi notifikasi transaksional onboarding klien.",
    component: <GatewayNotifikasiSection />,
  },
  "paket-lisensi": {
    description: "Struktur tingkatan paket langganan (tiers), batasan kuota cabang/staf, dan kebijakan retensi data.",
    component: <PaketLisensiSection />,
  },
  "pengguna-akses": {
    description: "Akses superadmin internal platform dan standar keamanan sesi backoffice.",
    component: <PenggunaAksesSection />,
  },
};

// ─── Page Component ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeId, setActiveId] = useState("profil-platform");
  const [saved, setSaved] = useState(false);

  const activeSection = SECTIONS.find((s) => s.id === activeId)!;
  const activePanel = SECTION_PANEL[activeId];

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AppShell>
      <div className="settings-page">
        {/* HEADING */}
        <header className="settings-page__heading">
          <div>
            <p className="eyebrow">BAITYBITES ORM / PLATFORM OWNER SETTINGS</p>
            <h1>Pengaturan Platform SaaS</h1>
            <p className="settings-page__desc">
              Kelola konfigurasi global multi-tenant engine, rekening pembayaran langganan vendor, email transactional gateway, dan tata kelola platform.
            </p>
          </div>

          <button className="settings-page__save" type="button" onClick={handleSave}>
            {saved ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={1.8} />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={FloppyDiskIcon} size={18} strokeWidth={1.8} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </header>

        {/* LAYOUT */}
        <div className="settings-layout">
          {/* ASIDE MENU */}
          <aside className="settings-menu" aria-label="Menu Pengaturan Platform">
            {SECTIONS.map((section) => (
              <button
                type="button"
                className={`settings-menu__item ${activeId === section.id ? "is-active" : ""}`}
                onClick={() => setActiveId(section.id)}
                key={section.id}
              >
                <span className="settings-menu__item-icon">
                  <HugeiconsIcon icon={section.icon} size={16} strokeWidth={1.8} />
                </span>
                <span className="settings-menu__item-label">{section.label}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
              </button>
            ))}
          </aside>

          {/* PANEL */}
          <section className="settings-panel" key={activeId}>
            <div className="settings-panel__heading">
              <div className="settings-panel__heading-icon">
                <HugeiconsIcon icon={activeSection.icon} size={18} strokeWidth={1.8} />
              </div>
              <div>
                <h2>{activeSection.label}</h2>
                <p>{activePanel.description}</p>
              </div>
            </div>
            {activePanel.component}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
