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
  ShieldKeyIcon,
  CheckmarkCircle02Icon,
  LockKeyIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { superAdminLoginAction } from "@/app/login/actions";
import "./admin.scss";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        const dest = (fromPath && fromPath.startsWith("/")) ? fromPath : (res.redirectTo || "/orders");
        const msg =
          res.role === "PLATFORM_OWNER"
            ? "Autentikasi berhasil! Mengarahkan ke Platform Owner Console..."
            : res.role === "KASIR"
            ? "Autentikasi berhasil! Mengarahkan ke Modul Kasir & Pesanan..."
            : res.role === "KITCHEN_STAFF"
            ? "Autentikasi berhasil! Mengarahkan ke Layar Dapur (KDS)..."
            : "Autentikasi berhasil! Mengarahkan ke Dashboard Toko...";
        setSuccessMsg(msg);
        setTimeout(() => {
          router.push(dest);
        }, 800);
      } else {
        setErrorMsg(res.error || "Kombinasi username/password/PIN tidak valid.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login">
      {/* Ambient background blobs */}
      <div className="admin-login__blob admin-login__blob--1" aria-hidden="true" />
      <div className="admin-login__blob admin-login__blob--2" aria-hidden="true" />
      <div className="admin-login__blob admin-login__blob--3" aria-hidden="true" />

      {/* Back to site */}
      <Link href="/" className="admin-login__back">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
        <span>Kembali ke Beranda</span>
      </Link>

      {/* Main Card */}
      <div className="admin-login__card">
        {/* Header */}
        <div className="admin-login__header">
          <div className="admin-login__shield">
            <HugeiconsIcon icon={ShieldKeyIcon} size={28} strokeWidth={1.5} />
          </div>
          <div className="admin-login__badge">
            <HugeiconsIcon icon={SecurityCheckIcon} size={11} strokeWidth={2} />
            <span>Portal Otentikasi Resmi</span>
          </div>
          <h1 className="admin-login__title">Masuk Administrasi</h1>
          <p className="admin-login__subtitle">
            Autentikasi aman untuk Platform Owner dan Client Admin Toko.
          </p>
        </div>

        {/* Notice jika diarahkan dari onboarding */}
        {fromPath && fromPath.includes("onboarding") && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <HugeiconsIcon icon={LockKeyIcon} size={15} />
              <strong>Autentikasi Diperlukan:</strong>
            </span>{" "}
            Silakan login menggunakan akun Client Admin Anda terlebih dahulu untuk mengakses panduan konfigurasi setup onboarding toko.
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="admin-login__alert admin-login__alert--error" role="alert">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="admin-login__alert admin-login__alert--success" role="status">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="admin-field">
            <label htmlFor="admin-username" className="admin-field__label">
              Username atau Email
            </label>
            <div className="admin-field__input-wrap">
              <span className="admin-field__icon">
                <HugeiconsIcon icon={UserIcon} size={17} strokeWidth={1.8} />
              </span>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                className="admin-field__input"
                placeholder="Contoh: admin.sidrrevive"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="admin-field">
            <div className="admin-field__label-row">
              <label htmlFor="admin-password" className="admin-field__label">
                Password
              </label>
            </div>
            <div className="admin-field__input-wrap">
              <span className="admin-field__icon">
                <HugeiconsIcon icon={LockPasswordIcon} size={17} strokeWidth={1.8} />
              </span>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="admin-field__input"
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="admin-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                tabIndex={-1}
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewOffIcon : ViewIcon}
                  size={17}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </div>

          {/* Security PIN Kasir */}
          <div className="admin-field">
            <div className="admin-field__label-row">
              <label htmlFor="admin-pin" className="admin-field__label">
                Security PIN 4-Digit (Opsional)
              </label>
              <span className="admin-field__hint">Default awal: 1234</span>
            </div>
            <div className="admin-field__input-wrap">
              <span className="admin-field__icon">
                <HugeiconsIcon icon={SecurityCheckIcon} size={17} strokeWidth={1.8} />
              </span>
              <input
                id="admin-pin"
                name="securityPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                className="admin-field__input"
                placeholder="••••"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ""))}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="admin-login__submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={18} strokeWidth={2} />
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </>
            )}
          </button>
        </form>

      </div>

      <p className="admin-login__footer">
        © {new Date().getFullYear()} Baitybites OMS · Enkripsi TLS 256-bit
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="admin-login-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Memuat sistem autentikasi...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
