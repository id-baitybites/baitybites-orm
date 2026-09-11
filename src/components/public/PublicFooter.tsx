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
              <div className="brand-icon" aria-hidden="true">
                <span />
                <span />
              </div>
              <strong>Baitybites</strong>
            </Link>
            <p>
              Menghadirkan Risol Mayo artisan &amp; kuliner Indonesia dengan bahan premium,
              resep otentik higienis, serta kemudahan pemesanan cepat.
            </p>
            <div className="brand-contacts">
              <span>
                <HugeiconsIcon icon={Location01Icon} size={15} strokeWidth={2} />
                Jl. Kuliner No. 18, Jakarta Selatan
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
              <li><a href="#order">Risol Mayo Beef Double Cheese</a></li>
              <li><a href="#order">Risol Smoked Beef Mozzarella</a></li>
              <li><a href="#order">Risol Spicy Tuna Melt</a></li>
              <li><a href="#order">Cendol Coffee Signature</a></li>
              <li><a href="#order">Paket Frozen Family Pack</a></li>
            </ul>
          </div>

          {/* LAYANAN & PUSAT BANTUAN */}
          <div className="footer-col">
            <h4>Layanan Pelanggan</h4>
            <ul>
              <li><a href="#tracking">Cek Status Pesanan (Tracking)</a></li>
              <li><a href="#gallery">Katalog &amp; Varian Rasa</a></li>
              <li><a href="#testimony">Ulasan &amp; Testimoni</a></li>
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
