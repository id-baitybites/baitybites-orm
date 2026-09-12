"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu01Icon,
  Cancel01Icon,
  Logout01Icon,
  UserIcon,
  ShoppingBag01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface PublicHeaderProps {
  isLoggedIn?: boolean;
  initialCustomer?: CustomerInfo | null;
}

export function PublicHeader({ initialCustomer }: PublicHeaderProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo | null>(initialCustomer ?? null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (initialCustomer) {
      setCustomer(initialCustomer);
    }

    // 1. Baca info customer dari cookie non-httpOnly bb_customer_info via regex RFC-compliant
    const match = document.cookie.match(/(?:^|;\s*)bb_customer_info=([^;]*)/);
    if (match && match[1]) {
      try {
        let val = match[1];
        // Buka URL-encoding hingga mendapatkan string JSON valid
        while (val.includes("%")) {
          try {
            const decoded = decodeURIComponent(val);
            if (decoded === val) break;
            val = decoded;
          } catch {
            break;
          }
        }
        if (val.startsWith('"') && val.endsWith('"') && val.length > 2 && val[1] === '{') {
          val = val.slice(1, -1);
        }
        setCustomer(JSON.parse(val));
      } catch (err) {
        console.error("Gagal parse cookie bb_customer_info:", err);
      }
    }

    // 2. Sinkronisasi sesi real-time via API (mencegah desinkronisasi client cache)
    fetch("/api/auth/customer/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.customer) {
          setCustomer(data.customer);
        } else if (data && !data.authenticated) {
          setCustomer(null);
        }
      })
      .catch(() => {});

    // 3. Cek apakah admin login (bb_admin)
    const adminMatch = document.cookie.match(/(?:^|;\s*)bb_admin=([^;]*)/);
    setIsAdmin(Boolean(adminMatch));
  }, [initialCustomer]);

  return (
    <header className="public-header">
      <div className="public-header__inner">
        {/* LOGO */}
        <Link href="/" className="public-header__brand">
          <Image
            src="/images/logos/baitybites-logo.png"
            alt="Baitybites Logo"
            width={140}
            height={38}
            className="public-header__brand-logo"
            priority
          />
        </Link>

        {/* NAV MENU */}
        <nav className="public-header__nav" aria-label="Navigasi publik">
          <a href="#hero">Beranda</a>
          <a href="#gallery">Katalog &amp; Menu</a>
          <a href="#order">Pesan Online</a>
          <a href="#tracking">Tracking Order</a>
          <a href="#testimony">Testimoni</a>
        </nav>

        {/* ACTIONS: LOGIN / PROFIL BUTTON */}
        <div className="public-header__actions">
          {customer ? (
            /* Pelanggan Sedang Login */
            <div className="customer-header-group">
              <Link href="/profile" className="btn-customer-profile" title="Buka Profil & Pengaturan Pengiriman">
                {customer.avatarUrl ? (
                  <Image
                    src={customer.avatarUrl}
                    alt={customer.name}
                    width={26}
                    height={26}
                    className="customer-header-avatar"
                    unoptimized
                  />
                ) : (
                  <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={2} />
                )}
                <span>{customer.name.split(" ")[0]}</span>
              </Link>

              <a
                href="/api/auth/customer/logout"
                className="btn-customer-logout"
                title="Keluar dari akun pelanggan"
              >
                <HugeiconsIcon icon={Logout01Icon} size={15} strokeWidth={1.8} />
              </a>
            </div>
          ) : (
            /* Pelanggan Belum Login: Tombol Google Login */
            <a
              href="/api/auth/google?returnTo=/profile"
              className="btn-google-login"
              title="Masuk dengan Akun Google"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Masuk Google</span>
            </a>
          )}

          {/* Akses Admin OMS jika admin login */}
          {isAdmin && (
            <Link href="/orders" className="btn-auth-dashboard" title="Buka Dashboard OMS">
              <HugeiconsIcon icon={Settings01Icon} size={15} strokeWidth={2} />
              <span>OMS</span>
            </Link>
          )}

          {/* MOBILE TOGGLE */}
          <button
            type="button"
            className="btn-mobile-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <HugeiconsIcon
              icon={mobileOpen ? Cancel01Icon : Menu01Icon}
              size={22}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <div className={`public-header__mobile-drawer ${mobileOpen ? "is-open" : ""}`}>
        <a href="#hero" onClick={() => setMobileOpen(false)}>Beranda</a>
        <a href="#gallery" onClick={() => setMobileOpen(false)}>Katalog &amp; Menu</a>
        <a href="#order" onClick={() => setMobileOpen(false)}>Pesan Online</a>
        <a href="#tracking" onClick={() => setMobileOpen(false)}>Tracking Order</a>
        <a href="#testimony" onClick={() => setMobileOpen(false)}>Testimoni</a>

        <div className="mobile-auth">
          {customer ? (
            <>
              <Link
                href="/profile"
                className="btn-customer-profile"
                onClick={() => setMobileOpen(false)}
              >
                <HugeiconsIcon icon={UserIcon} size={16} />
                <span>Profil Saya ({customer.name})</span>
              </Link>
              <a
                href="/api/auth/customer/logout"
                className="btn-auth-login"
                onClick={() => setMobileOpen(false)}
              >
                Logout
              </a>
            </>
          ) : (
            <a
              href="/api/auth/google?returnTo=/profile"
              className="btn-google-login"
              onClick={() => setMobileOpen(false)}
            >
              Masuk dengan Google
            </a>
          )}

          {isAdmin && (
            <Link
              href="/orders"
              className="btn-auth-dashboard"
              onClick={() => setMobileOpen(false)}
            >
              Buka Dashboard OMS
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
