import Image from "next/image";
import Link from "next/link";
import {
  CallIcon,
  Mail01Icon,
  Location01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <div className="public-footer__top">
          {/* BRAND & CONTACT */}
          <div className="footer-brand">
            <Link href="/" className="brand-logo">
              <Image
                src="/images/logos/baitybites-logo.png"
                alt="Baitybites Logo"
                width={150}
                height={42}
                style={{ height: "auto", width: "auto", maxHeight: "42px" }}
              />
            </Link>
            <p>
              Menghadirkan Risol Mayo artisan &amp; kuliner Indonesia dengan bahan premium,
              resep otentik higienis, serta kemudahan pemesanan cepat.
            </p>
            <div className="brand-contacts">
              <span>
                <HugeiconsIcon icon={Location01Icon} size={15} strokeWidth={2} />
                <a
                  href="https://www.google.com/maps?q=-6.385874561302349,106.761898"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                  title="Lihat Lokasi Toko di Google Maps"
                >
                  Jl. Amsar No.RT 01/06, Sawangan, Kec. Sawangan, Kota Depok, Jawa Barat 16511
                </a>
              </span>
              <span>
                <HugeiconsIcon icon={CallIcon} size={15} strokeWidth={2} />
                +62 812-8888-0230 (WhatsApp Center)
              </span>
              <span>
                <HugeiconsIcon icon={Mail01Icon} size={15} strokeWidth={2} />
                halo@baitybites.id
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
          <span>&copy; {new Date().getFullYear()} Baitybites Indonesia. Seluruh hak cipta dilindungi.</span>
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
