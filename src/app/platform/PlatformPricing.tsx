"use client";

import { useState } from "react";
import {
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  RocketIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import SubscriptionModal from "./SubscriptionModal";

interface PricingPlan {
  name: string;
  badge: string | null;
  desc: string;
  price: string;
  period: string;
  isFeatured: boolean;
  ctaText: string;
  features: string[];
}

interface PlatformPricingProps {
  plans: PricingPlan[];
}

export default function PlatformPricing({ plans }: PlatformPricingProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  const openModal = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  return (
    <>
      {/* ── Pricing Table ───────────────────────────────────────────────── */}
      <section id="harga" className="platform-landing__pricing">
        <div className="section-head">
          <div className="eyebrow">TRANSPARAN &amp; HEMAT BIAYA</div>
          <h2>Investasi Pasti Tanpa Potongan Komisi Transaksi</h2>
          <p>
            Semua keuntungan penjualan 100% milik bisnis Anda. Tidak ada biaya tersembunyi, potongan per order,
            atau ketergantungan pada marketplace.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, idx) => (
            <div className={`price-card ${plan.isFeatured ? "is-featured" : ""}`} key={idx}>
              {plan.badge && <div className="featured-badge">{plan.badge}</div>}

              <div className="plan-header">
                <div className="plan-name">{plan.name}</div>
                <div className="plan-desc">{plan.desc}</div>
              </div>

              <div className="plan-price-wrap">
                <span className="price-val">{plan.price}</span>
                <span className="price-period">{plan.period}</span>
              </div>

              <ul className="plan-features">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => openModal(plan)}
                className={`btn-select-plan ${plan.isFeatured ? "btn-primary-plan" : ""}`}
              >
                {plan.ctaText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture Note ───────────────────────────────────────────── */}
      <section id="arsitektur" className="platform-landing__arch-box">
        <div className="arch-card">
          <div className="arch-icon">
            <HugeiconsIcon icon={SourceCodeIcon} size={24} />
          </div>
          <div className="arch-content">
            <h4>Dukungan Dedicated Domain &amp; Repositori Mandiri</h4>
            <p>
              Platform engine saat ini berjalan di infrastruktur komputasi awan global berperforma tinggi. Ketika Anda bergabung,
              instance Anda akan memiliki domain terpisah (misal: <code>tokosaya.com</code>) dan URL repositori kode sendiri
              lengkap dengan wizard inisialisasi onboarding mandiri.
            </p>
          </div>
          <Link href="/onboarding" className="arch-btn">
            <span>Lihat Alur Onboarding Klien</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
          </Link>
        </div>
      </section>

      {/* ── Subscription Modal ──────────────────────────────────────────── */}
      <SubscriptionModal
        isOpen={modalOpen}
        planName={selectedPlan?.name || ""}
        planPrice={selectedPlan ? `${selectedPlan.price} ${selectedPlan.period}` : ""}
        onClose={() => {
          setModalOpen(false);
          setSelectedPlan(null);
        }}
      />
    </>
  );
}
