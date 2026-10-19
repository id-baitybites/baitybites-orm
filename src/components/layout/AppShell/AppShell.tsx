"use client";

import {
  Logout01Icon,
  Menu01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  Store01Icon,
  RocketIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import platformIcon from "@/app/icon.png";
import {
  platformNavigation,
  storeNavigation,
  getNavigationByRole,
  type NavItem,
} from "@/lib/navigation";
import { logoutAction } from "@/app/login/actions";
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
  const [role, setRole] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const activePath = pathname.startsWith("/orders/") ? "/orders" : pathname;

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)bb_role=([^;]*)/);
    if (match) {
      setRole(decodeURIComponent(match[1]));
    }
  }, []);

  // Deteksi cakupan: Platform Owner Console vs Store Merchant OMS
  const isPlatformScope =
    pathname.startsWith("/platform") ||
    pathname.startsWith("/settings/leads") ||
    pathname.startsWith("/settings/provision");

  const currentNav = isPlatformScope ? platformNavigation : getNavigationByRole(role);

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  // All items for mobile nav (flatten children)
  const mobileNavItems = currentNav.flatMap((item) =>
    item.children ? item.children : [item]
  );

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          {/* Brand Logo & Title */}
          {isPlatformScope ? (
            <Link href="/platform/console" className="app-shell__brand-platform">
              <div className="platform-logo-badge">
                <Image
                  src={platformIcon}
                  alt="Baitybites ORM"
                  width={32}
                  height={32}
                  className="platform-logo-img"
                  priority
                />
              </div>
              <div className="platform-brand-meta">
                <span className="brand-name">
                  Baitybites <strong>ORM</strong>
                </span>
                <span className="brand-badge-owner">Platform Console</span>
              </div>
            </Link>
          ) : (
            <Link href="/orders" className="app-shell__brand">
              <Image
                src="/images/logos/baitybites-logo.png"
                alt="Baitybites Logo"
                width={130}
                height={35}
                className="app-shell__brand-logo"
                priority
              />
            </Link>
          )}

          {/* Navigasi Utama Tersegregasi */}
          <nav className="app-shell__nav" aria-label="Navigasi utama">
            {currentNav.map((item) =>
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

          {/* Quick Context Switcher & Actions */}
          <div className="app-shell__actions">
            {isPlatformScope ? (
              <Link
                href="/"
                className="app-shell__scope-switch"
                title="Buka Halaman Penjualan Platform"
                target="_blank"
              >
                <span>Web Penjualan</span>
              </Link>
            ) : (
              <Link
                href="/platform/console"
                className="app-shell__scope-switch"
                title="Buka Platform Owner Console"
              >
                <HugeiconsIcon icon={RocketIcon} size={14} />
                <span>Platform Console</span>
              </Link>
            )}

            {role && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background:
                    role === "PLATFORM_OWNER"
                      ? "rgba(79, 70, 229, 0.2)"
                      : role === "KASIR"
                      ? "rgba(16, 185, 129, 0.2)"
                      : role === "KITCHEN_STAFF"
                      ? "rgba(217, 119, 6, 0.2)"
                      : "rgba(234, 88, 12, 0.2)",
                  color:
                    role === "PLATFORM_OWNER"
                      ? "#a5b4fc"
                      : role === "KASIR"
                      ? "#6ee7b7"
                      : role === "KITCHEN_STAFF"
                      ? "#fcd34d"
                      : "#fdba74",
                  border:
                    role === "PLATFORM_OWNER"
                      ? "1px solid rgba(79, 70, 229, 0.4)"
                      : role === "KASIR"
                      ? "1px solid rgba(16, 185, 129, 0.4)"
                      : role === "KITCHEN_STAFF"
                      ? "1px solid rgba(217, 119, 6, 0.4)"
                      : "1px solid rgba(234, 88, 12, 0.4)",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {role === "PLATFORM_OWNER"
                  ? "Owner"
                  : role === "KASIR"
                  ? "Kasir"
                  : role === "KITCHEN_STAFF"
                  ? "Kitchen"
                  : "Super Admin"}
              </span>
            )}

            <button
              className="app-shell__logout"
              type="button"
              aria-label="Keluar dari sistem"
              onClick={handleLogout}
              disabled={isPending}
              aria-busy={isPending}
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
              <span>{isPending ? "Keluar..." : "Logout"}</span>
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
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                disabled={isPending}
              >
                <HugeiconsIcon icon={Logout01Icon} size={17} strokeWidth={1.8} />
                <span>{isPending ? "Keluar..." : "Logout"}</span>
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
            <Image
              src="/images/logos/baitybites-logo.png"
              alt="Baitybites Logo"
              width={140}
              height={38}
              style={{ height: "auto", width: "auto", maxHeight: "38px" }}
            />
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
