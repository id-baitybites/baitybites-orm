"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RocketIcon,
  UserGroupIcon,
  Store01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Database01Icon,
  Mail01Icon,
  Settings01Icon,
  ChartUpIcon,
  DashboardSquare01Icon,
  KitchenUtensilsIcon,
  ShoppingBag01Icon,
  Book01Icon,
  ArrowMoveUpRightIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ClientLead } from "@/lib/leads-store";
import "./console.scss";

interface TenantInstance {
  id: string;
  name: string;
  category: string;
  slug: string;
  domain: string;
  isCustomDomain: boolean;
  sslStatus: "VALID" | "PENDING";
  plan: "Starter Instance" | "Business Pro" | "Enterprise Fleet";
  mrr: number;
  status: "PRODUCTION" | "ONBOARDING" | "TRIAL";
  dbSchema: string;
  createdAt: string;
  activeOrdersToday: number;
  revenueToday: number;
  publicUrl: string;
  omsUrl: string;
}

const INITIAL_TENANTS: TenantInstance[] = [
  {
    id: "inst-001",
    name: "Baitybites (Sensasi Risol Mayo)",
    category: "Culinary & Bakery",
    slug: "baitybites",
    domain: "baitybites.id",
    isCustomDomain: true,
    sslStatus: "VALID",
    plan: "Business Pro",
    mrr: 1500000,
    status: "PRODUCTION",
    dbSchema: "neondb_baitybites (Dedicated)",
    createdAt: "10 Okt 2026",
    activeOrdersToday: 18,
    revenueToday: 842000,
    publicUrl: "/baitybites",
    omsUrl: "/orders",
  },
  {
    id: "inst-002",
    name: "Toko Kue Ibu Lestari",
    category: "Snack & Pastry",
    slug: "kuelestari",
    domain: "kuelestari.baitybites.site",
    isCustomDomain: false,
    sslStatus: "VALID",
    plan: "Starter Instance",
    mrr: 750000,
    status: "ONBOARDING",
    dbSchema: "neondb_kuelestari (Dedicated)",
    createdAt: "12 Okt 2026",
    activeOrdersToday: 2,
    revenueToday: 125000,
    publicUrl: "/baitybites",
    omsUrl: "/orders",
  },
  {
    id: "inst-003",
    name: "Kopi Seduh Nusantara",
    category: "Coffee & Beverage",
    slug: "kopinusantara",
    domain: "kopinusantara.id",
    isCustomDomain: true,
    sslStatus: "PENDING",
    plan: "Business Pro",
    mrr: 1500000,
    status: "TRIAL",
    dbSchema: "neondb_kopinusantara (Provisioning)",
    createdAt: "12 Okt 2026",
    activeOrdersToday: 0,
    revenueToday: 0,
    publicUrl: "/baitybites",
    omsUrl: "/orders",
  },
];

interface AuditEvent {
  id: string;
  time: string;
  type: "SECURITY" | "PROVISION" | "LEAD" | "DATABASE";
  title: string;
  description: string;
}

const AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "evt-01",
    time: "10 menit yang lalu",
    type: "LEAD",
    title: "Prospek Baru: Kopi Seduh Nusantara",
    description: "Inquiry masuk dari formulir pricing landing page memilih paket Business Pro.",
  },
  {
    id: "evt-02",
    time: "1 jam yang lalu",
    type: "PROVISION",
    title: "Instance Provisioning Disiapkan",
    description: "Konfigurasi repository GitHub untuk slug kuelestari berhasil di-generate.",
  },
  {
    id: "evt-03",
    time: "3 jam yang lalu",
    type: "DATABASE",
    title: "Backup Database Otomatis Selesai",
    description: "Neon PostgreSQL snapshot tersimpan aman di region us-east-2.",
  },
  {
    id: "evt-04",
    time: "Hari ini, 09:15",
    type: "SECURITY",
    title: "Autentikasi Vendor Superadmin Valid",
    description: "PIN otentikasi vendor 8899 berhasil diverifikasi untuk sesi Platform Console.",
  },
];

export function PlatformConsoleClient({ leads }: { leads: ClientLead[] }) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "tenants" | "leads" | "infrastructure" | "audit"
  >("overview");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const newLeadsCount = leads.filter((l) => l.status === "BARU").length;
  const contactedLeadsCount = leads.filter((l) => l.status === "DIHUBUNGI").length;

  const totalMRR = INITIAL_TENANTS.reduce((sum, t) => sum + (t.status === "PRODUCTION" || t.status === "ONBOARDING" ? t.mrr : 0), 0);
  const totalProductionTenants = INITIAL_TENANTS.filter((t) => t.status === "PRODUCTION").length;
  const totalOnboardingTenants = INITIAL_TENANTS.filter((t) => t.status === "ONBOARDING" || t.status === "TRIAL").length;

  const filteredTenants = INITIAL_TENANTS.filter((t) => {
    const matchesFilter =
      tenantFilter === "ALL" ||
      (tenantFilter === "PRODUCTION" && t.status === "PRODUCTION") ||
      (tenantFilter === "ONBOARDING" && (t.status === "ONBOARDING" || t.status === "TRIAL"));
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="platform-console-pro">
      {/* ── Executive Top Header ────────────────────────────────────────── */}
      <header className="console-pro-header">
        <div className="console-pro-header__left">
          <div className="platform-brand-chip">
            <span className="chip-badge">👑 VENDOR ENGINE</span>
            <span className="chip-version">v2.4.0 Multi-Tenant</span>
            <span className="chip-status">
              <span className="pulse-dot" />
              SLA 99.98%
            </span>
          </div>
          <h1>Platform Owner Console</h1>
          <p className="header-subtitle">
            Pusat kendali enterprise Baitybites ORM: kelola seluruh tenant toko kuliner, pantau pipeline prospek berlangganan, dan monitor kesehatan infrastruktur cloud.
          </p>
        </div>

        <div className="console-pro-header__right">
          <Link href="/settings/provision" className="btn-pro-primary">
            <HugeiconsIcon icon={RocketIcon} size={16} />
            <span>+ Provision Instance Baru</span>
          </Link>
          <Link href="/settings/leads" className="btn-pro-outline">
            <HugeiconsIcon icon={UserGroupIcon} size={16} />
            <span>Permintaan Klien ({newLeadsCount})</span>
          </Link>
          <Link href="/settings" className="btn-pro-ghost" title="Platform Settings">
            <HugeiconsIcon icon={Settings01Icon} size={18} />
          </Link>
        </div>
      </header>

      {/* ── KPI Executive Metric Cards ──────────────────────────────────── */}
      <section className="console-pro-kpis">
        {/* KPI 1: MRR */}
        <div className="kpi-card">
          <div className="kpi-card__top">
            <span className="kpi-label">Monthly Recurring Revenue</span>
            <div className="kpi-icon kpi-icon--emerald">
              <HugeiconsIcon icon={ChartUpIcon} size={18} />
            </div>
          </div>
          <div className="kpi-card__value">
            Rp {totalMRR.toLocaleString("id-ID")}
          </div>
          <div className="kpi-card__trend kpi-trend--positive">
            <span>↑ +25% MoM</span>
            <span className="trend-sub">Target ARR: Rp 54 Jt</span>
          </div>
        </div>

        {/* KPI 2: Tenant Fleet */}
        <div className="kpi-card">
          <div className="kpi-card__top">
            <span className="kpi-label">Armada Tenant Klien</span>
            <div className="kpi-icon kpi-icon--indigo">
              <HugeiconsIcon icon={Store01Icon} size={18} />
            </div>
          </div>
          <div className="kpi-card__value">
            {INITIAL_TENANTS.length} <span className="value-unit">Tenant</span>
          </div>
          <div className="kpi-card__trend">
            <span className="badge-sub-active">{totalProductionTenants} Production Live</span>
            <span className="badge-sub-setup">{totalOnboardingTenants} Onboarding</span>
          </div>
        </div>

        {/* KPI 3: Sales Pipeline Leads */}
        <div className="kpi-card">
          <div className="kpi-card__top">
            <span className="kpi-label">Pipeline Prospek Baru</span>
            <div className="kpi-icon kpi-icon--amber">
              <HugeiconsIcon icon={UserGroupIcon} size={18} />
            </div>
          </div>
          <div className="kpi-card__value">
            {leads.length} <span className="value-unit">Leads</span>
          </div>
          <div className="kpi-card__trend">
            <span className="badge-sub-alert">{newLeadsCount} Perlu Respon</span>
            <span className="trend-sub">{contactedLeadsCount} Dalam Follow-up</span>
          </div>
        </div>

        {/* KPI 4: Infrastructure Health */}
        <div className="kpi-card">
          <div className="kpi-card__top">
            <span className="kpi-label">Infrastruktur & Cloud</span>
            <div className="kpi-icon kpi-icon--blue">
              <HugeiconsIcon icon={Database01Icon} size={18} />
            </div>
          </div>
          <div className="kpi-card__value">
            99.98% <span className="value-unit">Uptime</span>
          </div>
          <div className="kpi-card__trend kpi-trend--positive">
            <span>● Neon PG Dedicated</span>
            <span className="trend-sub">Latency 34ms</span>
          </div>
        </div>
      </section>

      {/* ── Tabbed Control Center Navigation ────────────────────────────── */}
      <nav className="console-pro-tabs" aria-label="Tab kontrol platform">
        <button
          type="button"
          className={`tab-btn ${activeTab === "overview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <HugeiconsIcon icon={DashboardSquare01Icon} size={16} />
          <span>Ringkasan Eksekutif</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "tenants" ? "is-active" : ""}`}
          onClick={() => setActiveTab("tenants")}
        >
          <HugeiconsIcon icon={Store01Icon} size={16} />
          <span>Direktori Tenant ({INITIAL_TENANTS.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "leads" ? "is-active" : ""}`}
          onClick={() => setActiveTab("leads")}
        >
          <HugeiconsIcon icon={UserGroupIcon} size={16} />
          <span>Pipeline Prospek ({leads.length})</span>
          {newLeadsCount > 0 && <span className="tab-badge">{newLeadsCount}</span>}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "infrastructure" ? "is-active" : ""}`}
          onClick={() => setActiveTab("infrastructure")}
        >
          <HugeiconsIcon icon={Database01Icon} size={16} />
          <span>Infrastruktur &amp; Node</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "audit" ? "is-active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <HugeiconsIcon icon={Clock01Icon} size={16} />
          <span>Audit Log</span>
        </button>
      </nav>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div className="console-pro-content">
        {/* ================================================================ */}
        {/* TAB 1: OVERVIEW & EXECUTIVE SUMMARY                             */}
        {/* ================================================================ */}
        {activeTab === "overview" && (
          <div className="tab-pane-overview">
            {/* Top Grid: Quick Impersonation & Tenant Spotlight */}
            <div className="overview-split-grid">
              {/* Left Column: Flagship Tenant Card */}
              <div className="pro-card pro-card--featured">
                <div className="pro-card__header">
                  <div>
                    <span className="card-kicker">Tenant Unggulan • Flagship Instance #1</span>
                    <h3>Baitybites (Sensasi Risol Mayo)</h3>
                  </div>
                  <span className="pill-status pill-status--live">
                    <span className="pulse-dot" />
                    LIVE PRODUCTION
                  </span>
                </div>

                <div className="tenant-meta-strip">
                  <div className="meta-block">
                    <span className="meta-lbl">Domain Klien</span>
                    <span className="meta-val highlight-domain">baitybites.id</span>
                  </div>
                  <div className="meta-block">
                    <span className="meta-lbl">Paket Lisensi</span>
                    <span className="meta-val">Business Pro</span>
                  </div>
                  <div className="meta-block">
                    <span className="meta-lbl">Database Schema</span>
                    <span className="meta-val">neondb_baitybites</span>
                  </div>
                  <div className="meta-block">
                    <span className="meta-lbl">Pesanan Hari Ini</span>
                    <span className="meta-val">18 Order (Rp 842.000)</span>
                  </div>
                </div>

                <p className="card-desc">
                  Toko kuliner risoles artisan pertama yang beroperasi secara penuh di platform. Dilengkapi Kitchen Display System dapur, integrasi WhatsApp otomatis, dan katalog CMS.
                </p>

                <div className="pro-card__actions">
                  <Link href="/orders" className="btn-action-primary">
                    <HugeiconsIcon icon={Store01Icon} size={16} />
                    <span>Masuk ke Backoffice Toko (OMS)</span>
                  </Link>
                  <Link href="/baitybites" target="_blank" className="btn-action-outline">
                    <span>Kunjungi Web Toko</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Link>
                  <Link href="/settings/provision" className="btn-action-ghost">
                    <span>Konfigurasi Engine</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Fleet Health & Integrations Quick Matrix */}
              <div className="pro-card">
                <div className="pro-card__header">
                  <h3>Status Layanan &amp; Integrasi Cloud</h3>
                  <span className="pill-neutral">Status Realtime</span>
                </div>

                <div className="services-health-list">
                  <div className="service-row">
                    <div className="service-info">
                      <div className="service-icon service-icon--emerald">
                        <HugeiconsIcon icon={Database01Icon} size={16} />
                      </div>
                      <div>
                        <strong>Neon PostgreSQL Database</strong>
                        <span>Pool koneksi: 3/20 aktif • US-East-2</span>
                      </div>
                    </div>
                    <span className="badge-health badge-health--good">Normal (34ms)</span>
                  </div>

                  <div className="service-row">
                    <div className="service-info">
                      <div className="service-icon service-icon--blue">
                        <HugeiconsIcon icon={Mail01Icon} size={16} />
                      </div>
                      <div>
                        <strong>Brevo Transactional Email</strong>
                        <span>id.baitybites@gmail.com • Delivery 99.8%</span>
                      </div>
                    </div>
                    <span className="badge-health badge-health--good">Connected</span>
                  </div>

                  <div className="service-row">
                    <div className="service-info">
                      <div className="service-icon service-icon--indigo">
                        <HugeiconsIcon icon={RocketIcon} size={16} />
                      </div>
                      <div>
                        <strong>Vercel Serverless Compute</strong>
                        <span>Region sin1 (Singapore) Edge Deployment</span>
                      </div>
                    </div>
                    <span className="badge-health badge-health--good">Operational</span>
                  </div>

                  <div className="service-row">
                    <div className="service-info">
                      <div className="service-icon service-icon--amber">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                      </div>
                      <div>
                        <strong>PIN Authentication Gate</strong>
                        <span>Otorisasi Vendor PIN (8899) Terproteksi</span>
                      </div>
                    </div>
                    <span className="badge-health badge-health--good">Secured</span>
                  </div>
                </div>

                <div className="card-footer-action">
                  <Link href="/migration" className="link-service-tool">
                    <HugeiconsIcon icon={ArrowMoveUpRightIcon} size={14} />
                    <span>Buka Database Migration &amp; Verification Tool</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Recent Inquiries + Quick Actions */}
            <div className="overview-bottom-grid">
              {/* Recent Inquiries Snapshot */}
              <div className="pro-card">
                <div className="pro-card__header">
                  <div>
                    <h3>Permintaan Langganan Klien Terbaru</h3>
                    <span className="card-subtext">Calon mitra kuliner yang mendaftar via landing page.</span>
                  </div>
                  <Link href="/settings/leads" className="link-more">
                    <span>Lihat Semua ({leads.length})</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Link>
                </div>

                <div className="leads-table-wrap">
                  <table className="leads-mini-table">
                    <thead>
                      <tr>
                        <th>Nama Bisnis</th>
                        <th>Kontak PIC</th>
                        <th>Paket Diminta</th>
                        <th>Status</th>
                        <th>Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.slice(0, 3).map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <strong>{lead.businessName}</strong>
                            <div className="table-sub">{lead.message ? `"${lead.message.slice(0, 40)}..."` : "-"}</div>
                          </td>
                          <td>
                            <div>{lead.contactName}</div>
                            <div className="table-sub">{lead.phone}</div>
                          </td>
                          <td>
                            <span className="plan-badge">{lead.selectedPlan}</span>
                          </td>
                          <td>
                            <span className={`status-pill status-pill--${lead.status.toLowerCase()}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-mini-wa"
                                title="Chat WhatsApp"
                              >
                                WA
                              </a>
                              <Link
                                href={`/settings/provision?name=${encodeURIComponent(lead.businessName)}&email=${encodeURIComponent(lead.email)}`}
                                className="btn-mini-provision"
                                title="Buat Repo GitHub"
                              >
                                Provision
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Platform Launchpad */}
              <div className="pro-card">
                <div className="pro-card__header">
                  <h3>Pusat Operasional Vendor</h3>
                  <span className="pill-neutral">Quick Tools</span>
                </div>

                <div className="quick-tools-grid">
                  <Link href="/settings/provision" className="quick-tool-card">
                    <div className="tool-icon tool-icon--rocket">
                      <HugeiconsIcon icon={RocketIcon} size={20} />
                    </div>
                    <div>
                      <strong>Instance Provisioner</strong>
                      <span>Setup repository GitHub &amp; skema database klien baru</span>
                    </div>
                  </Link>

                  <Link href="/onboarding" className="quick-tool-card">
                    <div className="tool-icon tool-icon--book">
                      <HugeiconsIcon icon={Book01Icon} size={20} />
                    </div>
                    <div>
                      <strong>Onboarding Wizard</strong>
                      <span>Pratinjau 4 tahap panduan aktivasi toko mandiri</span>
                    </div>
                  </Link>

                  <Link href="/docs" className="quick-tool-card">
                    <div className="tool-icon tool-icon--docs">
                      <HugeiconsIcon icon={Book01Icon} size={20} />
                    </div>
                    <div>
                      <strong>SOP &amp; Dokumentasi</strong>
                      <span>Panduan arsitektur engine Baitybites ORM</span>
                    </div>
                  </Link>

                  <Link href="/settings" className="quick-tool-card">
                    <div className="tool-icon tool-icon--settings">
                      <HugeiconsIcon icon={Settings01Icon} size={20} />
                    </div>
                    <div>
                      <strong>Pengaturan Platform</strong>
                      <span>Kunci API, SMTP Brevo, dan kredensial cloud</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: TENANT INSTANCE FLEET                                    */}
        {/* ================================================================ */}
        {activeTab === "tenants" && (
          <div className="tab-pane-tenants">
            <div className="filter-toolbar">
              <div className="filter-buttons">
                <button
                  type="button"
                  className={`btn-filter ${tenantFilter === "ALL" ? "is-active" : ""}`}
                  onClick={() => setTenantFilter("ALL")}
                >
                  Semua ({INITIAL_TENANTS.length})
                </button>
                <button
                  type="button"
                  className={`btn-filter ${tenantFilter === "PRODUCTION" ? "is-active" : ""}`}
                  onClick={() => setTenantFilter("PRODUCTION")}
                >
                  Live Production ({totalProductionTenants})
                </button>
                <button
                  type="button"
                  className={`btn-filter ${tenantFilter === "ONBOARDING" ? "is-active" : ""}`}
                  onClick={() => setTenantFilter("ONBOARDING")}
                >
                  Onboarding &amp; Trial ({totalOnboardingTenants})
                </button>
              </div>

              <div className="search-wrap">
                <input
                  type="text"
                  placeholder="Cari nama bisnis, domain, atau slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="tenants-grid">
              {filteredTenants.map((tenant) => (
                <div className="tenant-card-pro" key={tenant.id}>
                  <div className="tenant-card-pro__header">
                    <div className="tenant-identity">
                      <div className="tenant-avatar">
                        {tenant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4>{tenant.name}</h4>
                        <span className="tenant-category">{tenant.category}</span>
                      </div>
                    </div>
                    <span className={`pill-status pill-status--${tenant.status.toLowerCase()}`}>
                      {tenant.status}
                    </span>
                  </div>

                  <div className="tenant-card-pro__details">
                    <div className="detail-item">
                      <span className="detail-label">Domain Publik</span>
                      <span className="detail-value domain-link">{tenant.domain}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Paket Lisensi</span>
                      <span className="detail-value">{tenant.plan}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">MRR Lisensi</span>
                      <span className="detail-value">Rp {tenant.mrr.toLocaleString("id-ID")}/bln</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Database Schema</span>
                      <span className="detail-value code-snippet">{tenant.dbSchema}</span>
                    </div>
                  </div>

                  <div className="tenant-card-pro__stats">
                    <div className="sub-stat">
                      <span className="stat-number">{tenant.activeOrdersToday}</span>
                      <span className="stat-text">Pesanan Hari Ini</span>
                    </div>
                    <div className="sub-stat">
                      <span className="stat-number">Rp {tenant.revenueToday.toLocaleString("id-ID")}</span>
                      <span className="stat-text">Gross Sales Toko</span>
                    </div>
                    <div className="sub-stat">
                      <span className="stat-number">{tenant.sslStatus === "VALID" ? "SSL Aktif" : "Menunggu"}</span>
                      <span className="stat-text">Keamanan Domain</span>
                    </div>
                  </div>

                  <div className="tenant-card-pro__actions">
                    <Link href={tenant.omsUrl} className="btn-oms-direct">
                      <HugeiconsIcon icon={Store01Icon} size={15} />
                      <span>Buka Backoffice (OMS)</span>
                    </Link>
                    <Link href={tenant.publicUrl} target="_blank" className="btn-web-preview">
                      <span>Lihat Web Toko</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: SALES PIPELINE LEADS                                     */}
        {/* ================================================================ */}
        {activeTab === "leads" && (
          <div className="tab-pane-leads">
            <div className="pro-card">
              <div className="pro-card__header">
                <div>
                  <h3>Daftar Permintaan Langganan Masuk (Leads)</h3>
                  <span className="card-subtext">
                    Daftar seluruh calon klien baru yang mengajukan penawaran paket ORM.
                  </span>
                </div>
                <Link href="/settings/leads" className="btn-pro-primary">
                  <span>Buka Halaman Manajemen Leads Penuh</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </div>

              <div className="leads-full-table-wrap">
                <table className="leads-full-table">
                  <thead>
                    <tr>
                      <th>Waktu Masuk</th>
                      <th>Bisnis &amp; PIC</th>
                      <th>Kontak (WA &amp; Email)</th>
                      <th>Paket Diminta</th>
                      <th>Pesan Kebutuhan</th>
                      <th>Status Pipeline</th>
                      <th>Tindakan Cepat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <span className="date-stamp">
                            {new Date(lead.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td>
                          <strong>{lead.businessName}</strong>
                          <div className="pic-text">PIC: {lead.contactName}</div>
                        </td>
                        <td>
                          <div>{lead.phone}</div>
                          <div className="table-sub">{lead.email}</div>
                        </td>
                        <td>
                          <span className="plan-badge">{lead.selectedPlan}</span>
                        </td>
                        <td>
                          <div className="lead-msg-cell">
                            {lead.message || "Tidak ada catatan khusus"}
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill status-pill--${lead.status.toLowerCase()}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-mini-wa"
                            >
                              Hubungi WA
                            </a>
                            <Link
                              href={`/settings/provision?name=${encodeURIComponent(lead.businessName)}&email=${encodeURIComponent(lead.email)}`}
                              className="btn-mini-provision"
                            >
                              Provision
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4: INFRASTRUCTURE & NODES                                   */}
        {/* ================================================================ */}
        {activeTab === "infrastructure" && (
          <div className="tab-pane-infrastructure">
            <div className="infra-grid">
              <div className="pro-card">
                <div className="pro-card__header">
                  <h3>Database Fleet (PostgreSQL)</h3>
                  <span className="badge-health badge-health--good">Operational</span>
                </div>
                <div className="infra-detail-rows">
                  <div className="infra-row">
                    <span>Provider</span>
                    <strong>Neon Serverless Cloud</strong>
                  </div>
                  <div className="infra-row">
                    <span>Region Hosting</span>
                    <strong>AWS us-east-2 (Ohio)</strong>
                  </div>
                  <div className="infra-row">
                    <span>Connection Pool</span>
                    <strong>PgBouncer Active (Port 5432 / 6543)</strong>
                  </div>
                  <div className="infra-row">
                    <span>Pemisahan Multi-Tenant</span>
                    <strong>Dedicated Schema Per-Tenant</strong>
                  </div>
                  <div className="infra-row">
                    <span>Status Koneksi Pool</span>
                    <strong className="text-emerald">Terhubung &amp; Sehat (34ms)</strong>
                  </div>
                </div>
              </div>

              <div className="pro-card">
                <div className="pro-card__header">
                  <h3>Compute &amp; Deployment Engine</h3>
                  <span className="badge-health badge-health--good">Operational</span>
                </div>
                <div className="infra-detail-rows">
                  <div className="infra-row">
                    <span>Framework Platform</span>
                    <strong>Next.js 16 (App Router)</strong>
                  </div>
                  <div className="infra-row">
                    <span>Edge CDN &amp; DNS</span>
                    <strong>Vercel Global Edge Network</strong>
                  </div>
                  <div className="infra-row">
                    <span>Routing Latency</span>
                    <strong>38ms (Node Singapore / Jakarta)</strong>
                  </div>
                  <div className="infra-row">
                    <span>SSL Certificate</span>
                    <strong className="text-emerald">Let&apos;s Encrypt Auto-Renewal</strong>
                  </div>
                  <div className="infra-row">
                    <span>Build &amp; Deploy Status</span>
                    <strong className="text-emerald">Clean (0 Compilation Errors)</strong>
                  </div>
                </div>
              </div>

              <div className="pro-card">
                <div className="pro-card__header">
                  <h3>Integrasi Email &amp; Komunikasi</h3>
                  <span className="badge-health badge-health--good">Operational</span>
                </div>
                <div className="infra-detail-rows">
                  <div className="infra-row">
                    <span>Provider Email</span>
                    <strong>Brevo Transactional API &amp; SMTP</strong>
                  </div>
                  <div className="infra-row">
                    <span>Pengirim Resmi</span>
                    <strong>id.baitybites@gmail.com</strong>
                  </div>
                  <div className="infra-row">
                    <span>Tipe Transaksi</span>
                    <strong>Proposal Penawaran &amp; Invoice Billing</strong>
                  </div>
                  <div className="infra-row">
                    <span>Deliverability Rate</span>
                    <strong className="text-emerald">99.8% Ke Inbox Utama</strong>
                  </div>
                </div>
              </div>

              <div className="pro-card">
                <div className="pro-card__header">
                  <h3>Keamanan &amp; Tata Kelola</h3>
                  <span className="badge-health badge-health--good">Protected</span>
                </div>
                <div className="infra-detail-rows">
                  <div className="infra-row">
                    <span>Vendor PIN Gate</span>
                    <strong className="text-emerald">8899 (Superadmin Protected)</strong>
                  </div>
                  <div className="infra-row">
                    <span>Tenant Client PIN</span>
                    <strong>1234 (Per-Store Scoped)</strong>
                  </div>
                  <div className="infra-row">
                    <span>Cookie Session</span>
                    <strong>HTTP-Only &bull; SameSite Strict</strong>
                  </div>
                  <div className="infra-row">
                    <span>Role Hierarchy</span>
                    <strong>PLATFORM_OWNER vs STORE_ADMIN</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 5: AUDIT LOG                                                */}
        {/* ================================================================ */}
        {activeTab === "audit" && (
          <div className="tab-pane-audit">
            <div className="pro-card">
              <div className="pro-card__header">
                <div>
                  <h3>Platform Audit &amp; Event Log</h3>
                  <span className="card-subtext">Catatan aktivitas teknis dan bisnis engine Baitybites ORM secara kronologis.</span>
                </div>
                <span className="pill-neutral">4 Peristiwa Terakhir</span>
              </div>

              <div className="timeline-wrap">
                {AUDIT_EVENTS.map((evt) => (
                  <div className="timeline-item" key={evt.id}>
                    <div className="timeline-marker">
                      <span className={`marker-dot marker-dot--${evt.type.toLowerCase()}`} />
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-head">
                        <strong>{evt.title}</strong>
                        <span className="timeline-time">{evt.time}</span>
                      </div>
                      <p className="timeline-desc">{evt.description}</p>
                      <span className={`timeline-tag tag-${evt.type.toLowerCase()}`}>
                        {evt.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
