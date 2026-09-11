"use client";

import { Logout01Icon, Menu01Icon, Cancel01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { navigation, type NavItem } from "@/lib/navigation";
import "./app-shell.scss";

function NavGroupItem({
  item,
  activePath,
}: {
  item: NavItem;
  activePath: string;
}) {
  const isChildActive = item.children?.some((c) => c.href === activePath);
  const isSelfActive = activePath === item.href;
  const isActive = isSelfActive || isChildActive;

  const [open, setOpen] = useState(isActive);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`nav-group${isActive ? " is-active" : ""}${open ? " is-open" : ""}`}
    >
      <button
        type="button"
        className="nav-group__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.8} />
        <span>{item.label}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={12}
          strokeWidth={2}
          className="nav-group__chevron"
        />
      </button>

      {open && (
        <div className="nav-group__dropdown" role="menu">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              className={activePath === child.href ? "is-active" : ""}
              onClick={() => setOpen(false)}
            >
              <HugeiconsIcon icon={child.icon} size={14} strokeWidth={1.8} />
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activePath = pathname.startsWith("/orders/") ? "/orders" : pathname;

  // All items for mobile nav (flatten children)
  const mobileNavItems = navigation.flatMap((item) =>
    item.children ? item.children : [item]
  );

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <Link href="/" className="app-shell__brand">
            <div className="app-shell__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="app-shell__brand-text">
              <strong>Baitybites</strong>
              <small>BITE THE BEST</small>
            </div>
          </Link>

          <nav className="app-shell__nav" aria-label="Navigasi utama">
            {navigation.map((item) =>
              item.children ? (
                <NavGroupItem key={item.href} item={item} activePath={activePath} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={activePath === item.href ? "is-active" : ""}
                >
                  <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              )
            )}
          </nav>

          <div className="app-shell__actions">
            <button className="app-shell__logout" type="button" aria-label="Keluar dari sistem">
              <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
              <span>Logout</span>
            </button>

            <button
              className="app-shell__menu"
              type="button"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={22} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        {menuOpen && (
          <nav className="app-shell__mobile-nav" aria-label="Navigasi mobile">
            <div className="app-shell__mobile-nav-inner">
              {mobileNavItems.map(({ label, href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={activePath === href ? "is-active" : ""}
                  onClick={() => setMenuOpen(false)}
                >
                  <HugeiconsIcon icon={icon} size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                </Link>
              ))}
              <button
                className="app-shell__mobile-logout"
                type="button"
                onClick={() => setMenuOpen(false)}
              >
                <HugeiconsIcon icon={Logout01Icon} size={17} strokeWidth={1.8} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* CONTENT */}
      <main className="app-shell__content">{children}</main>

      {/* UNIFIED PREMIUM FOOTER */}
      <footer className="app-shell__footer">
        <div className="app-shell__footer-inner">
          <div className="app-shell__footer-brand">
            <div className="app-shell__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong>Baitybites</strong>
              <small>BITE THE BEST</small>
            </div>
          </div>

          <div className="app-shell__footer-description">
            <strong>Baitybites OMS</strong>
            <span>Sistem Manajemen Produksi &amp; Pemesanan Risol Premium</span>
          </div>

          <div className="app-shell__footer-meta">
            <span>Build: v2.2.12</span>
            <span>API: 2.0.0</span>
            <span>&copy; 2026 Baitybites. Hak cipta dilindungi.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
