"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { superAdminLoginAction } from "@/app/login/actions";
import "./admin.scss";

export default function AdminLoginPage() {
  const router = useRouter();

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
        setSuccessMsg("Autentikasi berhasil! Mengarahkan ke Dashboard OMS...");
        setTimeout(() => {
          router.push("/orders");
        }, 900);
      } else {
        setErrorMsg(res.error || "Kombinasi username/password/PIN tidak valid.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername("superadmin");
    setPassword("baitybites2026");
    setSecurityPin("9988");
    setErrorMsg(null);
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

      <div className="admin-login__card">
        {/* Header */}
        <div className="admin-login__header">
          <div className="admin-login__shield">
            <HugeiconsIcon icon={ShieldKeyIcon} size={28} strokeWidth={1.5} />
          </div>
          <div className="admin-login__badge">
            <HugeiconsIcon icon={SecurityCheckIcon} size={11} strokeWidth={2} />
            <span>Portal Admin Baitybites OMS</span>
          </div>
          <h1 className="admin-login__title">Masuk Superadmin</h1>
          <p className="admin-login__subtitle">
            Autentikasi multi-layer untuk akses penuh ke sistem manajemen pesanan.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="admin-login__alert admin-login__alert--error" role="alert">
            <span>⚠️</span>
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
                placeholder="superadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="admin-field">
            <label htmlFor="admin-password" className="admin-field__label">
              Master Password
            </label>
            <div className="admin-field__input-wrap">
              <span className="admin-field__icon">
                <HugeiconsIcon icon={LockPasswordIcon} size={17} strokeWidth={1.8} />
              </span>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="admin-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
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

          {/* Security PIN */}
          <div className="admin-field">
            <label htmlFor="admin-pin" className="admin-field__label">
              Security PIN
              <span className="admin-field__label-note">4-digit, opsional</span>
            </label>
            <div className="admin-field__input-wrap">
              <span className="admin-field__icon">
                <HugeiconsIcon icon={Key01Icon} size={17} strokeWidth={1.8} />
              </span>
              <input
                id="admin-pin"
                name="securityPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                placeholder="– – – –"
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
                <span>Masuk ke Dashboard OMS</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        {/* Credentials hint */}
        <div className="admin-login__hint">
          <div className="admin-login__hint-row">
            <span>Username</span>
            <code>superadmin</code>
          </div>
          <div className="admin-login__hint-row">
            <span>Password</span>
            <code>baitybites2026</code>
          </div>
          <div className="admin-login__hint-row">
            <span>PIN</span>
            <code>9988</code>
          </div>
          <button type="button" className="admin-login__autofill" onClick={fillDemo}>
            Isi Otomatis
          </button>
        </div>
      </div>

      <p className="admin-login__footer">
        © {new Date().getFullYear()} Baitybites OMS · Enkripsi TLS 256-bit
      </p>
    </div>
  );
}
