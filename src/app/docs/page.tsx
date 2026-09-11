import Link from "next/link";
import { ArrowRight01Icon, HelpCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import "./docs.scss";

const docs = [
  ["Memulai dengan Baitybites OMS", "Panduan ringkas untuk memahami alur order masuk, konfirmasi pembayaran, sampai pengiriman."],
  ["SOP Produksi Risol Premium", "Standar batch mixing, rolling, coating, quality check, dan pencatatan hasil produksi harian."],
  ["Mengelola Alur Status Order", "Pelajari kapan order berpindah dari konfirmasi ke antrean kitchen, packing, hingga kurir pick up."],
  ["Integrasi WhatsApp Direct", "Referensi format pesan otomatis, templating notifikasi, dan webhook integrasi."],
];

export default function DocsPage() {
  return (
    <AppShell>
      <div className="docs-page">
        <header className="docs-page__heading">
          <p className="eyebrow">BAITYBITES OMS / KNOWLEDGE BASE</p>
          <h1>Dokumentasi</h1>
          <p className="docs-page__intro">
            Panduan operasional dan referensi kerja standar untuk seluruh tim Baitybites.
          </p>
        </header>

        <div className="docs-page__grid">
          {docs.map(([title, description], index) => (
            <Link href="/docs" className="docs-card" key={title}>
              <span className="docs-card__index">0{index + 1}</span>
              <div className="docs-card__content">
                <h2>{title}</h2>
                <p>{description}</p>
                <strong className="docs-card__link">
                  <span>Baca panduan</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={1.8} />
                </strong>
              </div>
            </Link>
          ))}
        </div>

        <section className="docs-page__support">
          <div className="docs-page__support-text">
            <small>MASIH BUTUH BANTUAN?</small>
            <h2>Hubungi Tim Operasional</h2>
            <p>
              Ada kendala dengan alur pesanan atau inventaris? Diskusikan dengan tim support teknis internal.
            </p>
          </div>

          <button className="docs-page__support-btn" type="button">
            <HugeiconsIcon icon={HelpCircleIcon} size={18} strokeWidth={1.8} />
            <span>Buka Channel Support</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
