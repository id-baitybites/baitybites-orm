"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  Building01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Copy01Icon,
  Upload01Icon,
  Attachment01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  Search01Icon,
  Cancel01Icon,
  CustomerServiceIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  getLeadForPaymentConfirmation,
  submitPaymentProofAction,
  type PublicPaymentConfirmationLead,
} from "./actions";
import "./payment-confirmation.scss";

interface PaymentConfirmationClientProps {
  initialLead: PublicPaymentConfirmationLead | null;
  initialError?: string;
  queryLead?: string;
  queryInvoice?: string;
}

const BANK_TARGETS = [
  {
    name: "Bank Central Asia (BCA)",
    accountNo: "880-1234-567",
    accountHolder: "PT Baitybites Solusi Digital",
    code: "BCA",
  },
  {
    name: "Bank Mandiri",
    accountNo: "137-00-9876543-2",
    accountHolder: "PT Baitybites Solusi Digital",
    code: "MANDIRI",
  },
];

const POPULAR_BANKS = [
  "BCA",
  "Bank Mandiri",
  "BRI",
  "BNI",
  "Bank Syariah Indonesia (BSI)",
  "CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "Bank Jago / Seabank / Neo",
  "Lainnya",
];

export function PaymentConfirmationClient({
  initialLead,
  initialError,
  queryLead,
  queryInvoice,
}: PaymentConfirmationClientProps) {
  const [lead, setLead] = useState<PublicPaymentConfirmationLead | null>(initialLead);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form input states
  const [bankSenderName, setBankSenderName] = useState(lead?.contactName || "");
  const [bankName, setBankName] = useState("BCA");
  const [customBankName, setCustomBankName] = useState("");
  const [targetBank, setTargetBank] = useState("BCA 880-1234-567");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");

  // UI state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showEditProof, setShowEditProof] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryInvoice || queryLead || "");
  const [isPending, startTransition] = useTransition();

  const handleCopy = (key: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Format file harus berupa gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file bukti transfer maksimal 5 MB.");
      return;
    }

    setErrorMsg(null);
    setImageName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageBase64("");
    setImageName("");
  };

  const handleSearchLead = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await getLeadForPaymentConfirmation(searchQuery.trim(), searchQuery.trim());
      if (res.success && res.lead) {
        setLead(res.lead);
        if (res.lead.contactName && !bankSenderName) {
          setBankSenderName(res.lead.contactName);
        }
      } else {
        setErrorMsg(res.error || "Data invoice atau registrasi tidak ditemukan.");
      }
    });
  };

  const handleSubmitProof = (e: FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    const chosenBank = bankName === "Lainnya" ? customBankName.trim() : bankName;

    if (!bankSenderName.trim()) {
      setErrorMsg("Nama pemilik rekening pengirim wajib diisi.");
      return;
    }
    if (!chosenBank) {
      setErrorMsg("Nama bank pengirim wajib dipilih atau dicantumkan.");
      return;
    }
    if (!imageBase64) {
      setErrorMsg("Silakan unggah foto atau screenshot bukti transfer Anda.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await submitPaymentProofAction({
        leadId: lead.id,
        bankSenderName: bankSenderName.trim(),
        bankName: chosenBank,
        targetBank,
        referenceNumber: referenceNumber.trim() || undefined,
        imageBase64,
      });

      if (res.success && res.lead) {
        setLead(res.lead);
        setSuccessMsg(res.message);
        setShowEditProof(false);
        setImageBase64("");
        setImageName("");
      } else {
        setErrorMsg(res.message || "Gagal mengunggah bukti transfer.");
      }
    });
  };

  const isAlreadyPaid =
    lead?.status === "LUNAS" ||
    lead?.status === "PROVISIONING" ||
    lead?.status === "PROVISIONED" ||
    lead?.status === "ONBOARDING_SELESAI" ||
    lead?.status === "WEBSITE_AKTIF";

  const isUnderReview = lead?.status === "BUKTI_DITERIMA";

  return (
    <div className="payment-page">
      <div className="payment-page__container">
        {/* Header Section */}
        <header className="payment-page__header">
          <div className="payment-page__brand">
            <div className="payment-page__brand-icon">
              <HugeiconsIcon icon={Building01Icon} size={22} />
            </div>
            <div>
              <h1 className="payment-page__brand-title">Baitybites ORM</h1>
              <p className="payment-page__brand-subtitle">Portal Konfirmasi Pembayaran Resmi</p>
            </div>
          </div>
          <a
            href="https://wa.me/6281298765432"
            target="_blank"
            rel="noopener noreferrer"
            className="payment-page__support-link"
          >
            <HugeiconsIcon icon={CustomerServiceIcon} size={16} />
            <span>Bantuan WhatsApp: 0812-9876-5432</span>
          </a>
        </header>

        {/* Global Feedback Alert */}
        {errorMsg && (
          <div className="payment-page__alert payment-page__alert--error">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="payment-page__alert payment-page__alert--success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Lead Not Found Search Fallback */}
        {!lead ? (
          <div className="payment-page__card payment-page__card--hero">
            <h2 className="payment-page__section-title">
              <HugeiconsIcon icon={Search01Icon} size={20} />
              Cari Tagihan Invoice Anda
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 16px" }}>
              Tautan konfirmasi tidak menyertakan parameter yang sesuai atau masa berlaku telah kedaluwarsa.
              Silakan masukkan ID Registrasi Klien atau Nomor Invoice Anda (contoh: <code>INV-BB-...</code>) untuk melanjutkan proses konfirmasi pembayaran:
            </p>
            <form onSubmit={handleSearchLead} className="payment-page__search-box">
              <input
                type="text"
                placeholder="Masukkan Nomor Invoice atau ID Registrasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
              <button type="submit" disabled={isPending}>
                {isPending ? (
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="spin" />
                ) : (
                  <HugeiconsIcon icon={Search01Icon} size={16} />
                )}
                <span>Cari Tagihan</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Invoice Summary Card */}
            <div className="payment-page__card payment-page__card--hero">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }}>
                    Detail Tagihan Langganan
                  </span>
                  <h2 style={{ margin: "4px 0 0", fontSize: "22px", color: "#0f172a" }}>
                    {lead.businessName}
                  </h2>
                </div>

                {isAlreadyPaid ? (
                  <span className="payment-page__status-badge payment-page__status-badge--paid">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                    Pembayaran Lunas &amp; Terverifikasi
                  </span>
                ) : isUnderReview ? (
                  <span className="payment-page__status-badge payment-page__status-badge--review">
                    <HugeiconsIcon icon={Clock01Icon} size={14} />
                    Bukti Diterima — Dalam Verifikasi
                  </span>
                ) : (
                  <span className="payment-page__status-badge payment-page__status-badge--invoice">
                    <HugeiconsIcon icon={Clock01Icon} size={14} />
                    Menunggu Bukti Transfer
                  </span>
                )}
              </div>

              <div className="payment-page__invoice-grid">
                <div className="payment-page__invoice-item">
                  <span>Nomor Invoice:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong>{lead.invoiceNumber}</strong>
                    <button
                      type="button"
                      className="payment-page__bank-item-copy-btn"
                      onClick={() => handleCopy("invoice", lead.invoiceNumber)}
                      title="Salin Nomor Invoice"
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={14} />
                      {copiedKey === "invoice" ? "Tersalin" : ""}
                    </button>
                  </div>
                </div>

                <div className="payment-page__invoice-item">
                  <span>Kontak Penanggung Jawab:</span>
                  <strong>{lead.contactName} ({lead.email})</strong>
                </div>

                <div className="payment-page__invoice-item">
                  <span>Paket Lisensi:</span>
                  <strong>{lead.selectedPlan} ({lead.planTag})</strong>
                </div>

                <div className="payment-page__invoice-item payment-page__invoice-item--highlight">
                  <span>Total Tagihan:</span>
                  <strong>{lead.planPrice}</strong>
                </div>
              </div>
            </div>

            {/* If Already Paid */}
            {isAlreadyPaid && (
              <div className="payment-page__card payment-page__card--success">
                <h3 className="payment-page__section-title" style={{ color: "#166534" }}>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
                  Pembayaran Telah Diverifikasi Lunas
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: "14px", lineHeight: "1.6", color: "#166534" }}>
                  Terima kasih! Pembayaran lisensi sistem Baitybites ORM untuk bisnis <strong>{lead.businessName}</strong> telah diverifikasi secara resmi. Akses administrasi Anda telah aktif dan siap digunakan.
                </p>
                <Link
                  href="/admin?from=%2Fonboarding"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#166534",
                    color: "#ffffff",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                >
                  <span>Masuk ke Dashboard Toko</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </div>
            )}

            {/* If Under Review */}
            {isUnderReview && !showEditProof && (
              <div className="payment-page__card payment-page__card--pending">
                <h3 className="payment-page__section-title" style={{ color: "#92400e" }}>
                  <HugeiconsIcon icon={Clock01Icon} size={20} />
                  Bukti Pembayaran Telah Diterima
                </h3>
                <p style={{ margin: "0 0 14px", fontSize: "14px", lineHeight: "1.6", color: "#92400e" }}>
                  Foto/screenshot bukti pembayaran Anda telah tersimpan di sistem kami. Tim keuangan sedang memproses verifikasi mutasi rekening (estimasi 1x24 jam kerja).
                </p>

                <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "8px", border: "1px solid #fcd34d", marginBottom: "16px", fontSize: "13px" }}>
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Pengirim:</strong> {lead.paymentSenderName || "—"} ({lead.paymentBankName || "Bank"})
                  </p>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>Waktu Unggah:</strong> {lead.paymentSubmittedAt ? new Date(lead.paymentSubmittedAt).toLocaleString("id-ID") : "—"}
                  </p>
                  {lead.paymentProofUrl && (
                    <a
                      href={lead.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#d97706", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <HugeiconsIcon icon={Attachment01Icon} size={14} />
                      <span>Lihat Foto Bukti Transfer yang Diunggah</span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditProof(true)}
                  style={{
                    background: "none",
                    border: "1px solid #d97706",
                    color: "#d97706",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Unggah Ulang Bukti Transfer Baru
                </button>
              </div>
            )}

            {/* Instructions & Upload Form (Shown when INVOICE_DIKIRIM or explicitly editing proof) */}
            {(!isAlreadyPaid && (!isUnderReview || showEditProof)) && (
              <>
                {/* Bank Account Transfer Target Card */}
                <div className="payment-page__card payment-page__card--banks">
                  <h3 className="payment-page__section-title">
                    <HugeiconsIcon icon={Building01Icon} size={18} />
                    Instruksi Rekening Transfer Resmi
                  </h3>
                  <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#64748b" }}>
                    Silakan melakukan transfer nominal tagihan ke salah satu rekening bank resmi kami di bawah ini:
                  </p>

                  <div className="payment-page__bank-list">
                    {BANK_TARGETS.map((bank) => (
                      <div key={bank.code} className="payment-page__bank-item">
                        <div className="payment-page__bank-item-header">
                          <span className="payment-page__bank-item-name">{bank.name}</span>
                          <button
                            type="button"
                            className="payment-page__bank-item-copy-btn"
                            onClick={() => handleCopy(bank.code, bank.accountNo.replace(/-/g, ""))}
                          >
                            <HugeiconsIcon icon={Copy01Icon} size={14} />
                            <span>{copiedKey === bank.code ? "Tersalin" : "Salin No"}</span>
                          </button>
                        </div>
                        <div className="payment-page__bank-item-number">
                          <span>{bank.accountNo}</span>
                        </div>
                        <div className="payment-page__bank-item-holder">
                          a/n <strong>{bank.accountHolder}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Harap cantumkan Berita Transfer: <code>{lead.invoiceNumber}</code> untuk mempercepat verifikasi.
                  </p>
                </div>

                {/* Upload Proof Form */}
                <div className="payment-page__card">
                  <h3 className="payment-page__section-title">
                    <HugeiconsIcon icon={Upload01Icon} size={18} />
                    Form Konfirmasi &amp; Bukti Transfer
                  </h3>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
                    Lengkapi rincian rekening pengirim dan lampirkan bukti screenshot atau foto resi transfer Anda:
                  </p>

                  <form onSubmit={handleSubmitProof} className="payment-page__form">
                    <div className="payment-page__form-row">
                      <div className="payment-page__form-group">
                        <label>Nama Pemilik Rekening Pengirim *</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap sesuai mutasi bank..."
                          value={bankSenderName}
                          onChange={(e) => setBankSenderName(e.target.value)}
                          required
                        />
                        <span className="form-hint">Harus sesuai nama pemilik rekening asal transfer</span>
                      </div>

                      <div className="payment-page__form-group">
                        <label>Bank Asal Pengirim *</label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                        >
                          {POPULAR_BANKS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {bankName === "Lainnya" && (
                      <div className="payment-page__form-group">
                        <label>Sebutkan Nama Bank Asal Lainnya *</label>
                        <input
                          type="text"
                          placeholder="Contoh: Bank Nagari, BPD DIY, dll."
                          value={customBankName}
                          onChange={(e) => setCustomBankName(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="payment-page__form-row">
                      <div className="payment-page__form-group">
                        <label>Rekening Tujuan Transfer *</label>
                        <select
                          value={targetBank}
                          onChange={(e) => setTargetBank(e.target.value)}
                        >
                          <option value="BCA 880-1234-567">BCA — 880-1234-567 (PT Baitybites Solusi Digital)</option>
                          <option value="Mandiri 137-00-9876543-2">Mandiri — 137-00-9876543-2 (PT Baitybites Solusi Digital)</option>
                        </select>
                      </div>

                      <div className="payment-page__form-group">
                        <label>Nomor Referensi Transaksi (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Contoh: 123456789 atau nomor mutasi"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                        />
                        <span className="form-hint">Dapat ditemukan pada resi atau mutasi m-banking</span>
                      </div>
                    </div>

                    {/* File Upload Box */}
                    <div className="payment-page__form-group">
                      <label>Foto / Screenshot Bukti Transfer *</label>

                      {!imageBase64 ? (
                        <label className="payment-page__dropzone">
                          <HugeiconsIcon icon={Upload01Icon} size={28} className="payment-page__dropzone-icon" />
                          <p className="payment-page__dropzone-title">Klik di sini untuk memilih foto bukti transfer</p>
                          <p className="payment-page__dropzone-desc">Format yang didukung: JPG, PNG, WebP (Maksimal 5 MB)</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                          />
                        </label>
                      ) : (
                        <div className="payment-page__preview">
                          <img src={imageBase64} alt="Pratinjau Bukti Transfer" />
                          <button
                            type="button"
                            className="payment-page__preview-remove"
                            onClick={handleRemoveImage}
                          >
                            <HugeiconsIcon icon={Cancel01Icon} size={14} />
                            <span>Ganti File</span>
                          </button>
                        </div>
                      )}
                      {imageName && (
                        <span className="form-hint" style={{ marginTop: "6px" }}>
                          File terpilih: <strong>{imageName}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "10px" }}>
                      <button
                        type="submit"
                        className="payment-page__submit-btn"
                        disabled={isPending || !imageBase64}
                      >
                        {isPending ? (
                          <>
                            <HugeiconsIcon icon={Loading03Icon} size={18} className="spin" />
                            <span>Mengunggah Bukti...</span>
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={Upload01Icon} size={18} />
                            <span>Kirim Bukti Pembayaran</span>
                          </>
                        )}
                      </button>

                      {showEditProof && (
                        <button
                          type="button"
                          onClick={() => setShowEditProof(false)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </>
            )}
          </>
        )}

        {/* Footer info */}
        <footer className="payment-page__footer">
          &copy; {new Date().getFullYear()} Baitybites ORM &bull; Divisi Keuangan &amp; Billing Pelanggan
        </footer>
      </div>
    </div>
  );
}
