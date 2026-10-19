import Image from "next/image";
import Link from "next/link";
import {
  CallIcon,
  Mail01Icon,
  Location01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PublicFooterProps {
  brandName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}

export function PublicFooter({
  brandName,
  tagline,
  phone,
  email,
  address,
  logoUrl,
}: PublicFooterProps = {}) {
  const effectiveBrand = brandName || process.env.NEXT_PUBLIC_STORE_NAME || "Baitybites";
  const effectiveTagline =
    tagline ||
    "Menghadirkan kuliner artisan dengan bahan premium, resep otentik higienis, serta kemudahan pemesanan cepat.";
  const effectivePhone = phone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "+62 812-8888-0230";
  const effectiveEmail = email || process.env.STORE_EMAIL || "halo@baitybites.id";
  const effectiveAddress =
    address ||
    "Jl. Amsar No.RT 01/06, Sawangan, Kec. Sawangan, Kota Depok, Jawa Barat 16511";

  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <div className="public-footer__top">
          {/* BRAND & CONTACT */}
          <div className="footer-brand">
            <Link href="/" className="brand-logo">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${effectiveBrand} Logo`}
                  width={150}
                  height={42}
                  style={{ height: "auto", width: "auto", maxHeight: "42px" }}
                />
              ) : effectiveBrand.toLowerCase() !== "baitybites" ? (
                <span
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    color: "#f8fafc",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {effectiveBrand}
                </span>
              ) : (
                <Image
                  src="/images/logos/baitybites-logo.png"
                  alt="Baitybites Logo"
                  width={150}
                  height={42}
                  style={{ height: "auto", width: "auto", maxHeight: "42px" }}
                />
              )}
            </Link>
            <p>{effectiveTagline}</p>
            <div className="brand-contacts">
              <span>
                <HugeiconsIcon icon={Location01Icon} size={15} strokeWidth={2} />
                <span>{effectiveAddress}</span>
              </span>
              <span>
                <HugeiconsIcon icon={CallIcon} size={15} strokeWidth={2} />
                {effectivePhone} (WhatsApp Center)
              </span>
              <span>
                <HugeiconsIcon icon={Mail01Icon} size={15} strokeWidth={2} />
                {effectiveEmail}
              </span>
            </div>
          </div>

          {/* MENU / NAV LINKS */}
          <div className="footer-col">
            <h4>Menu Favorit</h4>
            <ul>
              <li><Link href="/order">Risol Mayo Beef Double Cheese</Link></li>
              <li><Link href="/order">Risol Beef Mushroom Truffle</Link></li>
              <li><Link href="/order">Risol Spicy Tuna Melt</Link></li>
              <li><Link href="/order">Cendol Coffee Signature</Link></li>
              <li><Link href="/order">Paket Frozen Family Pack</Link></li>
            </ul>
          </div>

          {/* LAYANAN & PUSAT BANTUAN */}
          <div className="footer-col">
            <h4>Layanan Pelanggan</h4>
            <ul>
              <li><Link href="/tracking">Cek Status Pesanan (Tracking)</Link></li>
              <li><Link href="/order">Katalog &amp; Pemesanan Online</Link></li>
              <li><Link href="/#testimony">Ulasan &amp; Testimoni</Link></li>
              <li><Link href="/kitchen">Akses Kitchen Display (Staff)</Link></li>
              <li><Link href="/orders">Portal Admin OMS</Link></li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div className="footer-newsletter">
            <h4>Dapatkan Promo &amp; Menu Baru</h4>
            <p>Daftarkan email untuk mendapatkan voucher diskon dan info rilis rasa terbaru.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email Anda..." required />
              <button type="submit">Daftar</button>
            </form>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="public-footer__bottom">
          <span>&copy; {new Date().getFullYear()} {effectiveBrand}. Seluruh hak cipta dilindungi.</span>
          <div className="bottom-links">
            <a href="#privacy">Kebijakan Privasi</a>
            <a href="#terms">Syarat &amp; Ketentuan</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
