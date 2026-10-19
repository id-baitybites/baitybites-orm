"use client";

import { useState, FormEvent } from "react";
import { sendSubscriptionEmail, SubscriptionRequest } from "./actions";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface SubscriptionModalProps {
  isOpen: boolean;
  planName: string;
  planPrice: string;
  onClose: () => void;
}

type FormStatus = "idle" | "sending" | "success" | "error";

export default function SubscriptionModal({
  isOpen,
  planName,
  planPrice,
  onClose,
}: SubscriptionModalProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [resultMsg, setResultMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.currentTarget);
    const data: SubscriptionRequest = {
      businessName: formData.get("businessName") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      selectedPlan: planName,
      message: (formData.get("message") as string) || undefined,
    };

    const result = await sendSubscriptionEmail(data);
    setStatus(result.success ? "success" : "error");
    setResultMsg(result.message);
  };

  const handleClose = () => {
    setStatus("idle");
    setResultMsg("");
    onClose();
  };

  return (
    <div className="sub-modal-overlay" onClick={handleClose}>
      <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="sub-modal__close" onClick={handleClose} type="button">
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>

        {/* Header */}
        <div className="sub-modal__header">
          <div className="sub-modal__badge">{planName}</div>
          <h2>Formulir Berlangganan</h2>
          <p>
            Paket <strong>{planName}</strong> — <span className="price-highlight">{planPrice}</span>
          </p>
        </div>

        {/* Success / Error state */}
        {status === "success" ? (
          <div className="sub-modal__result sub-modal__result--success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} />
            <h3>Permintaan Terkirim!</h3>
            <p>{resultMsg}</p>
            <button className="btn-modal-close" onClick={handleClose} type="button">
              Tutup
            </button>
          </div>
        ) : status === "error" ? (
          <div className="sub-modal__result sub-modal__result--error">
            <h3>Gagal Mengirim</h3>
            <p>{resultMsg}</p>
            <button
              className="btn-modal-retry"
              onClick={() => setStatus("idle")}
              type="button"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          /* Form */
          <form className="sub-modal__form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sub-businessName">Nama Bisnis / Brand</label>
                <input
                  id="sub-businessName"
                  name="businessName"
                  type="text"
                  placeholder="Contoh: Risol Mayo Enak"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="sub-contactName">Nama Penanggung Jawab</label>
                <input
                  id="sub-contactName"
                  name="contactName"
                  type="text"
                  placeholder="Contoh: Ahmad Fauzi"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sub-email">Email Aktif</label>
                <input
                  id="sub-email"
                  name="email"
                  type="email"
                  placeholder="email@domain.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="sub-phone">Nomor WhatsApp / Telepon</label>
                <input
                  id="sub-phone"
                  name="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sub-message">Pesan Tambahan (Opsional)</label>
              <textarea
                id="sub-message"
                name="message"
                rows={3}
                placeholder="Ceritakan sedikit tentang bisnis Anda atau kebutuhan khusus..."
              />
            </div>

            <button
              type="submit"
              className="btn-submit-sub"
              disabled={status === "sending"}
            >
              {status === "sending" ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="spin-icon" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>Kirim Permintaan Langganan</span>
              )}
            </button>

            <p className="sub-modal__privacy">
              Data Anda hanya digunakan untuk keperluan komunikasi langganan. Kami tidak membagikan informasi Anda kepada pihak ketiga.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
