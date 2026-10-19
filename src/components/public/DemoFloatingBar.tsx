"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  KitchenUtensilsIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import "./demo-floating-bar.scss";

interface DemoFloatingBarProps {
  currentRole?: string;
}

export function DemoFloatingBar({ currentRole = "Storefront Pelanggan" }: DemoFloatingBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside className="demo-floating-bar" aria-label="Demo Mode Notification">
      <div className="demo-floating-bar__inner">
        <div className="demo-floating-bar__badge">
          <span className="live-pulse"></span>
          <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2.2} />
          <strong>LIVE CLIENT PROTOTYPE</strong>
        </div>

        <p className="demo-floating-bar__text">
          Anda sedang mencoba <strong>{currentRole}</strong> yang ditenagai oleh <strong>Baitybites ORM SaaS</strong>. Menu &amp; produk di bawah adalah simulasi etalase bisnis kuliner klien.
        </p>

        <div className="demo-floating-bar__actions">
          <Link href="/demo" className="btn-demo-pill is-primary">
            <span>Pusat Demo Interaktif</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={2.2} />
          </Link>

          <Link href="/kitchen" className="btn-demo-pill is-ghost">
            <HugeiconsIcon icon={KitchenUtensilsIcon} size={13} strokeWidth={2} />
            <span>Layar Dapur (KDS)</span>
          </Link>

          <Link href="/platform" className="btn-demo-pill is-ghost">
            <HugeiconsIcon icon={Store01Icon} size={13} strokeWidth={2} />
            <span>Info Platform SaaS</span>
          </Link>

          <button
            type="button"
            className="btn-demo-close"
            onClick={() => setIsVisible(false)}
            aria-label="Tutup notifikasi demo"
            title="Tutup banner demo"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
