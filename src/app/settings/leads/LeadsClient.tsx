"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  UserGroupIcon,
  Search01Icon,
  WhatsappIcon,
  Mail01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  AlertCircleIcon,
  RocketIcon,
  Cancel01Icon,
  Loading03Icon,
  PencilEdit02Icon,
  ShieldKeyIcon,
  SparklesIcon,
  Call02Icon,
  Invoice01Icon,
  Upload01Icon,
  Settings02Icon,
  Globe02Icon,
  User02Icon,
  Calendar03Icon,
  ArrowRight01Icon,
  Attachment01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  updateLeadStatusAction,
  sendEmailReplyAction,
  sendOnboardingInviteAction,
  resendSubscriptionResumeAction,
  curateInvoiceAction,
  curatePaymentVerificationAction,
  curateProvisionInstanceAction,
  curateHandoverAndGoLiveAction,
} from "./actions";
import type { ClientLead, LeadStatus } from "@/lib/leads-store";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui";

interface LeadsClientProps {
  initialLeads: ClientLead[];
}

const STATUS_LABELS: Record<LeadStatus, { label: string; badgeClass: string; icon: any }> = {
  BARU: { label: "Baru (Perlu Respon)", badgeClass: "status-baru", icon: SparklesIcon },
  DIHUBUNGI: { label: "Sudah Dihubungi", badgeClass: "status-dihubungi", icon: Call02Icon },
  INVOICE_DIKIRIM: { label: "Invoice Terkirim", badgeClass: "status-invoice", icon: Invoice01Icon },
  BUKTI_DITERIMA: { label: "Bukti Diterima", badgeClass: "status-bukti", icon: Upload01Icon },
  LUNAS: { label: "Pembayaran Lunas", badgeClass: "status-lunas", icon: CheckmarkCircle02Icon },
  PROVISIONING: { label: "Sedang Dibuat", badgeClass: "status-provisioning", icon: Settings02Icon },
  PROVISIONED: { label: "Instance Siap", badgeClass: "status-provisioned", icon: RocketIcon },
  ONBOARDING_SELESAI: { label: "Onboarding Selesai", badgeClass: "status-onboarding", icon: SparklesIcon },
  WEBSITE_AKTIF: { label: "Website Aktif", badgeClass: "status-aktif", icon: Globe02Icon },
  BATAL: { label: "Dibatalkan", badgeClass: "status-batal", icon: Cancel01Icon },
};

// ── Pipeline Stages (linear, prerequisite-enforced) ───────────────────────
const PIPELINE_STAGES: Array<{
  status: LeadStatus;
  label: string;
  nextLabel: string;
  icon: any;
}> = [
    { status: "BARU", label: "New", nextLabel: "", icon: SparklesIcon },
    { status: "INVOICE_DIKIRIM", label: "Invoiced", nextLabel: "Send Invoice", icon: Invoice01Icon },
    { status: "LUNAS", label: "Paid", nextLabel: "Mark as Paid", icon: CheckmarkCircle02Icon },
    { status: "PROVISIONED", label: "Instance Ready", nextLabel: "Provision", icon: RocketIcon },
    { status: "WEBSITE_AKTIF", label: "Live", nextLabel: "Go Live", icon: Globe02Icon },
  ];

function getPipelineIdx(status: LeadStatus): number {
  const idx = PIPELINE_STAGES.findIndex((s) => s.status === status);
  if (idx >= 0) return idx;
  const map: Partial<Record<LeadStatus, number>> = {
    DIHUBUNGI: 0, BUKTI_DITERIMA: 1, PROVISIONING: 3, ONBOARDING_SELESAI: 4,
  };
  return map[status] ?? 0;
}

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

  // ── Prerequisite Curation Modals State ─────────────────────────────────────
  // 1. Kurasi Penerbitan Tagihan (Invoice)
  const [curateInvoiceLead, setCurateInvoiceLead] = useState<ClientLead | null>(null);
  const [invoiceBank, setInvoiceBank] = useState("BCA");
  const [invoiceCustomNotes, setInvoiceCustomNotes] = useState("");

  // 2. Kurasi & Verifikasi Pembayaran (Paid)
  const [curatePaymentLead, setCuratePaymentLead] = useState<ClientLead | null>(null);
  const [paymentBankName, setPaymentBankName] = useState("BCA (PT Baitybites Solusi Digital)");
  const [paymentSenderName, setPaymentSenderName] = useState("");
  const [paymentRefCode, setPaymentRefCode] = useState("");
  const [paymentVerifiedCheck, setPaymentVerifiedCheck] = useState(false);

  // 3. Kurasi Persiapan Instance (Technical Setup)
  const [curateProvisionLead, setCurateProvisionLead] = useState<ClientLead | null>(null);
  const [provisionSubdomain, setProvisionSubdomain] = useState("");
  const [provisionRepoUrl, setProvisionRepoUrl] = useState("");
  const [provisionDbSchema, setProvisionDbSchema] = useState("");
  const [provisionContractMonths, setProvisionContractMonths] = useState(1);

  // 4. Kurasi Serah Terima & Go Live (Handover)
  const [curateHandoverLead, setCurateHandoverLead] = useState<ClientLead | null>(null);
  const [handoverConfirmedCheck, setHandoverConfirmedCheck] = useState(false);

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
  const totalCount = leads.filter((l) => l.status !== "BATAL").length;
  const newCount = leads.filter((l) => l.status === "BARU" || l.status === "DIHUBUNGI").length;
  const inProgressCount = leads.filter(
    (l) =>
      l.status === "INVOICE_DIKIRIM" ||
      l.status === "BUKTI_DITERIMA" ||
      l.status === "LUNAS" ||
      l.status === "PROVISIONING" ||
      l.status === "PROVISIONED"
  ).length;
  const activeCount = leads.filter(
    (l) => l.status === "WEBSITE_AKTIF" || l.status === "ONBOARDING_SELESAI"
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
        setStatusFeedback(`Kredensial Client Admin berhasil dikirim via email ke: ${res.emailRecipient}`);
      } else {
        setStatusFeedback(`Gagal mengirim kredensial: ${res.message}`);
      }
      setTimeout(() => setStatusFeedback(null), 10000);
    });
  };

  const handleResendResume = (id: string, name: string) => {
    startTransition(async () => {
      setStatusFeedback(`Mengirimkan ulang email resume formulir langganan ke ${name}...`);
      const res = await resendSubscriptionResumeAction(id);
      if (res.success) {
        setStatusFeedback(`Email resume formulir langganan berhasil dikirim ulang ke: ${res.emailRecipient}`);
      } else {
        setStatusFeedback(`Gagal mengirim email resume: ${res.message}`);
      }
      setTimeout(() => setStatusFeedback(null), 10000);
    });
  };

  // Send credentials via email then mark status as WEBSITE_AKTIF
  const handleSendCredentialsAndGoLive = (id: string, name: string) => {
    startTransition(async () => {
      setStatusFeedback(`Mengirimkan kredensial admin client ke ${name}...`);
      const credRes = await sendOnboardingInviteAction(id);
      if (!credRes.success) {
        setStatusFeedback(`Gagal mengirim kredensial: ${credRes.message}`);
        setTimeout(() => setStatusFeedback(null), 8000);
        return;
      }
      const liveRes = await updateLeadStatusAction(id, "WEBSITE_AKTIF");
      if (liveRes.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: "WEBSITE_AKTIF" } : l))
        );
        setStatusFeedback(
          `Kredensial terkirim ke ${credRes.emailRecipient} — "${name}" kini berstatus Live!`
        );
      } else {
        setStatusFeedback(`Gagal mengaktifkan status Live: ${liveRes.error}`);
      }
      setTimeout(() => setStatusFeedback(null), 10000);
    });
  };

  // ── Handlers Kurasi Prasyarat ──────────────────────────────────────────────
  const handleOpenCurateInvoice = (lead: ClientLead) => {
    setCurateInvoiceLead(lead);
    setInvoiceBank("BCA");
    setInvoiceCustomNotes("");
  };

  const handleOpenCuratePayment = (lead: ClientLead) => {
    setCuratePaymentLead(lead);
    setPaymentBankName(lead.paymentBankName || "BCA");
    setPaymentSenderName(lead.paymentSenderName || lead.contactName);
    setPaymentRefCode("");
    setPaymentVerifiedCheck(false);
  };

  const handleOpenCurateProvision = (lead: ClientLead) => {
    setCurateProvisionLead(lead);
    const slug = (lead.brandSlug || lead.businessName).toLowerCase().replace(/[^a-z0-9]/g, "");
    setProvisionSubdomain(`${slug}.baitybites.id`);
    setProvisionRepoUrl(lead.repoUrl || `https://github.com/id-baitybites/${slug}`);
    setProvisionDbSchema(lead.dbSchemaName || `tenant_${slug}`);
    setProvisionContractMonths(1);
  };

  const handleOpenCurateHandover = (lead: ClientLead) => {
    setCurateHandoverLead(lead);
    setHandoverConfirmedCheck(false);
  };

  // Helper to advance to the next prerequisite status with rigorous curation check
  const handleAdvanceNextStatus = (lead: ClientLead) => {
    if (lead.status === "BARU" || lead.status === "DIHUBUNGI") {
      handleOpenCurateInvoice(lead);
    } else if (lead.status === "INVOICE_DIKIRIM" || lead.status === "BUKTI_DITERIMA") {
      handleOpenCuratePayment(lead);
    } else if (lead.status === "LUNAS") {
      handleOpenCurateProvision(lead);
    } else if (lead.status === "PROVISIONING" || lead.status === "PROVISIONED") {
      handleOpenCurateHandover(lead);
    }
  };

  // 1. Submit Kurasi Penerbitan Tagihan (Invoice)
  const handleSubmitCurateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curateInvoiceLead) return;

    startTransition(async () => {
      setStatusFeedback(`Memproses kurasi invoice untuk ${curateInvoiceLead.businessName}...`);
      const invoiceNo = `INV-BB-${curateInvoiceLead.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
      let amount = 1490000;
      if (curateInvoiceLead.selectedPlan.toUpperCase().includes("STARTER")) amount = 750000;
      else if (curateInvoiceLead.selectedPlan.toUpperCase().includes("ENTERPRISE")) amount = 3900000;

      const res = await curateInvoiceAction({
        leadId: curateInvoiceLead.id,
        invoiceNumber: invoiceNo,
        invoiceAmount: amount,
        paymentBank: invoiceBank,
        customNotes: invoiceCustomNotes,
      });

      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === curateInvoiceLead.id ? res.lead! : l)));
        setStatusFeedback(res.message);
        setCurateInvoiceLead(null);
      } else {
        setStatusFeedback(`Kurasi Ditolak: ${res.message}`);
      }
      setTimeout(() => setStatusFeedback(null), 10000);
    });
  };

  // 2. Submit Kurasi Verifikasi Pembayaran (Paid)
  const handleSubmitCuratePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curatePaymentLead) return;
    if (!paymentVerifiedCheck && !curatePaymentLead.paymentProofUrl) {
      alert("Harap centang konfirmasi verifikasi mutasi bank terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      setStatusFeedback(`Memverifikasi pembayaran untuk ${curatePaymentLead.businessName}...`);
      const res = await curatePaymentVerificationAction({
        leadId: curatePaymentLead.id,
        bankName: paymentBankName,
        senderName: paymentSenderName,
        referenceCode: paymentRefCode,
      });

      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === curatePaymentLead.id ? res.lead! : l)));
        setStatusFeedback(res.message);
        setCuratePaymentLead(null);
      } else {
        setStatusFeedback(`Verifikasi Ditolak: ${res.message}`);
      }
      setTimeout(() => setStatusFeedback(null), 10000);
    });
  };

  // 3. Submit Kurasi Persiapan Instance (Technical Setup)
  const handleSubmitCurateProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curateProvisionLead) return;

    startTransition(async () => {
      setStatusFeedback(`Menyimpan kurasi teknis & menyiapkan instance ${curateProvisionLead.businessName}...`);
      const res = await curateProvisionInstanceAction({
        leadId: curateProvisionLead.id,
        subdomain: provisionSubdomain,
        repoUrl: provisionRepoUrl,
        dbSchemaName: provisionDbSchema,
        contractMonths: provisionContractMonths,
      });

      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === curateProvisionLead.id ? res.lead! : l)));
        setStatusFeedback(res.message);
        setCurateProvisionLead(null);
      } else {
        setStatusFeedback(`Kurasi Ditolak: ${res.message}`);
      }
      setTimeout(() => setStatusFeedback(null), 10000);
    });
  };

  // 4. Submit Kurasi Serah Terima & Go Live (Handover)
  const handleSubmitCurateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curateHandoverLead) return;
    if (!handoverConfirmedCheck) {
      alert("Harap centang konfirmasi serah terima terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      setStatusFeedback(`Mengirim kredensial resmi & mengaktifkan status LIVE untuk ${curateHandoverLead.businessName}...`);
      const res = await curateHandoverAndGoLiveAction(curateHandoverLead.id);

      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === curateHandoverLead.id ? res.lead! : l)));
        setStatusFeedback(res.message);
        setCurateHandoverLead(null);
      } else {
        setStatusFeedback(`Aktivasi Ditolak: ${res.message}`);
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
        `*No. Invoice:* ${invoiceNo}\n` +
        `*Paket:* ${lead.selectedPlan}\n` +
        `*Total Biaya:* ${planPrice}\n\n` +
        `*Rekening Pembayaran Resmi Vendor:*\n` +
        `*BCA:* 880-1234-567 a/n PT Baitybites Solusi Digital\n` +
        `*Mandiri:* 137-00-9876543-2 a/n PT Baitybites Solusi Digital\n\n` +
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
        <div className="metric-card metric-card--total">
          <span className="metric-title">Total Aktif</span>
          <span className="metric-val">{totalCount}</span>
          <span className="metric-sub">Seluruh prospek masuk</span>
        </div>
        <div className="metric-card metric-card--highlight metric-card--new">
          <span className="metric-title">Perlu Respon</span>
          <span className="metric-val">{newCount}</span>
          <span className="metric-sub">Status New — butuh tindakan</span>
        </div>
        <div className="metric-card metric-card--progress">
          <span className="metric-title">Dalam Proses</span>
          <span className="metric-val">{inProgressCount}</span>
          <span className="metric-sub">Invoice ke Instance Ready</span>
        </div>
        <div className="metric-card metric-card--live">
          <span className="metric-title">Live / Aktif</span>
          <span className="metric-val">{activeCount}</span>
          <span className="metric-sub">Website berjalan</span>
        </div>
      </div>

      {/* ── Status Change Feedback Banner ────────────────────────── */}
      {statusFeedback && (
        <div className="leads-feedback-banner">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="banner-icon" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* ── Filters & Search ──────────────────────────────────────── */}
      <div className="leads-controls">
        <div className="filter-tabs">
          <button type="button" className={`tab-btn ${activeFilter === "ALL" ? "is-active" : ""}`} onClick={() => setActiveFilter("ALL")}>
            Semua ({totalCount})
          </button>
          <button type="button" className={`tab-btn ${activeFilter === "BARU" ? "is-active" : ""}`} onClick={() => setActiveFilter("BARU")}>
            <HugeiconsIcon icon={SparklesIcon} size={13} /> New ({newCount})
          </button>
          <button type="button" className={`tab-btn ${activeFilter === "INVOICE_DIKIRIM" ? "is-active" : ""}`} onClick={() => setActiveFilter("INVOICE_DIKIRIM")}>
            <HugeiconsIcon icon={Invoice01Icon} size={13} /> Invoiced
          </button>
          <button type="button" className={`tab-btn ${activeFilter === "LUNAS" ? "is-active" : ""}`} onClick={() => setActiveFilter("LUNAS")}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} /> Paid
          </button>
          <button type="button" className={`tab-btn ${activeFilter === "PROVISIONED" ? "is-active" : ""}`} onClick={() => setActiveFilter("PROVISIONED")}>
            <HugeiconsIcon icon={RocketIcon} size={13} /> Instance Ready
          </button>
          <button type="button" className={`tab-btn ${activeFilter === "WEBSITE_AKTIF" ? "is-active" : ""}`} onClick={() => setActiveFilter("WEBSITE_AKTIF")}>
            <HugeiconsIcon icon={Globe02Icon} size={13} /> Live ({activeCount})
          </button>
          <button type="button" className={`tab-btn ${activeFilter === "BATAL" ? "is-active" : ""}`} onClick={() => setActiveFilter("BATAL")}>
            <HugeiconsIcon icon={Cancel01Icon} size={13} /> Cancelled
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

      {/* ── Leads Cards Grid (Card-Based View) ───────────────────────── */}
      {filteredLeads.length === 0 ? (
        <div className="empty-state">
          <HugeiconsIcon icon={Clock01Icon} size={36} />
          <p>Tidak ada permintaan klien yang sesuai dengan filter.</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={150}>
          <div className="leads-cards-grid">
            {filteredLeads.map((lead) => {
              const formattedDate = new Date(lead.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              const statusLabel =
                lead.status === "BARU"
                  ? "New"
                  : lead.status === "DIHUBUNGI"
                  ? "Dihubungi"
                  : lead.status === "INVOICE_DIKIRIM"
                  ? "Invoiced"
                  : lead.status === "BUKTI_DITERIMA"
                  ? "Bukti Diterima"
                  : lead.status === "LUNAS"
                  ? "Paid"
                  : lead.status === "PROVISIONED" || lead.status === "PROVISIONING"
                  ? "Instance Ready"
                  : lead.status === "WEBSITE_AKTIF" || lead.status === "ONBOARDING_SELESAI"
                  ? "Live"
                  : "Cancelled";

              const isTerminal =
                lead.status === "WEBSITE_AKTIF" ||
                lead.status === "ONBOARDING_SELESAI" ||
                lead.status === "BATAL";

              const nextActionTooltip =
                lead.status === "BARU" || lead.status === "DIHUBUNGI"
                  ? "Klik status button untuk kirim tagihan (Invoiced)"
                  : lead.status === "INVOICE_DIKIRIM" || lead.status === "BUKTI_DITERIMA"
                  ? "Klik status button untuk konfirmasi lunas (Paid)"
                  : lead.status === "LUNAS"
                  ? "Klik status button untuk tandai instance ready (Instance Ready)"
                  : lead.status === "PROVISIONING" || lead.status === "PROVISIONED"
                  ? "Klik status button untuk kirim data konfigurasi & Go Live"
                  : lead.status === "WEBSITE_AKTIF"
                  ? "Website sudah Live & Aktif"
                  : "Permintaan Dibatalkan";

              return (
                <div key={lead.id} className={`lead-card lead-card--${lead.status.toLowerCase()}`}>
                  {/* 1. Header: Brand Shop Name & Status Button */}
                  <div className="lead-card__header">
                    <h3 className="lead-card__title" title={lead.businessName}>
                      {lead.businessName}
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`lead-card__status lead-card__status-btn lead-card__status--${lead.status.toLowerCase()}`}
                          onClick={() => handleAdvanceNextStatus(lead)}
                          disabled={isPending || isTerminal}
                          aria-label={`${statusLabel} - ${nextActionTooltip}`}
                        >
                          <span>{statusLabel}</span>
                          {!isTerminal && (
                            <HugeiconsIcon icon={ArrowRight01Icon} size={13} className="lead-card__status-arrow" aria-hidden="true" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <span>{nextActionTooltip}</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* 2. Metadata: PIC & Date (matching user's mockup) */}
                  <div className="lead-card__meta">
                    <div className="lead-card__meta-item">
                      <HugeiconsIcon icon={User02Icon} size={18} strokeWidth={2} />
                      <span className="lead-card__meta-text">{lead.contactName || "Owner"}</span>
                    </div>
                    <div className="lead-card__meta-item">
                      <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={2} />
                      <span className="lead-card__meta-text">{formattedDate}</span>
                    </div>
                  </div>

                  {/* 3. Message preview or client note if exists */}
                  {lead.message && (
                    <div className="lead-card__message" title={lead.message}>
                      &ldquo;{lead.message}&rdquo;
                    </div>
                  )}

                  {/* 4. Plan Highlight (Centered, as shown in mockup) */}
                  <div className="lead-card__plan">
                    <span className="lead-card__plan-title">{lead.selectedPlan}</span>
                  </div>

                  {/* 5. Internal note row with pencil edit */}
                  <div className="lead-card__note-row">
                    <div className="lead-card__note-content" title={lead.internalNotes || "Belum ada catatan internal"}>
                      <span className="lead-card__note-text">
                        {lead.internalNotes || <span className="text-muted">Belum ada catatan internal</span>}
                      </span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="lead-card__btn-note"
                          onClick={() => handleOpenNotesModal(lead)}
                          aria-label="Edit Catatan"
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={13} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <span>Edit Catatan Internal</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                {/* 6. Prerequisite Action CTA Button (bottom) */}
                {/* 6. Prerequisite Action CTA Button (bottom) with Curation Check */}
                <div className="lead-card__action-box">
                  {/* Prerequisite Curation Status Banner */}
                  {(lead.status === "BARU" || lead.status === "DIHUBUNGI") && (
                    <div className="lead-card__prereq-badge lead-card__prereq-badge--new">
                      <span>Tahap 1: Belum Diterbitkan Invoice</span>
                    </div>
                  )}

                  {lead.status === "INVOICE_DIKIRIM" && (
                    <div className="lead-card__prereq-badge lead-card__prereq-badge--wait">
                      {lead.paymentProofUrl ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <HugeiconsIcon icon={Attachment01Icon} size={14} /> Bukti Transfer Terlampir — Siap Dikurasi
                        </span>
                      ) : (
                        <span>Tahap 2: Menunggu Verifikasi Pembayaran</span>
                      )}
                    </div>
                  )}

                  {lead.status === "BUKTI_DITERIMA" && (
                    <div className="lead-card__prereq-badge lead-card__prereq-badge--proof">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <HugeiconsIcon icon={Attachment01Icon} size={14} /> Bukti Transfer Diunggah Klien — Butuh Verifikasi
                      </span>
                    </div>
                  )}

                  {lead.status === "LUNAS" && (
                    <div className="lead-card__prereq-badge lead-card__prereq-badge--lunas">
                      <span>Tahap 3: Lunas — Menunggu Kurasi Instance</span>
                    </div>
                  )}

                  {(lead.status === "PROVISIONING" || lead.status === "PROVISIONED") && (
                    <div className="lead-card__prereq-badge lead-card__prereq-badge--ready">
                      <span>Tahap 4: Instance Siap ({lead.customDomain || "Configured"}) — Siap Handover</span>
                    </div>
                  )}

                  {/* Contextual Action CTA Button */}
                  {(lead.status === "BARU" || lead.status === "DIHUBUNGI") && (
                    <button
                      type="button"
                      className="lead-card__btn-cta lead-card__btn-cta--primary"
                      disabled={isPending}
                      onClick={() => handleOpenCurateInvoice(lead)}
                      title="Periksa data & terbitkan invoice resmi ke klien"
                    >
                      {isPending ? (
                        <HugeiconsIcon icon={Loading03Icon} size={15} className="spin-icon" />
                      ) : (
                        <HugeiconsIcon icon={Invoice01Icon} size={15} />
                      )}
                      <span>Kurasi &amp; Terbitkan Invoice</span>
                    </button>
                  )}

                  {(lead.status === "INVOICE_DIKIRIM" || lead.status === "BUKTI_DITERIMA") && (
                    <button
                      type="button"
                      className="lead-card__btn-cta lead-card__btn-cta--success"
                      disabled={isPending}
                      onClick={() => handleOpenCuratePayment(lead)}
                      title="Verifikasi pembayaran & mutasi bank secara sah"
                    >
                      {isPending ? (
                        <HugeiconsIcon icon={Loading03Icon} size={15} className="spin-icon" />
                      ) : (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                      )}
                      <span>
                        {lead.status === "BUKTI_DITERIMA" || lead.paymentProofUrl
                          ? "Periksa Bukti & Verifikasi Lunas"
                          : "Kurasi Mutasi & Verifikasi Paid"}
                      </span>
                    </button>
                  )}

                  {lead.status === "LUNAS" && (
                    <div className="lead-card__cta-group">
                      <button
                        type="button"
                        className="lead-card__btn-cta lead-card__btn-cta--provision"
                        disabled={isPending}
                        onClick={() => handleOpenCurateProvision(lead)}
                        title="Buka form kurasi teknis & siapkan instance"
                      >
                        <HugeiconsIcon icon={RocketIcon} size={15} />
                        <span>Kurasi &amp; Siapkan Instance</span>
                      </button>
                      <Link
                        href={`/settings/provision?name=${encodeURIComponent(lead.businessName)}&email=${encodeURIComponent(lead.email)}`}
                        className="lead-card__link-sub"
                        title="Buka panduan provision instance langkah demi langkah"
                      >
                        <span>Wizard Deployment Manual</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                      </Link>
                    </div>
                  )}

                  {(lead.status === "PROVISIONING" || lead.status === "PROVISIONED") && (
                    <button
                      type="button"
                      className="lead-card__btn-cta lead-card__btn-cta--golive"
                      disabled={isPending}
                      onClick={() => handleOpenCurateHandover(lead)}
                      title="Periksa data kredensial & serahkan ke klien via email"
                    >
                      {isPending ? (
                        <HugeiconsIcon icon={Loading03Icon} size={15} className="spin-icon" />
                      ) : (
                        <HugeiconsIcon icon={Globe02Icon} size={15} />
                      )}
                      <span>Kurasi Serah Terima &amp; Go Live</span>
                    </button>
                  )}

                  {lead.status === "WEBSITE_AKTIF" && (
                    <div className="lead-card__live-indicator">
                      <HugeiconsIcon icon={Globe02Icon} size={15} />
                      <span>Website Live &amp; Handover Selesai</span>
                    </div>
                  )}

                  {lead.status === "BATAL" && (
                    <div className="lead-card__cancelled-indicator">
                      <HugeiconsIcon icon={Cancel01Icon} size={15} />
                      <span>Permintaan Dibatalkan</span>
                    </div>
                  )}
                </div>

                {/* 7. Footer Quick Actions (WhatsApp, Email, Cancel) */}
                <div className="lead-card__footer">
                  <div className="lead-card__contacts">
                    <a
                      href={getWaLink(lead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lead-card__contact-link lead-card__contact-link--wa"
                      title={`Chat WhatsApp: ${lead.phone}`}
                    >
                      <HugeiconsIcon icon={WhatsappIcon} size={14} />
                      <span>{lead.phone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenEmailModal(lead)}
                      className="lead-card__contact-link lead-card__contact-link--email"
                      title={`Kirim Email: ${lead.email}`}
                    >
                      <HugeiconsIcon icon={Mail01Icon} size={14} />
                      <span>Email</span>
                    </button>
                    {(lead.status === "BARU" || lead.status === "DIHUBUNGI") && (
                      <button
                        type="button"
                        onClick={() => handleResendResume(lead.id, lead.contactName)}
                        className="lead-card__contact-link lead-card__contact-link--resume"
                        title="Kirim Ulang Email Resume Pendaftaran"
                        disabled={isPending}
                      >
                        <span>Resume</span>
                      </button>
                    )}
                  </div>

                  {lead.status !== "BATAL" && lead.status !== "WEBSITE_AKTIF" && (
                    <button
                      type="button"
                      className="lead-card__btn-cancel"
                      onClick={() => handleStatusChange(lead.id, "BATAL")}
                      title="Batalkan permintaan ini"
                      disabled={isPending}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} />
                      <span>Batal</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </TooltipProvider>
      )}

      {/* ── Modal Balas Email Klien ─────────────────────────────── */}
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
                Kirim tanggapan langsung ke <strong>{activeEmailLead.email}</strong> via email transaksional.
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
                        <span>Mengirim email notifikasi...</span>
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
      {/* ── 1. Modal Kurasi Penerbitan Tagihan (Invoice) ──────────────── */}
      {curateInvoiceLead && (
        <div className="leads-modal-overlay" onClick={() => setCurateInvoiceLead(null)}>
          <div className="leads-modal leads-modal--curation" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setCurateInvoiceLead(null)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="modal-header">
              <div className="modal-header__badge modal-header__badge--invoice">
                <HugeiconsIcon icon={Invoice01Icon} size={15} />
                <span>Tahap 1: Kurasi Penerbitan Tagihan</span>
              </div>
              <h3>Penerbitan Invoice Resmi</h3>
              <p>
                Periksa kelayakan inkuiri sebelum menerbitkan invoice resmi ke calon klien via email.
              </p>
            </div>

            {/* Checklist Persyaratan */}
            <div className="modal-curation-checklist">
              <h4 className="checklist-title">Pemeriksaan Syarat Inkuiri:</h4>
              <ul className="checklist-items">
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Calon Klien: <strong>{curateInvoiceLead.businessName}</strong> ({curateInvoiceLead.contactName})</span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Email Penerima: <strong>{curateInvoiceLead.email}</strong></span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>WhatsApp: <strong>{curateInvoiceLead.phone}</strong></span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Paket Dipilih: <strong>{curateInvoiceLead.selectedPlan}</strong></span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmitCurateInvoice} className="modal-form">
              <div className="form-row form-row--2cols">
                <div className="form-group">
                  <label>Nomor Tagihan (Invoice)</label>
                  <input
                    type="text"
                    disabled
                    value={`INV-BB-${curateInvoiceLead.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`}
                  />
                </div>
                <div className="form-group">
                  <label>Nominal Tagihan</label>
                  <input
                    type="text"
                    disabled
                    value={
                      curateInvoiceLead.selectedPlan.toUpperCase().includes("STARTER")
                        ? "Rp 750.000 / bulan"
                        : curateInvoiceLead.selectedPlan.toUpperCase().includes("ENTERPRISE")
                        ? "Rp 3.900.000 / bulan"
                        : "Rp 1.490.000 / bulan"
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Rekening Tujuan Transfer Vendor</label>
                <Select value={invoiceBank} onValueChange={setInvoiceBank}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BCA">Bank BCA — 880-1234-567 (PT Baitybites Solusi Digital)</SelectItem>
                    <SelectItem value="Mandiri">Bank Mandiri — 137-00-9876543-2 (PT Baitybites Solusi Digital)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <label>Catatan Tambahan untuk Klien (Opsional)</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Invoice berlaku 3×24 jam. Biaya sudah termasuk setup database terisolasi & private repository."
                  value={invoiceCustomNotes}
                  onChange={(e) => setInvoiceCustomNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCurateInvoiceLead(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-send btn-modal-send--primary"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} size={15} className="spin-icon" />
                      <span>Menerbitkan invoice...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Invoice01Icon} size={15} />
                      <span>Terbitkan &amp; Kirim Invoice Resmi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. Modal Kurasi & Verifikasi Pembayaran (Paid) ────────────────── */}
      {curatePaymentLead && (
        <div className="leads-modal-overlay" onClick={() => setCuratePaymentLead(null)}>
          <div className="leads-modal leads-modal--curation" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setCuratePaymentLead(null)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="modal-header">
              <div className="modal-header__badge modal-header__badge--payment">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                <span>Tahap 2: Kurasi &amp; Verifikasi Pembayaran</span>
              </div>
              <h3>Pemeriksaan Kelayakan Pembayaran</h3>
              <p>
                Pastikan dana telah masuk ke rekening vendor sebelum mengizinkan status LUNAS.
              </p>
            </div>

            {/* Checklist Persyaratan Tagihan */}
            <div className="modal-curation-checklist">
              <h4 className="checklist-title">Status Tagihan Klien:</h4>
              <ul className="checklist-items">
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Klien: <strong>{curatePaymentLead.businessName}</strong></span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Paket: <strong>{curatePaymentLead.selectedPlan}</strong></span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Nomor Invoice: <strong>{curatePaymentLead.invoiceNumber || `INV-BB-${curatePaymentLead.id.toUpperCase().slice(0, 8)}`}</strong></span>
                </li>
              </ul>
            </div>

            {/* Bukti Transfer Klien jika ada */}
            {curatePaymentLead.paymentProofUrl ? (
              <div className="modal-proof-box">
                <div className="modal-proof-box__badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <HugeiconsIcon icon={Attachment01Icon} size={14} />
                  <span>Bukti Transfer Terlampir</span>
                </div>
                <div className="modal-proof-box__content">
                  <p>
                    <strong>Pengirim:</strong> {curatePaymentLead.paymentSenderName || "—"} ({curatePaymentLead.paymentBankName || "Bank"})
                  </p>
                  <p>
                    <strong>Waktu Unggah:</strong> {curatePaymentLead.paymentSubmittedAt ? new Date(curatePaymentLead.paymentSubmittedAt).toLocaleString("id-ID") : "—"}
                  </p>
                  <a
                    href={curatePaymentLead.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-proof-box__link"
                  >
                    Buka Gambar Bukti Transfer Lengkap &rarr;
                  </a>
                </div>
              </div>
            ) : (
              <div className="modal-warning-box">
                <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                <div>
                  <strong>Klien Belum Mengunggah Bukti via Portal Mandiri</strong>
                  <p>
                    Lakukan verifikasi manual terhadap mutasi bank BCA/Mandiri sebelum menyetujui pelunasan ini.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitCuratePayment} className="modal-form">
              <div className="form-row form-row--2cols">
                <div className="form-group">
                  <label>Bank Penerima (Tujuan Transfer)</label>
                  <Select value={paymentBankName} onValueChange={setPaymentBankName}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BCA (PT Baitybites Solusi Digital)">BCA — 880-1234-567</SelectItem>
                      <SelectItem value="Mandiri (PT Baitybites Solusi Digital)">Mandiri — 137-00-9876543-2</SelectItem>
                      <SelectItem value="QRIS / Payment Gateway">QRIS / Online Merchant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-group">
                  <label>Nama Pemilik Rekening Pengirim (Klien)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama / Lestari"
                    value={paymentSenderName}
                    onChange={(e) => setPaymentSenderName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nomor Referensi Mutasi / Bukti Transfer (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-20261021-0012"
                  value={paymentRefCode}
                  onChange={(e) => setPaymentRefCode(e.target.value)}
                />
              </div>

              <div className="form-confirm-checkbox">
                <Checkbox
                  id="payment-verified-check"
                  checked={paymentVerifiedCheck}
                  onCheckedChange={(checked) => setPaymentVerifiedCheck(checked === true)}
                />
                <label htmlFor="payment-verified-check">
                  Saya menyatakan telah memeriksa mutasi rekening dan dana pembayaran telah <strong>efektif masuk</strong> ke rekening PT Baitybites Solusi Digital.
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCuratePaymentLead(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-send btn-modal-send--success"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} size={15} className="spin-icon" />
                      <span>Memverifikasi lunas...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                      <span>Verifikasi &amp; Setujui Pembayaran (Lunas)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Modal Kurasi Persiapan Instance (Technical Setup) ─────────── */}
      {curateProvisionLead && (
        <div className="leads-modal-overlay" onClick={() => setCurateProvisionLead(null)}>
          <div className="leads-modal leads-modal--curation" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setCurateProvisionLead(null)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="modal-header">
              <div className="modal-header__badge modal-header__badge--provision">
                <HugeiconsIcon icon={RocketIcon} size={15} />
                <span>Tahap 3: Kurasi Persiapan Instance</span>
              </div>
              <h3>Konfigurasi Teknis Instance Klien</h3>
              <p>
                Dilarang menandai instance siap tanpa mengisi parameter subdomain dan repositori toko klien.
              </p>
            </div>

            {/* Checklist Persyaratan Pembayaran */}
            <div className="modal-curation-checklist">
              <h4 className="checklist-title">Pemeriksaan Prasyarat:</h4>
              <ul className="checklist-items">
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Status Pembayaran: <strong>LUNAS (Terverifikasi)</strong></span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Klien: <strong>{curateProvisionLead.businessName}</strong> ({curateProvisionLead.contactName})</span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Paket: <strong>{curateProvisionLead.selectedPlan}</strong></span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmitCurateProvision} className="modal-form">
              <div className="form-group">
                <label>Domain / Subdomain Instance Toko</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: tokokue.baitybites.id"
                  value={provisionSubdomain}
                  onChange={(e) => setProvisionSubdomain(e.target.value)}
                />
                <span className="field-hint">Format subdomain publik untuk web e-commerce klien.</span>
              </div>

              <div className="form-row form-row--2cols">
                <div className="form-group">
                  <label>Repository Instance (Private Git)</label>
                  <input
                    type="text"
                    placeholder="https://github.com/id-baitybites/client-instance"
                    value={provisionRepoUrl}
                    onChange={(e) => setProvisionRepoUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Skema Database Multi-Tenant</label>
                  <input
                    type="text"
                    placeholder="tenant_tokokue"
                    value={provisionDbSchema}
                    onChange={(e) => setProvisionDbSchema(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Durasi Kontrak Langganan</label>
                <Select
                  value={String(provisionContractMonths)}
                  onValueChange={(v) => setProvisionContractMonths(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Bulan (Uji Coba / Standar)</SelectItem>
                    <SelectItem value="3">3 Bulan (Paket Kuartal)</SelectItem>
                    <SelectItem value="6">6 Bulan (Paket Semester)</SelectItem>
                    <SelectItem value="12">12 Bulan (Paket Tahunan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="modal-info-box">
                <HugeiconsIcon icon={Settings02Icon} size={16} />
                <div>
                  <strong>Butuh Wizard Setup Lengkap?</strong>
                  <p>
                    Anda juga dapat menggunakan{" "}
                    <Link
                      href={`/settings/provision?name=${encodeURIComponent(curateProvisionLead.businessName)}&email=${encodeURIComponent(curateProvisionLead.email)}`}
                      className="link-accent"
                    >
                      Wizard Provisioning Klien Terpadu &rarr;
                    </Link>
                  </p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCurateProvisionLead(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-send btn-modal-send--provision"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} size={15} className="spin-icon" />
                      <span>Menyimpan konfigurasi...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={RocketIcon} size={15} />
                      <span>Simpan Konfigurasi &amp; Setujui Instance Ready</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. Modal Kurasi Serah Terima & Go Live (Handover) ─────────────── */}
      {curateHandoverLead && (
        <div className="leads-modal-overlay" onClick={() => setCurateHandoverLead(null)}>
          <div className="leads-modal leads-modal--curation" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setCurateHandoverLead(null)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="modal-header">
              <div className="modal-header__badge modal-header__badge--golive">
                <HugeiconsIcon icon={Globe02Icon} size={15} />
                <span>Tahap 4: Kurasi Serah Terima &amp; Go Live</span>
              </div>
              <h3>Serah Terima Akses &amp; Aktivasi Live</h3>
              <p>
                Kirim data konfigurasi dan kredensial login admin ke email klien untuk memulai setup toko.
              </p>
            </div>

            {/* Checklist Persyaratan Instance */}
            <div className="modal-curation-checklist">
              <h4 className="checklist-title">Pemeriksaan Kesiapan Instance:</h4>
              <ul className="checklist-items">
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Klien: <strong>{curateHandoverLead.businessName}</strong></span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Instance Subdomain: <strong>{curateHandoverLead.customDomain || `${curateHandoverLead.businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.baitybites.id`}</strong></span>
                </li>
                <li className="checklist-item checklist-item--pass">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  <span>Email Penerima Kredensial: <strong>{curateHandoverLead.email}</strong></span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmitCurateHandover} className="modal-form">
              <div className="modal-handover-preview">
                <h4 className="preview-title">Rincian Akun yang Akan Dikirimkan ke Klien:</h4>
                <div className="preview-table">
                  <div className="preview-row">
                    <span className="preview-key">Username Client Admin:</span>
                    <span className="preview-val"><code>admin.{(curateHandoverLead.brandSlug || curateHandoverLead.businessName).toLowerCase().replace(/[^a-z0-9]/g, "")}</code></span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-key">Password Sementara:</span>
                    <span className="preview-val"><code>Baitybites2026!</code></span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-key">Security PIN Kasir:</span>
                    <span className="preview-val"><code>1234</code></span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-key">Portal Setup &amp; Onboarding:</span>
                    <span className="preview-val"><code>/admin?from=/onboarding</code></span>
                  </div>
                </div>
              </div>

              <div className="form-confirm-checkbox">
                <Checkbox
                  id="handover-confirmed-check"
                  checked={handoverConfirmedCheck}
                  onCheckedChange={(checked) => setHandoverConfirmedCheck(checked === true)}
                />
                <label htmlFor="handover-confirmed-check">
                  Saya menyatakan instance telah siap, data konfigurasi telah akurat, dan menyetujui pengiriman kredensial resmi ke klien via email transaksional untuk mengaktifkan status <strong>WEBSITE AKTIF (LIVE)</strong>.
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCurateHandoverLead(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-send btn-modal-send--golive"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} size={15} className="spin-icon" />
                      <span>Mengirim kredensial &amp; mengaktifkan...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Globe02Icon} size={15} />
                      <span>Kirim Data Konfigurasi &amp; Go Live</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
