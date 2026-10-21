import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import platformIcon from "@/app/icon.png";
import {
  SparklesIcon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Database01Icon,
  SecurityCheckIcon,
  KitchenUtensilsIcon,
  Settings01Icon,
  Store01Icon,
  ChartUpIcon,
  WhatsappIcon,
  RocketIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import "./platform.scss";
import PlatformPricing from "./PlatformPricing";

export const metadata: Metadata = {
  title: "Baitybites ORM — Platform E-Commerce & OMS Khusus Industri F&B Modern",
  description:
    "Software engine White-Label & Dedicated Instance untuk bisnis kuliner: toko online pintar, kitchen display system, integrasi WhatsApp, dan manajemen pesanan terpusat.",
};

const FEATURES = [
  {
    icon: Store01Icon,
    title: "Dedicated E-Commerce Storefront",
    desc: "Toko online interaktif siap pakai dengan katalog menu, opsi frozen/ready-to-eat, multi-varian, dan checkout instan via WhatsApp maupun payment gateway.",
  },
  {
    icon: KitchenUtensilsIcon,
    title: "Kitchen Display System (KDS)",
    desc: "Layar monitor dapur real-time untuk tim koki & peracik menu dengan status antrean, timer persiapan, dan penanda siap saji tanpa kertas nota.",
  },
  {
    icon: Database01Icon,
    title: "100% Dedicated Database Terisolasi",
    desc: "Bukan multi-tenant bersama. Setiap klien memiliki basis data & instance terisolasi sendiri, menjamin integritas data dan performa tinggi.",
  },
  {
    icon: WhatsappIcon,
    title: "Otomatisasi WhatsApp & Notifikasi",
    desc: "Konfirmasi pesanan otomatis, nota digital, dan pelacakan status pengantaran langsung ke WhatsApp pelanggan tanpa biaya pihak ketiga yang mahal.",
  },
  {
    icon: ChartUpIcon,
    title: "Laporan Produksi & Order OMS",
    desc: "Analisis penjualan harian, batching produksi harian, manajemen bahan baku, dan riwayat pesanan lengkap dalam satu dasbor terpadu.",
  },
  {
    icon: SecurityCheckIcon,
    title: "White-Label & Custom Branding",
    desc: "Sesuaikan brand identity, warna tema, domain sendiri, logo, banner promo, dan legalitas korporasi melalui panel Onboarding & CMS mandiri.",
  },
];

const PRICING_PLANS = [
  {
    name: "Starter Instance",
    badge: null,
    desc: "Cocok untuk kedai, cloud kitchen, atau bakery mandiri yang ingin mulai berjualan online secara profesional.",
    price: "Rp 1.490.000",
    period: "/ tahun",
    isFeatured: false,
    ctaText: "Mulai dengan Starter",
    features: [
      "1 Dedicated Instance Website & Subdomain",
      "Katalog Produk F&B Unlimited",
      "Integrasi WhatsApp Order & Checkout",
      "Kitchen Display Monitor (1 Layar Dapur)",
      "Panel Super Admin & Manajemen Order",
      "Setup Onboarding Wizard Mandiri",
      "Sertifikat SSL & Hosting Cloud Siap Pakai",
    ],
  },
  {
    name: "Business Pro",
    badge: "Paling Diminati",
    desc: "Solusi terlengkap untuk restoran, produsen frozen food skala menengah, dan bisnis katering dengan cabang aktif.",
    price: "Rp 2.890.000",
    period: "/ tahun",
    isFeatured: true,
    ctaText: "Pilih Business Pro",
    features: [
      "Semua fitur paket Starter",
      "Custom Domain Resmi Klien (.id / .com)",
      "Database Terdedikasi Berperforma Tinggi",
      "Multi-user Admin (Super Admin, Kasir, Kitchen Staff)",
      "Modul Manajemen Produksi & Batching Stok",
      "Integrasi Otentikasi & Single Sign-On (SSO) Pelanggan",
      "Pencadangan Database Otomatis & Pemulihan Data",
      "Dukungan Teknis Prioritas via Email",
    ],
  },
  {
    name: "Enterprise White-Label",
    badge: null,
    desc: "Lisensi eksklusif dengan akses source code penuh untuk waralaba (franchise), multi-brand group, atau corporate F&B.",
    price: "Rp 6.500.000",
    period: "sekali bayar / brand",
    isFeatured: false,
    ctaText: "Konsultasi Enterprise",
    features: [
      "Kepemilikan Repositori Kode Sumber Pribadi Klien",
      "Akses Penuh Source Code Arsitektur Web Modern",
      "Bebas Deploy ke Server Mandiri, VPS, atau Cloud",
      "Hapus Seluruh Atribusi Platform (100% Brand Anda)",
      "Dukungan Integrasi Gerbang Pembayaran Digital Khusus",
      "Pendampingan Deploy & Pelatihan Tim IT Klien",
      "Garansi Update Engine & Patch Keamanan",
    ],
  },
];

export default function PlatformLandingPage() {
  return (
    <div className="platform-landing">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="platform-landing__header">
        <div className="platform-landing__header-inner">
          <Link href="/platform" className="platform-landing__header-brand">
            <div className="brand-badge-icon">
              <Image
                src={platformIcon}
                alt="Baitybites ORM"
                width={36}
                height={36}
                className="brand-badge-img"
                priority
              />
            </div>
            <div className="brand-title-wrap">
              <span className="brand-name">
                Baitybites <span>ORM</span>
              </span>
              <span className="brand-sub">Dedicated F&B Platform</span>
            </div>
          </Link>

          <nav className="platform-landing__header-nav">
            <a href="#fitur">Fitur</a>
            <a href="#klien-pertama">Klien Pertama</a>
            <a href="#harga">Daftar Paket &amp; Harga</a>
          </nav>

          <div className="platform-landing__header-actions">
            {/* Link ke pusat demo interaktif */}
            <Link href="/demo" className="btn-outline">
              Pusat Demo Interaktif
            </Link>
            <a href="#harga" className="btn-cta-primary">
              <HugeiconsIcon icon={RocketIcon} size={15} />
              <span>Mulai Sekarang</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="platform-landing__hero">
        <div className="hero-pill">
          <span className="pill-dot"></span>
          <span>Platform E-Commerce &amp; OMS Kuliner Modern</span>
        </div>

        <h1>
          Engine Digital Terpadu untuk <br />
          <span className="accent-text">Brand F&amp;B &amp; Usaha Kuliner Modern</span>
        </h1>

        <p className="hero-lead">
          <strong>Baitybites ORM</strong> adalah software engine white-label yang menggabungkan toko online
          berkecepatan tinggi, sistem display dapur (Kitchen Display), dan manajemen pesanan terpusat (OMS)
          dengan database terisolasi untuk setiap klien.
        </p>

        <div className="hero-cta-group">
          <a href="#harga" className="btn-hero-primary">
            <HugeiconsIcon icon={RocketIcon} size={18} />
            <span>Lihat Paket &amp; Harga</span>
          </a>
          <Link href="/demo" className="btn-hero-secondary">
            <span>Uji Coba Live Demo Multi-Role</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </div>

        <div className="hero-trust">
          <div className="trust-item">
            <span className="trust-val">100%</span>
            <span className="trust-lbl">Dedicated Database</span>
          </div>
          <div className="trust-item">
            <span className="trust-val">&lt; 0.8s</span>
            <span className="trust-lbl">Page Load Time</span>
          </div>
          <div className="trust-item">
            <span className="trust-val">0%</span>
            <span className="trust-lbl">Komisi per Transaksi</span>
          </div>
          <div className="trust-item">
            <span className="trust-val">Cloud</span>
            <span className="trust-lbl">High-Availability Hosting</span>
          </div>
        </div>
      </section>

      {/* ── Client Case Study: Baitybites (Client #1) ─────────────────────── */}
      <section id="klien-pertama" className="platform-landing__case-study">
        <div className="case-card">
          <div className="case-card-info">
            <div className="case-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <HugeiconsIcon icon={SparklesIcon} size={14} />
              <span>Klien Pertama &amp; Flagship Case Study</span>
            </div>
            <h3>Baitybites: Sensasi Risol Mayo Meleleh</h3>
            <p>
              Brand kuliner artisanal <strong>Baitybites</strong> membuktikan keandalan sistem Baitybites ORM
              dalam menangani ratusan order harian, koordinasi pesanan siap goreng di dapur (Kitchen Board),
              dan integrasi pemesanan WhatsApp secara mulus.
            </p>
            <Link href="/baitybites" className="case-link">
              <span>Buka Website Toko Baitybites</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </Link>
          </div>

          <div className="case-card-metrics">
            <div className="metric-box">
              <div className="num">100%</div>
              <div className="desc">Otomatisasi Alur Dapur</div>
            </div>
            <div className="metric-box">
              <div className="num">0 Miss</div>
              <div className="desc">Pesanan Tercecer</div>
            </div>
            <div className="metric-box">
              <div className="num">Real-Time</div>
              <div className="desc">Sinkronisasi Status Order</div>
            </div>
            <div className="metric-box">
              <div className="num">White-Label</div>
              <div className="desc">100% Brand Identity Mandiri</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section id="fitur" className="platform-landing__features">
        <div className="section-head">
          <div className="eyebrow">FITUR KELAS PERUSAHAAN</div>
          <h2>Dirancang Khusus Menjawab Masalah Bisnis Kuliner</h2>
          <p>
            Bukan sekadar website toko biasa. Baitybites ORM menghubungkan front-office pelanggan dengan back-office
            operasional dapur Anda.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="icon-box">
                <HugeiconsIcon icon={f.icon} size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing + Architecture (Client Component) ────────────────────── */}
      <PlatformPricing plans={PRICING_PLANS} />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="platform-landing__footer">
        <div className="platform-landing__footer-inner">
          <div className="footer-about">
            <div className="logo-wrap">
              <span>Baitybites</span> ORM
            </div>
            <p>
              Dedicated White-Label E-Commerce &amp; Order Management System dirancang khusus untuk memajukan industri
              kuliner dan bisnis F&amp;B di Indonesia.
            </p>
          </div>

          <div className="footer-col">
            <h4>Solusi Platform</h4>
            <ul>
              <li><a href="#fitur">Toko Online Pintar</a></li>
              <li><a href="#fitur">Kitchen Display System</a></li>
              <li><a href="#fitur">Manajemen Pesanan (OMS)</a></li>
              <li><a href="#fitur">WhatsApp Order Automation</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Produk &amp; Klien</h4>
            <ul>
              <li><Link href="/baitybites">Demo Toko (Baitybites)</Link></li>
              <li><Link href="/onboarding">Setup Klien Baru</Link></li>
              <li><a href="#harga">Paket &amp; Harga</a></li>
              <li><Link href="/settings/leads">Backoffice Platform (Leads)</Link></li>
              <li><Link href="/admin">Portal Admin Toko</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Kontak Penjualan</h4>
            <ul>
              <li><a href="mailto:id.baitybites@gmail.com">id.baitybites@gmail.com</a></li>
              <li><span>Jakarta Selatan, Indonesia</span></li>
            </ul>
          </div>
        </div>

        <div className="platform-landing__footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} <strong>Baitybites ORM</strong>. Hak cipta dilindungi undang-undang.
          </div>
          <div>
            Dedicated Instance Engine &bull; Arsitektur Cloud Berperforma Tinggi
          </div>
        </div>
      </footer>
    </div>
  );
}
