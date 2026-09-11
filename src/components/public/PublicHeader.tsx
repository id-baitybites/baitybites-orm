"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu01Icon,
  Cancel01Icon,
  Logout01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PublicHeaderProps {
  isLoggedIn?: boolean;
}

export function PublicHeader({ isLoggedIn = true }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  const toggleLogin = () => {
    setLoggedIn((prev) => !prev);
  };

  return (
    <header className="public-header">
      <div className="public-header__inner">
        {/* LOGO */}
        <Link href="/" className="public-header__brand">
          <div className="public-header__brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="public-header__brand-text">
            <strong>Baitybites</strong>
            <small>BITE THE BEST</small>
          </div>
        </Link>

        {/* NAV MENU */}
        <nav className="public-header__nav" aria-label="Navigasi publik">
          <a href="#hero">Beranda</a>
          <a href="#gallery">Katalog &amp; Menu</a>
          <a href="#order">Pesan Online</a>
          <a href="#tracking">Tracking Order</a>
          <a href="#testimony">Testimoni</a>
        </nav>

        {/* ACTIONS: LOGIN / LOGOUT BUTTON */}
        <div className="public-header__actions">
          {loggedIn ? (
            <>
              <Link href="/orders" className="btn-auth-dashboard" title="Buka Dashboard OMS">
                <HugeiconsIcon icon={UserIcon} size={15} strokeWidth={2} />
                <span>Dashboard OMS</span>
              </Link>
              <button
                type="button"
                className="btn-auth-login"
                onClick={toggleLogin}
                title="Keluar dari sesi"
              >
                <HugeiconsIcon icon={Logout01Icon} size={15} strokeWidth={1.8} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-auth-login"
              title="Masuk ke Akun Superadmin"
            >
              <HugeiconsIcon icon={UserIcon} size={15} strokeWidth={1.8} />
              <span>Login</span>
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
          {loggedIn ? (
            <>
              <Link
                href="/orders"
                className="btn-auth-dashboard"
                onClick={() => setMobileOpen(false)}
              >
                Buka Dashboard OMS
              </Link>
              <button
                type="button"
                className="btn-auth-login"
                onClick={() => {
                  toggleLogin();
                  setMobileOpen(false);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-auth-login"
              onClick={() => {
                toggleLogin();
                setMobileOpen(false);
              }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
