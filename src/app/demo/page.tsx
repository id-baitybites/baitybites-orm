import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Store01Icon,
  KitchenUtensilsIcon,
  ShoppingBag01Icon,
  RocketIcon,
  ArrowRight01Icon,
  SparklesIcon,
  CheckmarkCircle02Icon,
  SecurityCheckIcon,
  Database01Icon,
  HelpCircleIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import platformIcon from "@/app/icon.png";
import "./demo-hub.scss";

export const metadata: Metadata = {
  title: "Pusat Demo Interaktif & Simulasi Role | Baitybites ORM SaaS",
  description:
    "Uji coba langsung 4 modul SaaS Baitybites ORM: Toko Online Pembeli, Layar Kitchen Display Dapur, Panel Kasir OMS, dan Onboarding Wizard Mandiri.",
};

const DEMO_MODULES = [
  {
    id: "storefront",
    role: "Sebagai Pembeli (Konsumen)",
    title: "E-Commerce Storefront F&B",
    icon: ShoppingBag01Icon,
    accent: "orange",
    url: "/order",
    tag: "Toko Online Pelanggan",
    description:
      "Simulasi belanja produk kuliner: memilih menu frozen & siap saji, kalkulator otomatis ongkos kirim Paxel Cold-Chain, dan simulasi checkout via WhatsApp.",
    features: [
      "Katalog responsif & search instan",
      "Kalkulasi tarif Paxel Cold-Chain per kota",
      "Format order otomatis ke WhatsApp",
      "Pencatatan nomor referensi order real-time",
    ],
    ctaText: "Buka Storefront Pembeli",
  },
  {
    id: "kds",
    role: "Sebagai Tim Dapur / Chef",
    title: "Kitchen Display System (KDS)",
    icon: KitchenUtensilsIcon,
    accent: "amber",
    url: "/kitchen",
    tag: "Layar Monitor Dapur",
    description:
      "Layar operasional dapur interaktif: pesanan dari storefront langsung muncul di sini secara real-time dengan timer masak dan penanda siap saji.",
    features: [
      "Antrean pesanan real-time tanpa kertas",
      "Timer persiapan & indikator prioritas",
      "Ubah status masak dalam 1 klik",
      "Optimal untuk tablet / monitor dapur",
    ],
    ctaText: "Buka Layar Dapur (KDS)",
  },
  {
    id: "oms",
    role: "Sebagai Kasir & Manajer",
    title: "Order Management & Panel Kasir",
    icon: Store01Icon,
    accent: "blue",
    url: "/admin",
    tag: "Panel Manajemen Toko",
    description:
      "Pusat kendali operasional restoran: validasi pembayaran, kelola katalog produk & stok, pantau riwayat order, dan role-based access kasir.",
    features: [
      "Multi-Role: Kasir, Kitchen Staff, Super Admin",
      "Update status pesanan & resi kurir",
      "Manajemen stok & katalog produk",
      "Akses demo kasir cepat (PIN: 1234)",
    ],
    ctaText: "Masuk ke Panel OMS",
  },
  {
    id: "onboarding",
    role: "Sebagai Pemilik Brand F&B Baru",
    title: "Self-Service Onboarding Wizard",
    icon: RocketIcon,
    accent: "emerald",
    url: "/onboarding",
    tag: "Setup Toko Baru (3 Menit)",
    description:
      "Simulasi bagaimana pemilik bisnis kuliner baru menyiapkan toko online mereka: input profil brand, warna tema, logo, dan auto-provision database.",
    features: [
      "Form identitas & kontak WhatsApp brand",
      "Pilihan palet warna & tema otomatis",
      "Auto-trigger provisioning skema DB",
      "Generate instance website langsung aktif",
    ],
    ctaText: "Mulai Onboarding Wizard",
  },
];

export default function DemoHubPage() {
  return (
    <div className="demo-hub-page">
      {/* ── Top Navbar ── */}
      <header className="demo-hub-nav">
        <div className="demo-hub-nav__inner">
          <Link href="/platform" className="demo-hub-brand">
            <Image
              src={platformIcon}
              alt="Baitybites ORM"
              width={32}
              height={32}
              className="brand-logo"
            />
            <div className="brand-text">
              <span className="name">Baitybites ORM</span>
              <span className="badge">Interactive Demo Hub</span>
            </div>
          </Link>

          <div className="demo-hub-nav__links">
            <Link href="/platform" className="nav-back-link">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
              <span>Halaman Utama SaaS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Header ── */}
      <section className="demo-hub-hero">
        <div className="demo-hub-hero__inner">
          <div className="eyebrow-pill">
            <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2.2} />
            <span>Pusat Uji Coba Multi-Role Platform</span>
          </div>

          <h1>
            Simulasi Lengkap <br />
            <span className="gradient-text">Ekosistem F&amp;B Baitybites ORM</span>
          </h1>

          <p className="hero-desc">
            Platform kami menyediakan software engine terintegrasi untuk bisnis kuliner. Silakan pilih peran yang ingin Anda uji coba di bawah ini untuk merasakan alur pesanan dari hulu ke hilir:
          </p>
        </div>
      </section>

      {/* ── Grid Modul Demo ── */}
      <main className="demo-hub-grid-section">
        <div className="demo-hub-grid">
          {DEMO_MODULES.map((mod) => (
            <div key={mod.id} className={`demo-card is-${mod.accent}`}>
              <div className="demo-card__header">
                <span className="demo-card__role">{mod.role}</span>
                <span className="demo-card__tag">{mod.tag}</span>
              </div>

              <div className="demo-card__icon-wrap">
                <HugeiconsIcon icon={mod.icon} size={28} strokeWidth={1.8} />
              </div>

              <h2 className="demo-card__title">{mod.title}</h2>
              <p className="demo-card__desc">{mod.description}</p>

              <ul className="demo-card__features">
                {mod.features.map((f, i) => (
                  <li key={i}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} strokeWidth={2.2} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="demo-card__action">
                <Link href={mod.url} className="btn-card-cta">
                  <span>{mod.ctaText}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.2} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── FAQ Penjelas White-Label & Demo ── */}
      <section className="demo-hub-faq">
        <div className="demo-hub-faq__inner">
          <div className="faq-header">
            <HugeiconsIcon icon={HelpCircleIcon} size={24} strokeWidth={1.8} />
            <h3>Pertanyaan Seputar Demo &amp; Konsep White-Label</h3>
          </div>

          <div className="faq-grid">
            <div className="faq-item">
              <h4>Apakah Baitybites ORM menjual makanan secara langsung?</h4>
              <p>
                <strong>Bukan.</strong> Baitybites ORM adalah platform B2B Software-as-a-Service (SaaS). Menu risoles dan minuman di demo etalase merupakan <em>prototype percontohan</em> agar calon klien dapat merasakan alur belanja pelanggan secara nyata.
              </p>
            </div>

            <div className="faq-item">
              <h4>Apakah klien bisa menggunakan nama brand dan produk sendiri?</h4>
              <p>
                <strong>Tentu, 100% White-Label.</strong> Klien yang berlangganan dapat mengganti logo, nama toko, nomor WhatsApp, katalog makanan, harga, dan domain resmi (misal: <code>order.restorananda.com</code>) tanpa ada watermark platform.
              </p>
            </div>

            <div className="faq-item">
              <h4>Berapa akun login demo yang bisa dicoba?</h4>
              <p>
                Untuk modul Admin &amp; Kasir (<Link href="/admin">/admin</Link>), Anda dapat login menggunakan PIN Kasir: <code>1234</code> atau Superadmin: <code>8899</code>. Untuk modul Storefront dan KDS dapur dapat diakses langsung tanpa autentikasi.
              </p>
            </div>

            <div className="faq-item">
              <h4>Di mana sistem ini di-hosting?</h4>
              <p>
                Engine Next.js ini dioptimalkan khusus untuk deployment serverless berkecepatan tinggi di <strong>Vercel</strong> dengan database PostgreSQL terisolasi di <strong>Neon</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="demo-hub-footer">
        <p>© {new Date().getFullYear()} Baitybites ORM · Dedicated F&amp;B Engine &amp; E-Commerce Platform</p>
      </footer>
    </div>
  );
}
