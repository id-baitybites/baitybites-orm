"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserIcon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffIcon,
  SecurityCheckIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Loading03Icon,
  Key01Icon,
  CheckmarkCircle02Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { superAdminLoginAction } from "@/app/login/actions";
import "./login.scss";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "admin" ? "admin" : "customer";
  const returnTo = searchParams.get("from") || "/profile";

  const [activeTab, setActiveTab] = useState<"customer" | "admin">(initialTab);

  // Superadmin Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(searchParams.get("error"));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmitAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("securityPin", securityPin);

    try {
      const res = await superAdminLoginAction(formData);
      if (res.success) {
        setSuccessMsg("Autentikasi Superadmin berhasil! Mengalihkan ke Dashboard OMS...");
        setTimeout(() => {
          router.push("/orders");
        }, 800);
      } else {
        setErrorMsg(res.error || "Gagal melakukan login.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername("superadmin");
    setPassword("baitybites2026");
    setSecurityPin("9988");
    if (errorMsg) setErrorMsg(null);
  };

  return (
    <div className="login-page">
      {/* Tombol Kembali ke Halaman Publik */}
      <Link href="/" className="login-page__back">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
        <span>Kembali ke Beranda</span>
      </Link>

      <div className="login-page__card">
        {/* Header Branding */}
        <header className="login-page__header">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="badge-superadmin">
            <HugeiconsIcon
              icon={activeTab === "customer" ? ShoppingBag01Icon : SecurityCheckIcon}
              size={13}
              strokeWidth={2}
            />
            <span>{activeTab === "customer" ? "Akun Pelanggan" : "Superadmin Portal"}</span>
          </div>

          <h1>{activeTab === "customer" ? "Masuk ke Akun Anda" : "Login Superadmin"}</h1>
          <p>
            {activeTab === "customer"
              ? "Masuk dengan Google untuk mengelola alamat pengiriman dan memantau status pesanan."
              : "Masukkan kredensial otentikasi tingkat tinggi untuk mengelola sistem Baitybites OMS."}
          </p>
        </header>

        {/* Tab Switcher: Pelanggan vs Admin */}
        <div className="login-page__tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === "customer" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("customer");
              setErrorMsg(null);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
            <span>Pelanggan</span>
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === "admin" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("admin");
              setErrorMsg(null);
            }}
          >
            <HugeiconsIcon icon={SecurityCheckIcon} size={15} />
            <span>Superadmin</span>
          </button>
        </div>

        {/* Notifikasi Error / Success */}
        {errorMsg && (
          <div className="login-page__notice login-page__notice--error">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-page__notice login-page__notice--success">
            <span>✨</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── TAB 1: PELANGGAN (GOOGLE LOGIN) ── */}
        {activeTab === "customer" && (
          <div className="login-page__customer-box">
            <div className="customer-benefit-list">
              <div className="benefit-item">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                <span>Simpan alamat pengiriman &amp; nomor WhatsApp otomatis</span>
              </div>
              <div className="benefit-item">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                <span>Pantau riwayat dan progres pesanan secara real-time</span>
              </div>
              <div className="benefit-item">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                <span>Checkout lebih cepat tanpa mengetik ulang data diri</span>
              </div>
            </div>

            {/* Tombol Utama Google Sign-In */}
            <a
              href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
              className="btn-google-action"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
              <span>Lanjutkan dengan Google</span>
            </a>

            {/* Opsi Coba Demo Akun untuk Pengujian Lokal Cepat */}
            <div className="quick-test-section">
              <span>Mode Pengujian Demo Instan:</span>
              <a
                href={`/api/auth/google?mode=demo&email=budi.santoso@gmail.com&name=Budi+Santoso&returnTo=${encodeURIComponent(
                  returnTo
                )}`}
                className="btn-quick-customer"
              >
                <span>👤 Budi Santoso (Pelanggan Baru)</span>
                <span>Masuk &rarr;</span>
              </a>
              <a
                href={`/api/auth/google?mode=demo&email=siti.rahma@gmail.com&name=Siti+Rahma&returnTo=${encodeURIComponent(
                  returnTo
                )}`}
                className="btn-quick-customer"
              >
                <span>⭐ Siti Rahma (Pelanggan Setia)</span>
                <span>Masuk &rarr;</span>
              </a>
            </div>
          </div>
        )}

        {/* ── TAB 2: SUPERADMIN (OMS) ── */}
        {activeTab === "admin" && (
          <>
            <form className="login-page__form" onSubmit={handleSubmitAdmin}>
              {/* 1. Username / Email */}
              <div className="form-group">
                <label htmlFor="login-username">
                  <span>Username / Email</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.8} />
                  </span>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="superadmin atau admin@baitybites.id"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 2. Password */}
              <div className="form-group">
                <label htmlFor="login-password">
                  <span>Master Password</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <HugeiconsIcon icon={LockPasswordIcon} size={18} strokeWidth={1.8} />
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Tampilkan password"
                  >
                    <HugeiconsIcon
                      icon={showPassword ? ViewOffIcon : ViewIcon}
                      size={18}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>
              </div>

              {/* 3. Security PIN (2FA Extra Layer) */}
              <div className="form-group">
                <label htmlFor="login-pin">
                  <span>Security PIN (4-Digit)</span>
                  <small style={{ color: "var(--color-primary, #ff7a00)", fontWeight: 500 }}>
                    Opsional
                  </small>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <HugeiconsIcon icon={Key01Icon} size={18} strokeWidth={1.8} />
                  </span>
                  <input
                    id="login-pin"
                    name="securityPin"
                    type="password"
                    maxLength={4}
                    placeholder="9988"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={18} strokeWidth={2} />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard OMS</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                  </>
                )}
              </button>
            </form>

            {/* Demo Quick Credentials Card */}
            <div className="login-page__demo-credentials">
              <strong>Kredensial Akses Superadmin:</strong>
              <div className="demo-item">
                <span>Username:</span>
                <code>superadmin</code>
              </div>
              <div className="demo-item">
                <span>Password:</span>
                <code>baitybites2026</code>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--color-primary, #ff7a00)",
                }}
              >
                Gunakan Kredensial Ini Otomatis
              </button>
            </div>
          </>
        )}

        {/* Footer info */}
        <footer className="login-page__footer">
          <span>&copy; {new Date().getFullYear()} Baitybites. Enkripsi TLS 256-bit terverifikasi.</span>
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page"><div className="login-page__card"><p>Memuat halaman login...</p></div></div>}>
      <LoginFormInner />
    </Suspense>
  );
}
