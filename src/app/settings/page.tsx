"use client";

import { useState } from "react";
import { ArrowRight01Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import "./settings.scss";

const sections = [
  "Profil Bisnis",
  "Notifikasi",
  "Pengguna & Akses",
  "Integrasi WhatsApp",
  "Preferensi Order",
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(sections[0]);

  return (
    <AppShell>
      <div className="settings-page">
        {/* HEADING */}
        <header className="settings-page__heading">
          <div>
            <p className="eyebrow">BAITYBITES OMS / ADMINISTRATION</p>
            <h1>Settings</h1>
            <p className="settings-page__desc">
              Atur preferensi kerja tim, identitas bisnis, dan integrasi operasional Baitybites.
            </p>
          </div>

          <button className="settings-page__save" type="button">
            <HugeiconsIcon icon={FloppyDiskIcon} size={18} strokeWidth={1.8} />
            <span>Simpan Perubahan</span>
          </button>
        </header>

        {/* LAYOUT */}
        <div className="settings-layout">
          {/* MENU */}
          <aside className="settings-menu" aria-label="Menu Pengaturan">
            {sections.map((section) => (
              <button
                type="button"
                className={`settings-menu__item ${activeSection === section ? "is-active" : ""}`}
                onClick={() => setActiveSection(section)}
                key={section}
              >
                <span>{section}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
              </button>
            ))}
          </aside>

          {/* PANEL */}
          <section className="settings-panel">
            <div className="settings-panel__heading">
              <h2>{activeSection}</h2>
              <p>Pengaturan ini digunakan untuk kebutuhan operasional internal dan komunikasi pelanggan.</p>
            </div>

            <div className="settings-panel__body">
              <label className="settings-field">
                <span>Nama Bisnis</span>
                <input defaultValue="Baitybites" type="text" />
              </label>

              <label className="settings-field">
                <span>Email Operasional</span>
                <input defaultValue="hello@baitybites.id" type="email" />
              </label>

              <label className="settings-field">
                <span>Nomor WhatsApp Utama</span>
                <input defaultValue="+62 812 0000 0000" type="tel" />
              </label>

              <div className="settings-toggle">
                <div>
                  <strong>Notifikasi Order Baru</strong>
                  <small>Kirim notifikasi otomatis saat pesanan WhatsApp baru masuk.</small>
                </div>
                <input type="checkbox" defaultChecked />
              </div>

              <div className="settings-toggle">
                <div>
                  <strong>Mode Verifikasi Manual</strong>
                  <small>Setiap order baru perlu diverifikasi admin sebelum dialirkan ke antrean kitchen.</small>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
