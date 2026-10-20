"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  UserGroupIcon,
  Search01Icon,
  WhatsappIcon,
  Mail01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  AlertCircleIcon,
  RocketIcon,
  Cancel01Icon,
  Loading03Icon,
  PencilEdit02Icon,
  ShieldKeyIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sparkles,
  Phone,
  Receipt,
  Upload,
  CheckCircle2,
  Settings2,
  Rocket,
  PartyPopper,
  Globe,
  XCircle,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  updateLeadStatusAction,
  sendEmailReplyAction,
  sendOnboardingInviteAction,
} from "./actions";
import type { ClientLead, LeadStatus } from "@/lib/leads-store";

interface LeadsClientProps {
  initialLeads: ClientLead[];
}

const STATUS_LABELS: Record<LeadStatus, { label: string; badgeClass: string; Icon: LucideIcon }> = {
  BARU: { label: "Baru (Perlu Respon)", badgeClass: "status-baru", Icon: Sparkles },
  DIHUBUNGI: { label: "Sudah Dihubungi", badgeClass: "status-dihubungi", Icon: Phone },
  INVOICE_DIKIRIM: { label: "Invoice Terkirim", badgeClass: "status-invoice", Icon: Receipt },
  BUKTI_DITERIMA: { label: "Bukti Diterima", badgeClass: "status-bukti", Icon: Upload },
  LUNAS: { label: "Pembayaran Lunas", badgeClass: "status-lunas", Icon: CheckCircle2 },
  PROVISIONING: { label: "Sedang Dibuat", badgeClass: "status-provisioning", Icon: Settings2 },
  PROVISIONED: { label: "Instance Siap", badgeClass: "status-provisioned", Icon: Rocket },
  ONBOARDING_SELESAI: { label: "Onboarding Selesai", badgeClass: "status-onboarding", Icon: PartyPopper },
  WEBSITE_AKTIF: { label: "Website Aktif", badgeClass: "status-aktif", Icon: Globe },
  BATAL: { label: "Dibatalkan", badgeClass: "status-batal", Icon: XCircle },
};

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const [leads, setLeads] = useState<ClientLead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Email Reply Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [activeEmailLead, setActiveEmailLead] = useState<ClientLead | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailFeedback, setEmailFeedback] = useState("");

  // Notes Modal State
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [activeNotesLead, setActiveNotesLead] = useState<ClientLead | null>(null);
  const [notesText, setNotesText] = useState("");

  // Status Action Feedback
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Filter Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesFilter =
      activeFilter === "ALL" || lead.status === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      lead.businessName.toLowerCase().includes(q) ||
      lead.contactName.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.selectedPlan.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Summary Metrics
  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.status === "BARU").length;
  const inProgressCount = leads.filter(
    (l) =>
      l.status === "DIHUBUNGI" ||
      l.status === "INVOICE_DIKIRIM" ||
      l.status === "BUKTI_DITERIMA"
  ).length;
  const readyCount = leads.filter(
    (l) =>
      l.status === "LUNAS" ||
      l.status === "PROVISIONED" ||
      l.status === "ONBOARDING_SELESAI" ||
      l.status === "WEBSITE_AKTIF"
  ).length;

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    startTransition(async () => {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
      const res = await updateLeadStatusAction(id, newStatus);
      if (res.emailSent && res.emailRecipient) {
        setStatusFeedback(`Email otomatis (${newStatus}) terkirim ke: ${res.emailRecipient}`);
        setTimeout(() => setStatusFeedback(null), 10000);
      }
    });
  };

  const handleSendOnboardingInvite = (id: string, name: string) => {
    startTransition(async () => {
      setStatusFeedback(`Mengirimkan kredensial otentikasi Client Admin & link onboarding ke ${name}...`);
      const res = await sendOnboardingInviteAction(id);
      if (res.success) {
        setStatusFeedback(`Kredensial Client Admin berhasil dikirim via Brevo ke: ${res.emailRecipient}`);
      } else {
        setStatusFeedback(`Gagal mengirim kredensial: ${res.message}`);
      }
      setTimeout(() => setStatusFeedback(null), 10000);
    });
  };

  const handleOpenEmailModal = (lead: ClientLead) => {
    setActiveEmailLead(lead);
    setReplySubject(`Tanggapan Permintaan Langganan ${lead.selectedPlan} — Baitybites ORM`);
    setReplyMessage(
      `Halo Bapak/Ibu ${lead.contactName},\n\nTerima kasih telah mengajukan permohonan berlangganan paket ${lead.selectedPlan} untuk ${lead.businessName}.\n\nKami telah menyiapkan proposal rincian aktivasi instance dan invoice pembayaran Anda.\n\nJika ada pertanyaan mengenai integrasi atau fitur, kami siap membantu.\n\nSalam hormat,\nTim Baitybites ORM`
    );
    setEmailStatus("idle");
    setEmailFeedback("");
    setEmailModalOpen(true);
  };

  const handleSendEmailReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmailLead) return;

    setEmailStatus("sending");
    const res = await sendEmailReplyAction({
      leadId: activeEmailLead.id,
      recipientEmail: activeEmailLead.email,
      recipientName: activeEmailLead.contactName,
      subject: replySubject,
      message: replyMessage,
    });

    if (res.success) {
      setEmailStatus("success");
      setEmailFeedback(res.message);
      // Update local state to DIHUBUNGI
      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeEmailLead.id ? { ...l, status: "DIHUBUNGI" } : l
        )
      );
    } else {
      setEmailStatus("error");
      setEmailFeedback(res.message);
    }
  };

  const handleOpenNotesModal = (lead: ClientLead) => {
    setActiveNotesLead(lead);
    setNotesText(lead.internalNotes || "");
    setNotesModalOpen(true);
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotesLead) return;

    startTransition(async () => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeNotesLead.id ? { ...l, internalNotes: notesText } : l
        )
      );
      await updateLeadStatusAction(activeNotesLead.id, activeNotesLead.status, notesText);
      setNotesModalOpen(false);
    });
  };

  const getWaLink = (lead: ClientLead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.slice(1)
      : cleanPhone;

    const invoiceNo = `INV-BB-${lead.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
    const planUpper = lead.selectedPlan.toUpperCase();
    let planPrice = "Rp 1.490.000 / bulan";
    if (planUpper.includes("STARTER")) planPrice = "Rp 750.000 / bulan";
    else if (planUpper.includes("ENTERPRISE")) planPrice = "Rp 3.900.000 / bulan";

    if (lead.status === "INVOICE_DIKIRIM") {
      const text = encodeURIComponent(
        `Halo Kak ${lead.contactName} (${lead.businessName}),\n\nBerikut rincian tagihan resmi (Invoice) langganan Baitybites ORM Anda:\n\n` +
        `🧾 *No. Invoice:* ${invoiceNo}\n` +
        `📦 *Paket:* ${lead.selectedPlan}\n` +
        `💰 *Total Biaya:* ${planPrice}\n\n` +
        `*Rekening Pembayaran Resmi Vendor:*\n` +
        `🏦 *BCA:* 880-1234-567 a/n PT Baitybites Solusi Digital\n` +
        `🏦 *Mandiri:* 137-00-9876543-2 a/n PT Baitybites Solusi Digital\n\n` +
        `Invoice lengkap telah kami kirimkan ke email Anda (${lead.email}). Mohon kirimkan konfirmasi bukti transfer di sini agar instance dedicated segera di-deploy. Terima kasih!`
      );
      return `https://wa.me/${formattedPhone}?text=${text}`;
    }

    const text = encodeURIComponent(
      `Halo Kak ${lead.contactName} (${lead.businessName}), salam dari tim Baitybites ORM Platform. Kami telah menerima permohonan paket ${lead.selectedPlan} Anda. Apakah ada waktu luang untuk kami bantu jelaskan proses aktivasi instance-nya?`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  return (
    <div className="leads-management">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="leads-header">
        <div>
          <div className="leads-badge">
            <HugeiconsIcon icon={UserGroupIcon} size={13} />
            <span>Platform Owner Backoffice</span>
          </div>
          <h1>Permintaan Klien Baru</h1>
          <p>
            Kelola, respon, dan tindak lanjuti prospek langganan baru dari landing page Baitybites ORM.
          </p>
        </div>

        <div className="header-actions">
          <Link href="/settings/provision" className="btn-provision-shortcut">
            <HugeiconsIcon icon={RocketIcon} size={15} />
            <span>Generator Repo Klien</span>
          </Link>
        </div>
      </div>

      {/* ── Stat Metric Cards ─────────────────────────────────────── */}
      <div className="leads-metrics">
        <div className="metric-card">
          <span className="metric-title">Total Permintaan</span>
          <span className="metric-val">{totalCount}</span>
          <span className="metric-sub">Seluruh prospek masuk</span>
        </div>
        <div className="metric-card metric-card--highlight">
          <span className="metric-title">Perlu Respon (Baru)</span>
          <span className="metric-val">{newCount}</span>
          <span className="metric-sub">Belum ditindaklanjuti</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Dalam Negosiasi</span>
          <span className="metric-val">{inProgressCount}</span>
          <span className="metric-sub">Dihubungi / Invoice</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Siap / Aktif</span>
          <span className="metric-val">{readyCount}</span>
          <span className="metric-sub">Lunas &amp; Berjalan</span>
        </div>
      </div>

      {/* ── Status Change Feedback Banner ────────────────────────── */}
      {statusFeedback && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} style={{ color: "#3b82f6", flexShrink: 0 }} />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* ── Filters & Search ──────────────────────────────────────── */}
      <div className="leads-controls">
        <div className="filter-tabs">
          <button
            type="button"
            className={`tab-btn ${activeFilter === "ALL" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("ALL")}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "BARU" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("BARU")}
          >
            <Sparkles size={13} /> Baru ({newCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "DIHUBUNGI" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("DIHUBUNGI")}
          >
            <Phone size={13} /> Dihubungi
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "INVOICE_DIKIRIM" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("INVOICE_DIKIRIM")}
          >
            <Receipt size={13} /> Invoice Terkirim
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "BUKTI_DITERIMA" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("BUKTI_DITERIMA")}
          >
            <Upload size={13} /> Bukti Diterima
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "LUNAS" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("LUNAS")}
          >
            <CheckCircle2 size={13} /> Lunas
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "PROVISIONED" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("PROVISIONED")}
          >
            <Rocket size={13} /> Instance Siap
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "ONBOARDING_SELESAI" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("ONBOARDING_SELESAI")}
          >
            <PartyPopper size={13} /> Onboarding
          </button>
          <button
            type="button"
            className={`tab-btn ${activeFilter === "WEBSITE_AKTIF" ? "is-active" : ""}`}
            onClick={() => setActiveFilter("WEBSITE_AKTIF")}
          >
            <Globe size={13} /> Website Aktif
          </button>
        </div>

        <div className="search-box">
          <HugeiconsIcon icon={Search01Icon} size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama bisnis, kontak, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Leads Table / List ─────────────────────────────────────── */}
      <div className="leads-table-container">
        {filteredLeads.length === 0 ? (
          <div className="empty-state">
            <HugeiconsIcon icon={Clock01Icon} size={36} />
            <p>Tidak ada permintaan klien yang sesuai dengan filter.</p>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Bisnis &amp; Kontak</th>
                <th>Paket Pilihan</th>
                <th>Kontak Komunikasi</th>
                <th>Status Tahapan</th>
                <th>Catatan Internal</th>
                <th>Aksi Respon</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const statusMeta = STATUS_LABELS[lead.status] || {
                  label: lead.status,
                  badgeClass: "",
                  Icon: HelpCircle,
                };
                return (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-business">
                        <span className="business-name">{lead.businessName}</span>
                        <span className="contact-name">PIC: {lead.contactName}</span>
                        {lead.message && (
                          <div className="lead-note-preview" title={lead.message}>
                            &ldquo;{lead.message}&rdquo;
                          </div>
                        )}
                        <span className="date-label">
                          {new Date(lead.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="plan-badge">{lead.selectedPlan}</span>
                    </td>

                    <td>
                      <div className="contact-actions">
                        <a
                          href={getWaLink(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contact-btn contact-btn--wa"
                          title="Chat via WhatsApp"
                        >
                          <HugeiconsIcon icon={WhatsappIcon} size={14} />
                          <span>{lead.phone}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenEmailModal(lead)}
                          className="contact-btn contact-btn--email"
                          title="Kirim Balasan Email Resmi"
                        >
                          <HugeiconsIcon icon={Mail01Icon} size={14} />
                          <span>{lead.email}</span>
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="status-cell">
                        <div className={`status-badge-wrap ${statusMeta.badgeClass}`}>
                          <statusMeta.Icon size={13} />
                        </div>
                        <select
                          className={`status-select ${statusMeta.badgeClass}`}
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          disabled={isPending}
                        >
                          <option value="BARU">Baru (Perlu Respon)</option>
                          <option value="DIHUBUNGI">Sudah Dihubungi</option>
                          <option value="INVOICE_DIKIRIM">Invoice Terkirim</option>
                          <option value="BUKTI_DITERIMA">Bukti Diterima</option>
                          <option value="LUNAS">Pembayaran Lunas</option>
                          <option value="PROVISIONING">Sedang Dibuat</option>
                          <option value="PROVISIONED">Instance Siap</option>
                          <option value="ONBOARDING_SELESAI">Onboarding Selesai</option>
                          <option value="WEBSITE_AKTIF">Website Aktif</option>
                          <option value="BATAL">Dibatalkan</option>
                        </select>
                      </div>
                    </td>

                    <td>
                      <div className="notes-cell">
                        <span className="notes-text">
                          {lead.internalNotes || (
                            <span className="text-muted">Belum ada catatan</span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="btn-edit-note"
                          onClick={() => handleOpenNotesModal(lead)}
                          title="Edit Catatan"
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={13} />
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="action-cell">
                        <button
                          type="button"
                          onClick={() => handleSendOnboardingInvite(lead.id, lead.businessName)}
                          className="btn-auth-action"
                          title="Kirim Kredensial Otentikasi Client Admin Resmi via Brevo"
                          disabled={isPending}
                        >
                          <HugeiconsIcon icon={ShieldKeyIcon} size={13} />
                          <span>Kirim Kredensial</span>
                        </button>

                        <Link
                          href={`/settings/provision?name=${encodeURIComponent(
                            lead.businessName
                          )}&email=${encodeURIComponent(lead.email)}`}
                          className="btn-provision-action"
                          title="Generate Repositori Klien"
                        >
                          <span>Provision</span>
                          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Balas Email via Brevo ─────────────────────────────── */}
      {emailModalOpen && activeEmailLead && (
        <div className="leads-modal-overlay" onClick={() => setEmailModalOpen(false)}>
          <div className="leads-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setEmailModalOpen(false)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="modal-header">
              <h3>Balas Email Klien</h3>
              <p>
                Kirim tanggapan langsung ke <strong>{activeEmailLead.email}</strong> via Brevo.
              </p>
            </div>

            {emailStatus === "success" ? (
              <div className="modal-result modal-result--success">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={36} />
                <h4>Email Berhasil Dikirim!</h4>
                <p>{emailFeedback}</p>
                <button
                  type="button"
                  className="btn-modal-done"
                  onClick={() => setEmailModalOpen(false)}
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendEmailReply} className="modal-form">
                {emailStatus === "error" && (
                  <div className="modal-error">
                    <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                    <span>{emailFeedback}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Subjek Email</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Isi Pesan Respons / Invoice</label>
                  <textarea
                    rows={8}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setEmailModalOpen(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-send"
                    disabled={emailStatus === "sending"}
                  >
                    {emailStatus === "sending" ? (
                      <>
                        <HugeiconsIcon icon={Loading03Icon} size={14} className="spin-icon" />
                        <span>Mengirim via Brevo...</span>
                      </>
                    ) : (
                      <span>Kirim Sekarang</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Edit Catatan Internal ─────────────────────────────── */}
      {notesModalOpen && activeNotesLead && (
        <div className="leads-modal-overlay" onClick={() => setNotesModalOpen(false)}>
          <div className="leads-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setNotesModalOpen(false)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="modal-header">
              <h3>Catatan Internal</h3>
              <p>
                Klien: <strong>{activeNotesLead.businessName}</strong> ({activeNotesLead.contactName})
              </p>
            </div>

            <form onSubmit={handleSaveNotes} className="modal-form">
              <div className="form-group">
                <label>Catatan Follow Up / Status Pembayaran</label>
                <textarea
                  rows={4}
                  placeholder="Contoh: Pembayaran DP 50% diterima via BCA tgl 12 Okt. Siap deploy repo."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setNotesModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-modal-send">
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
