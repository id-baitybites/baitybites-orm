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
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { superAdminLoginAction } from "@/app/login/actions";
import "./login.scss";

export default function SuperAdminLoginPage() {
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
        setSuccessMsg("Autentikasi Superadmin berhasil! Mengalihkan ke Dashboard OMS...");
        setTimeout(() => {
          router.push("/dashboard");
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
            <HugeiconsIcon icon={SecurityCheckIcon} size={13} strokeWidth={2} />
            <span>Superadmin Portal</span>
          </div>

          <h1>Login Superadmin</h1>
          <p>Masukkan kredensial otentikasi tingkat tinggi untuk mengelola sistem Baitybites OMS.</p>
        </header>

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

        {/* Form Login */}
        <form className="login-page__form" onSubmit={handleSubmit}>
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
                Layer Tambahan
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

          {/* Remember me & Forgot Password */}
          <div className="form-extra">
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Ingat sesi ini</span>
            </label>
            <a href="#reset" onClick={(e) => { e.preventDefault(); alert("Silakan hubungi IT Security Baitybites untuk reset kredensial master superadmin."); }} className="forgot-link">
              Lupa Password?
            </a>
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
          <div className="demo-item">
            <span>PIN:</span>
            <code>9988</code>
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
            Gunakan Kredensial Demo Ini Otomatis
          </button>
        </div>

        {/* Footer info */}
        <footer className="login-page__footer">
          <span>&copy; {new Date().getFullYear()} Baitybites OMS. Enkripsi TLS 256-bit terverifikasi.</span>
        </footer>
      </div>
    </div>
  );
}
