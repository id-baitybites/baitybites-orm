"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Database01Icon,
  Download01Icon,
  Upload01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  Loading03Icon,
  Clock01Icon,
  ShieldKeyIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import {
  triggerBackupAction,
  downloadBackupAction,
  restoreBackupAction,
} from "./actions";
import type { SnapshotMeta } from "@/lib/backup-engine";
import "./backup.scss";

export function BackupClient({
  initialBackups,
}: {
  initialBackups: SnapshotMeta[];
}) {
  const [backups, setBackups] = useState<SnapshotMeta[]>(initialBackups);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePayload, setRestorePayload] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger Instant Snapshot
  function handleTriggerBackup() {
    setMessage(null);
    startTransition(async () => {
      const res = await triggerBackupAction();
      if (res.success && res.filename) {
        setMessage({
          type: "success",
          text: `Snapshot berhasil dibuat: ${res.filename} (${res.size}).`,
        });
        // Optimistic refresh
        setBackups((prev) => [
          {
            filename: res.filename!,
            sizeBytes: 0,
            sizeFormatted: res.size || "Unknown",
            createdAt: new Date().toISOString(),
            type: "JSON_SNAPSHOT",
            recordCounts: res.counts,
          },
          ...prev,
        ]);
      } else {
        setMessage({
          type: "error",
          text: res.error || "Gagal membuat snapshot database.",
        });
      }
    });
  }

  // Handle Download
  async function handleDownload(filename: string) {
    try {
      const res = await downloadBackupAction(filename);
      if (res.success && res.content) {
        const blob = new Blob([res.content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(res.error || "Gagal mengunduh file backup.");
      }
    } catch {
      alert("Terjadi kesalahan saat mengunduh file.");
    }
  }

  // Handle File Selection for Restore
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.data || !parsed.meta) {
          alert("File JSON ini bukan snapshot database Baitybites ORM yang valid.");
          return;
        }
        setRestorePayload(text);
        setRestorePreview(parsed);
        setShowRestoreModal(true);
      } catch {
        alert("Gagal membaca file JSON. Pastikan format file valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // Execute Restore
  function handleExecuteRestore() {
    if (!restorePayload) return;
    setMessage(null);
    startTransition(async () => {
      const res = await restoreBackupAction(restorePayload, confirmInput);
      if (res.success) {
        setShowRestoreModal(false);
        setRestorePayload(null);
        setRestorePreview(null);
        setConfirmInput("");
        setMessage({
          type: "success",
          text: "Database berhasil dipulihkan dari snapshot! Semua modul telah disinkronkan kembali.",
        });
      } else {
        alert(res.error || "Gagal memulihkan database.");
      }
    });
  }

  return (
    <div className="backup-page">
      <div className="backup-page__header">
        <Link href="/settings" className="back-link">
          <HugeiconsIcon icon={ArrowLeft01Icon as IconSvgElement} size={16} />
          <span>Kembali ke Pengaturan Toko</span>
        </Link>
        <h1>Backup Database &amp; Recovery Tool</h1>
        <p>
          Otomasi pencadangan harian, manajemen snapshot data mandiri, dan alat
          pemulihan bencana (Disaster Recovery) untuk sistem Baitybites ORM.
        </p>
      </div>

      {/* Automated Cron Status Banner */}
      <div className="backup-page__banner">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon as IconSvgElement}
          size={24}
          className="banner-icon"
        />
        <div className="banner-text">
          <strong>Sistem Otomasi Pencadangan Aktif</strong>
          <p>
            1. <strong>Penjadwal Otomatis Utama (Daily Cloud Job)</strong>: Berjalan otomatis setiap hari pukul
            02:00 WIB (19:00 UTC) via workflow pencadangan data dengan retensi 30 hari.
            <br />
            2. <strong>Serverless Backup Endpoint</strong>: Terhubung ke endpoint <code>/api/cron/db-backup</code> untuk menjamin integritas data secara independen.
          </p>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            background:
              message.type === "success"
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
            border:
              message.type === "success"
                ? "1px solid rgba(16, 185, 129, 0.3)"
                : "1px solid rgba(239, 68, 68, 0.3)",
            color: message.type === "success" ? "#a7f3d0" : "#fca5a5",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <HugeiconsIcon
            icon={
              (message.type === "success"
                ? CheckmarkCircle02Icon
                : AlertCircleIcon) as IconSvgElement
            }
            size={18}
          />
          <span>{message.text}</span>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="backup-page__grid">
        {/* On-Demand Backup */}
        <div className="backup-page__card">
          <div className="card-header">
            <div className="card-icon">
              <HugeiconsIcon
                icon={Database01Icon as IconSvgElement}
                size={20}
              />
            </div>
            <h3>Buat Snapshot Sekarang</h3>
          </div>
          <p className="card-desc">
            Ambil cadangan data lengkap (Produk, Kategori, Pesanan, Pelanggan, Tema,
            dan Konfigurasi) dalam format JSON terstruktur yang aman dan portabel.
          </p>
          <button
            type="button"
            className="card-action-btn card-action-btn--primary"
            onClick={handleTriggerBackup}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon as IconSvgElement}
                  size={16}
                  className="animate-spin"
                />
                <span>Membuat Snapshot Data...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={PlayIcon as IconSvgElement} size={16} />
                <span>Cadangkan Database (On-Demand)</span>
              </>
            )}
          </button>
        </div>

        {/* Disaster Recovery Tool */}
        <div className="backup-page__card backup-page__card--danger">
          <div className="card-header">
            <div className="card-icon card-icon--red">
              <HugeiconsIcon
                icon={ShieldKeyIcon as IconSvgElement}
                size={20}
              />
            </div>
            <h3>Pemulihan Bencana (Recovery Tool)</h3>
          </div>
          <p className="card-desc">
            Pulihkan data sistem dari file snapshot JSON sebelumnya. Berguna jika terjadi
            kerusakan data atau perpindahan instance database.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".json"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="card-action-btn card-action-btn--danger"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <HugeiconsIcon icon={Upload01Icon as IconSvgElement} size={16} />
            <span>Upload &amp; Pulihkan Snapshot</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="backup-page__history">
        <div className="history-header">
          <h3>Riwayat Snapshot &amp; Cadangan Tersimpan</h3>
          <span>Total {backups.length} file cadangan</span>
        </div>

        {backups.length === 0 ? (
          <div className="empty-state">
            <HugeiconsIcon
              icon={Clock01Icon as IconSvgElement}
              size={36}
              style={{ opacity: 0.5, marginBottom: "0.5rem" }}
            />
            <p>Belum ada file snapshot di server. Klik &ldquo;Cadangkan Database&rdquo; untuk membuat snapshot pertama.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama File Snapshot</th>
                  <th>Tipe</th>
                  <th>Ukuran</th>
                  <th>Waktu Pembuatan</th>
                  <th>Statistik Record</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.filename}>
                    <td>
                      <code style={{ color: "#38bdf8", fontWeight: 600 }}>
                        {b.filename}
                      </code>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          b.type === "JSON_SNAPSHOT"
                            ? "badge--json"
                            : "badge--sql"
                        }`}
                      >
                        {b.type === "JSON_SNAPSHOT" ? "JSON Snapshot" : "SQL Dump"}
                      </span>
                    </td>
                    <td>{b.sizeFormatted}</td>
                    <td>
                      {new Date(b.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      {b.recordCounts ? (
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          {b.recordCounts.products ?? 0} Prod,{" "}
                          {b.recordCounts.orders ?? 0} Order,{" "}
                          {b.recordCounts.customers ?? 0} Pelanggan
                        </span>
                      ) : (
                        <span style={{ color: "#64748b" }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-download"
                        onClick={() => handleDownload(b.filename)}
                      >
                        <HugeiconsIcon
                          icon={Download01Icon as IconSvgElement}
                          size={14}
                        />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && restorePreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#111827",
              border: "1px solid #dc2626",
              borderRadius: "14px",
              padding: "2rem",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "#ef4444",
                marginBottom: "1rem",
              }}
            >
              <HugeiconsIcon
                icon={AlertCircleIcon as IconSvgElement}
                size={24}
              />
              <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.25rem" }}>
                Konfirmasi Pemulihan Database
              </h3>
            </div>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                lineHeight: 1.5,
                marginBottom: "1.25rem",
              }}
            >
              Tindakan ini akan menimpa/memperbarui data saat ini dengan isi file
              snapshot berikut:
            </p>

            <div
              style={{
                background: "#030712",
                border: "1px solid #1f2937",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.5rem",
                fontSize: "0.825rem",
                color: "#e2e8f0",
              }}
            >
              <div style={{ marginBottom: "0.4rem" }}>
                <strong>Waktu Snapshot:</strong>{" "}
                {new Date(restorePreview.meta?.createdAt).toLocaleString("id-ID")}
              </div>
              <div style={{ marginBottom: "0.4rem" }}>
                <strong>Generator:</strong> {restorePreview.meta?.generator}
              </div>
              <div>
                <strong>Statistik Record:</strong>
                <ul style={{ margin: "0.4rem 0 0 1rem", padding: 0 }}>
                  <li>Produk: {restorePreview.meta?.counts?.products ?? 0}</li>
                  <li>Kategori: {restorePreview.meta?.counts?.categories ?? 0}</li>
                  <li>Pelanggan: {restorePreview.meta?.counts?.customers ?? 0}</li>
                  <li>Pesanan: {restorePreview.meta?.counts?.orders ?? 0}</li>
                </ul>
              </div>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "#fca5a5",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Ketik &ldquo;PULIHKAN DATABASE&rdquo; di bawah untuk melanjutkan:
            </p>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="PULIHKAN DATABASE"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#ffffff",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                disabled={isPending}
                style={{
                  padding: "0.65rem 1.25rem",
                  background: "transparent",
                  border: "1px solid #374151",
                  color: "#cbd5e1",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={
                  isPending ||
                  confirmInput.trim().toUpperCase() !== "PULIHKAN DATABASE"
                }
                style={{
                  padding: "0.65rem 1.25rem",
                  background:
                    confirmInput.trim().toUpperCase() === "PULIHKAN DATABASE"
                      ? "#ef4444"
                      : "#4b5563",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "8px",
                  cursor:
                    confirmInput.trim().toUpperCase() === "PULIHKAN DATABASE"
                      ? "pointer"
                      : "not-allowed",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                {isPending ? "Memulihkan Database..." : "Ya, Pulihkan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
