"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store01Icon,
  Notification01Icon,
  UserStar01Icon,
  WhatsappIcon,
  Settings01Icon,
  FloppyDiskIcon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Building02Icon,
  Call02Icon,
  Location01Icon,
  MailAtSign01Icon,
  Clock01Icon,
  ShoppingBag01Icon,
  ArrowUpDownIcon,
  Note01Icon,
  PrinterIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import "./settings.scss";

// ─── Section config ───────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "profil-bisnis", label: "Profil Bisnis", icon: Store01Icon },
  { id: "notifikasi", label: "Notifikasi", icon: Notification01Icon },
  { id: "pengguna-akses", label: "Pengguna & Akses", icon: UserStar01Icon },
  { id: "integrasi-wa", label: "Integrasi WhatsApp", icon: WhatsappIcon },
  { id: "preferensi-order", label: "Preferensi Order", icon: Settings01Icon },
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

// ─── Section: Profil Bisnis ───────────────────────────────────────────────────
function ProfilBisnisSection() {
  return (
    <div className="settings-panel__body">
      <div className="settings-section-group">
        <p className="settings-section-group__title">Identitas Bisnis</p>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Building02Icon} size={14} />
            Nama Bisnis
          </span>
          <input defaultValue="Baitybites" type="text" placeholder="Nama toko / bisnis" />
        </label>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={MailAtSign01Icon} size={14} />
            Email Operasional
          </span>
          <input defaultValue="hello@baitybites.id" type="email" placeholder="email@domain.com" />
        </label>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Call02Icon} size={14} />
            Nomor WhatsApp Utama
          </span>
          <input defaultValue="+62 812 0000 0000" type="tel" placeholder="+62 8xx xxxx xxxx" />
        </label>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Lokasi & Operasional</p>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Location01Icon} size={14} />
            Alamat Toko / Dapur
          </span>
          <textarea
            defaultValue="Jl. Contoh No. 1, Jakarta Selatan, DKI Jakarta 12345"
            rows={3}
            placeholder="Alamat lengkap"
          />
        </label>
        <div className="settings-field-row">
          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              Jam Buka
            </span>
            <input defaultValue="07:00" type="time" />
          </label>
          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              Jam Tutup
            </span>
            <input defaultValue="21:00" type="time" />
          </label>
        </div>
        <label className="settings-field">
          <span>Catatan Operasional</span>
          <textarea
            defaultValue=""
            rows={2}
            placeholder="Contoh: Tutup setiap hari Minggu. Min. order 5 pcs."
          />
        </label>
      </div>
    </div>
  );
}

// ─── Section: Notifikasi ──────────────────────────────────────────────────────
function NotifikasiSection() {
  return (
    <div className="settings-panel__body">
      <div className="settings-section-group">
        <p className="settings-section-group__title">Notifikasi Order</p>
        <SettingsToggle
          id="notif-order-baru"
          label="Order Baru Masuk"
          description="Kirim notifikasi ke admin saat ada pesanan baru yang diterima dari WhatsApp atau form online."
          defaultChecked
        />
        <SettingsToggle
          id="notif-order-diproses"
          label="Order Mulai Diproses"
          description="Notifikasi saat order berpindah ke status 'Diproses' oleh tim kitchen."
          defaultChecked
        />
        <SettingsToggle
          id="notif-order-siap"
          label="Order Siap Kirim / Ambil"
          description="Pemberitahuan ketika pesanan selesai diproduksi dan siap untuk pengiriman atau ambil mandiri."
          defaultChecked
        />
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Notifikasi Produksi</p>
        <SettingsToggle
          id="notif-stok"
          label="Peringatan Stok Menipis"
          description="Notifikasi otomatis jika item produksi mendekati batas minimum yang ditentukan."
        />
        <SettingsToggle
          id="notif-jadwal"
          label="Pengingat Jadwal Produksi Harian"
          description="Ingatkan tim setiap pagi pukul 06:00 tentang jadwal produksi hari ini."
          defaultChecked
        />
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Saluran Notifikasi</p>
        <SettingsToggle
          id="notif-wa-admin"
          label="Kirim via WhatsApp ke Admin"
          description="Forward notifikasi penting ke nomor WhatsApp admin utama yang terdaftar."
          defaultChecked
        />
        <SettingsToggle
          id="notif-browser"
          label="Notifikasi Browser (Push)"
          description="Tampilkan notifikasi browser saat dasbor OMS sedang terbuka di perangkat."
        />
      </div>
    </div>
  );
}

// ─── Section: Pengguna & Akses ────────────────────────────────────────────────
function PenggunaAksesSection() {
  return (
    <div className="settings-panel__body">
      <div className="settings-info-card">
        <HugeiconsIcon icon={UserStar01Icon} size={20} />
        <div>
          <strong>Manajemen Admin OMS</strong>
          <p>
            Kelola akun admin, atur peran, dan kontrol hak akses ke fitur OMS dari halaman khusus
            Pengguna &amp; Akses.
          </p>
        </div>
        <Link href="/settings/admins" className="settings-info-card__cta">
          Buka Halaman Admin
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
        </Link>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Kebijakan Keamanan</p>
        <SettingsToggle
          id="akses-pin-wajib"
          label="Wajibkan Security PIN saat Login Admin"
          description="Setiap admin harus memasukkan PIN 4-digit selain username dan password."
          defaultChecked
        />
        <SettingsToggle
          id="akses-sesi-otomatis"
          label="Auto-logout Setelah Tidak Aktif 2 Jam"
          description="Sesi admin akan otomatis berakhir jika tidak ada aktivitas selama 2 jam."
          defaultChecked
        />
        <SettingsToggle
          id="akses-log-aktivitas"
          label="Catat Log Aktivitas Admin"
          description="Simpan riwayat aktivitas setiap admin (login, ubah order, hapus data) untuk audit."
        />
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Kontrol Akses Fitur</p>
        <SettingsToggle
          id="akses-kitchen-publik"
          label="Kitchen Display Tanpa Login"
          description="Izinkan halaman Kitchen Display diakses tanpa autentikasi admin (untuk layar dapur)."
          defaultChecked
        />
        <SettingsToggle
          id="akses-tracking-publik"
          label="Tracking Order Publik"
          description="Pelanggan dapat melacak status pesanan tanpa login melalui halaman tracking."
          defaultChecked
        />
      </div>
    </div>
  );
}

// ─── Section: Integrasi WhatsApp ──────────────────────────────────────────────
function IntegrasiWASection() {
  const [waMode, setWaMode] = useState<"manual" | "api">("manual");

  return (
    <div className="settings-panel__body">
      <div className="settings-section-group">
        <p className="settings-section-group__title">Mode Integrasi</p>
        <div className="settings-radio-group">
          <label className={`settings-radio-card ${waMode === "manual" ? "is-selected" : ""}`}>
            <input
              type="radio"
              name="wa-mode"
              value="manual"
              checked={waMode === "manual"}
              onChange={() => setWaMode("manual")}
            />
            <div>
              <strong>Manual (Link wa.me)</strong>
              <small>
                Tombol pesan membuka WhatsApp dengan template pesan otomatis. Tidak butuh API key.
                Cocok untuk bisnis kecil–menengah.
              </small>
            </div>
          </label>
          <label className={`settings-radio-card ${waMode === "api" ? "is-selected" : ""}`}>
            <input
              type="radio"
              name="wa-mode"
              value="api"
              checked={waMode === "api"}
              onChange={() => setWaMode("api")}
            />
            <div>
              <strong>WhatsApp Business API</strong>
              <small>
                Integrasi penuh dengan WhatsApp Cloud API untuk pengiriman pesan otomatis, konfirmasi
                order, dan tracking real-time.
              </small>
            </div>
          </label>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Nomor & Template</p>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={WhatsappIcon} size={14} />
            Nomor WhatsApp Bisnis
          </span>
          <input defaultValue="+62 812 0000 0000" type="tel" placeholder="+62 8xx xxxx xxxx" />
        </label>
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={Note01Icon} size={14} />
            Template Pesan Order Baru
          </span>
          <textarea
            defaultValue={`Halo Baitybites! Saya ingin memesan:\n\n{{order_detail}}\n\nNama: {{nama}}\nAlamat: {{alamat}}\n\nMohon dikonfirmasi. Terima kasih!`}
            rows={6}
            placeholder="Template pesan otomatis"
          />
          <small className="settings-field__hint">
            Gunakan <code>{"{{order_detail}}"}</code>, <code>{"{{nama}}"}</code>,{" "}
            <code>{"{{alamat}}"}</code> sebagai variabel dinamis.
          </small>
        </label>
      </div>

      {waMode === "api" && (
        <div className="settings-section-group">
          <p className="settings-section-group__title">Konfigurasi WhatsApp Cloud API</p>
          <label className="settings-field">
            <span>Phone Number ID</span>
            <input type="text" placeholder="Contoh: 123456789012345" />
          </label>
          <label className="settings-field">
            <span>WhatsApp Business Account ID</span>
            <input type="text" placeholder="Contoh: 987654321098765" />
          </label>
          <label className="settings-field">
            <span>Access Token</span>
            <input type="password" placeholder="EAA..." />
          </label>
          <div className="settings-api-note">
            <span>ℹ️</span>
            <span>
              Dapatkan token dari{" "}
              <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
                Meta for Developers
              </a>
              . Token harus memiliki izin <code>whatsapp_business_messaging</code>.
            </span>
          </div>
        </div>
      )}

      <div className="settings-section-group">
        <p className="settings-section-group__title">Otomatisasi Pesan</p>
        <SettingsToggle
          id="wa-konfirmasi-otomatis"
          label="Kirim Konfirmasi Order Otomatis"
          description="Kirim pesan konfirmasi ke pelanggan segera setelah order diterima dan diverifikasi admin."
          defaultChecked
        />
        <SettingsToggle
          id="wa-status-update"
          label="Update Status Real-time ke Pelanggan"
          description="Beritahu pelanggan saat pesanan berpindah status: Diproses → Siap Kirim → Terkirim."
        />
      </div>
    </div>
  );
}

// ─── Section: Preferensi Order ────────────────────────────────────────────────
function PreferensiOrderSection() {
  return (
    <div className="settings-panel__body">
      <div className="settings-section-group">
        <p className="settings-section-group__title">Alur Penerimaan Order</p>
        <SettingsToggle
          id="order-verifikasi-manual"
          label="Verifikasi Manual oleh Admin"
          description="Setiap order baru wajib dikonfirmasi admin sebelum masuk ke antrean kitchen."
          defaultChecked
        />
        <SettingsToggle
          id="order-auto-assign"
          label="Auto-assign Order ke Kitchen"
          description="Order yang sudah diverifikasi langsung diteruskan ke kitchen tanpa langkah manual."
          defaultChecked
        />
        <SettingsToggle
          id="order-allow-edit"
          label="Izinkan Edit Order Setelah Konfirmasi"
          description="Admin dapat mengubah detail order setelah dikonfirmasi jika ada permintaan pelanggan."
        />
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Penomoran & Referensi Order</p>
        <div className="settings-field-row">
          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={ShoppingBag01Icon} size={14} />
              Prefix Nomor Order
            </span>
            <input defaultValue="BB" type="text" maxLength={5} placeholder="BB" />
          </label>
          <label className="settings-field">
            <span>
              <HugeiconsIcon icon={ArrowUpDownIcon} size={14} />
              Urutan Tampilan Order
            </span>
            <select defaultValue="newest">
              <option value="newest">Terbaru di atas</option>
              <option value="oldest">Terlama di atas</option>
              <option value="priority">Prioritas</option>
            </select>
          </label>
        </div>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Pengiriman & Pengambilan</p>
        <SettingsToggle
          id="order-self-pickup"
          label="Aktifkan Opsi Ambil Sendiri (Pickup)"
          description="Tampilkan opsi 'Ambil di Toko' saat pelanggan melakukan pemesanan."
          defaultChecked
        />
        <SettingsToggle
          id="order-delivery"
          label="Aktifkan Opsi Pengiriman"
          description="Pelanggan dapat memilih pengiriman via kurir atau ojek online."
          defaultChecked
        />
        <label className="settings-field">
          <span>Radius Pengiriman Maksimum (km)</span>
          <input defaultValue="15" type="number" min={1} max={100} />
        </label>
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Pencetakan & Dokumentasi</p>
        <SettingsToggle
          id="order-auto-print"
          label="Cetak Struk Otomatis Saat Order Terkonfirmasi"
          description="Kirim perintah cetak ke printer thermal saat order baru dikonfirmasi admin."
        />
        <label className="settings-field">
          <span>
            <HugeiconsIcon icon={PrinterIcon} size={14} />
            IP Address Printer Thermal
          </span>
          <input defaultValue="" type="text" placeholder="192.168.1.xxx" />
        </label>
        <SettingsToggle
          id="order-include-notes"
          label="Sertakan Catatan Pelanggan di Struk"
          description="Tampilkan kolom 'Catatan Khusus' dari pelanggan pada struk cetak."
          defaultChecked
        />
      </div>

      <div className="settings-section-group">
        <p className="settings-section-group__title">Minimum & Batas Order</p>
        <div className="settings-field-row">
          <label className="settings-field">
            <span>Minimum Nilai Order (Rp)</span>
            <input defaultValue="25000" type="number" min={0} step={1000} />
          </label>
          <label className="settings-field">
            <span>Maksimum Item per Order</span>
            <input defaultValue="20" type="number" min={1} max={100} />
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Panel map ────────────────────────────────────────────────────────────────
const SECTION_PANEL: Record<
  string,
  { description: string; component: React.ReactNode }
> = {
  "profil-bisnis": {
    description: "Identitas dan informasi operasional bisnis Baitybites yang tampil di dokumen dan komunikasi pelanggan.",
    component: <ProfilBisnisSection />,
  },
  notifikasi: {
    description: "Atur saluran dan jenis notifikasi yang diterima admin dan tim operasional.",
    component: <NotifikasiSection />,
  },
  "pengguna-akses": {
    description: "Kelola akun admin, peran, dan kebijakan keamanan akses ke sistem OMS.",
    component: <PenggunaAksesSection />,
  },
  "integrasi-wa": {
    description: "Konfigurasi integrasi WhatsApp untuk penerimaan order dan komunikasi otomatis dengan pelanggan.",
    component: <IntegrasiWASection />,
  },
  "preferensi-order": {
    description: "Tentukan alur kerja order, format penomoran, opsi pengiriman, dan pengaturan pencetakan.",
    component: <PreferensiOrderSection />,
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeId, setActiveId] = useState("profil-bisnis");
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
            <p className="eyebrow">BAITYBITES OMS / ADMINISTRATION</p>
            <h1>Pengaturan</h1>
            <p className="settings-page__desc">
              Atur preferensi kerja tim, identitas bisnis, dan integrasi operasional Baitybites.
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
          <aside className="settings-menu" aria-label="Menu Pengaturan">
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
