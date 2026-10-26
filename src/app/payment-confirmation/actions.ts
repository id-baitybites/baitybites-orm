"use server";

import { getAllLeads, type LeadStatus } from "@/lib/leads-store";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { updateLeadStatusAction } from "@/app/settings/leads/actions";

export interface PublicPaymentConfirmationLead {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  selectedPlan: string;
  planPrice: string;
  planTag: string;
  invoiceNumber: string;
  invoiceAmount?: number | null;
  status: LeadStatus;
  paymentProofUrl?: string | null;
  paymentSenderName?: string | null;
  paymentBankName?: string | null;
  paymentSubmittedAt?: string | null;
  createdAt: string;
}

function resolvePlanDetails(selectedPlan: string) {
  const planUpper = (selectedPlan || "").toUpperCase();
  let planPrice = "Rp 1.490.000 / bulan";
  let planTag = "Business Pro";
  if (planUpper.includes("STARTER")) {
    planPrice = "Rp 750.000 / bulan";
    planTag = "Starter Instance";
  } else if (planUpper.includes("ENTERPRISE")) {
    planPrice = "Rp 3.900.000 / bulan";
    planTag = "Enterprise Dedicated";
  }
  return { planPrice, planTag };
}

export async function getLeadForPaymentConfirmation(
  leadId?: string,
  invoiceNo?: string
): Promise<{ success: boolean; lead?: PublicPaymentConfirmationLead; error?: string }> {
  try {
    const cleanLeadId = leadId?.trim();
    const cleanInvoice = invoiceNo?.trim();

    if (!cleanLeadId && !cleanInvoice) {
      return { success: false, error: "Parameter identifikasi invoice atau data registrasi tidak ditemukan." };
    }

    const leads = await getAllLeads();
    const found = leads.find((l) => {
      if (cleanLeadId && l.id.toLowerCase() === cleanLeadId.toLowerCase()) return true;
      if (cleanInvoice) {
        const computedInvoice = `INV-BB-${l.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
        if (l.invoiceNumber?.toLowerCase() === cleanInvoice.toLowerCase()) return true;
        if (computedInvoice.toLowerCase() === cleanInvoice.toLowerCase()) return true;
      }
      return false;
    });

    if (!found) {
      return { success: false, error: "Data tagihan atau invoice klien tidak ditemukan dalam database." };
    }

    const { planPrice, planTag } = resolvePlanDetails(found.selectedPlan);
    const invoiceNumber = found.invoiceNumber || `INV-BB-${found.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;

    return {
      success: true,
      lead: {
        id: found.id,
        businessName: found.businessName,
        contactName: found.contactName,
        email: found.email,
        phone: found.phone,
        selectedPlan: found.selectedPlan,
        planPrice,
        planTag,
        invoiceNumber,
        invoiceAmount: found.invoiceAmount,
        status: found.status,
        paymentProofUrl: found.paymentProofUrl,
        paymentSenderName: found.paymentSenderName,
        paymentBankName: found.paymentBankName,
        paymentSubmittedAt: found.paymentSubmittedAt,
        createdAt: found.createdAt,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data tagihan.";
    return { success: false, error: msg };
  }
}

export async function submitPaymentProofAction(payload: {
  leadId: string;
  bankSenderName: string;
  bankName: string;
  targetBank: string;
  referenceNumber?: string;
  imageBase64: string;
}): Promise<{ success: boolean; message: string; lead?: PublicPaymentConfirmationLead }> {
  try {
    const { leadId, bankSenderName, bankName, targetBank, referenceNumber, imageBase64 } = payload;

    if (!leadId) {
      return { success: false, message: "ID registrasi tidak valid." };
    }
    if (!bankSenderName.trim()) {
      return { success: false, message: "Nama pemilik rekening pengirim wajib diisi." };
    }
    if (!bankName.trim()) {
      return { success: false, message: "Bank asal pengirim wajib dipilih atau diisi." };
    }
    if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
      return { success: false, message: "File bukti transfer wajib dilampirkan dalam format gambar (JPG/PNG/WebP)." };
    }

    // 1. Upload ke Cloudinary
    const uploadRes = await uploadToCloudinary(imageBase64, "payment-proofs");
    if (!uploadRes.success || !uploadRes.url) {
      return {
        success: false,
        message: uploadRes.error || "Gagal mengunggah foto bukti transfer. Silakan periksa ukuran file dan coba lagi.",
      };
    }

    const proofUrl = uploadRes.url;
    const internalNotes = `Bukti transfer diunggah mandiri via portal konfirmasi. Pengirim: ${bankSenderName.trim()} (${bankName.trim()}) ke ${targetBank.trim()}. Ref: ${referenceNumber?.trim() || "-"}`;

    // 2. Update status lead ke BUKTI_DITERIMA via updateLeadStatusAction (otomatis trigger email penerimaan bukti)
    const updateRes = await updateLeadStatusAction(
      leadId,
      "BUKTI_DITERIMA",
      internalNotes,
      {
        paymentProofUrl: proofUrl,
        paymentSenderName: bankSenderName.trim(),
        paymentBankName: `${bankName.trim()} ke ${targetBank.trim()}`,
        paymentSubmittedAt: new Date(),
      }
    );

    if (!updateRes.success || !updateRes.lead) {
      return {
        success: false,
        message: updateRes.error || "Gagal memperbarui status konfirmasi pembayaran di database.",
      };
    }

    const { planPrice, planTag } = resolvePlanDetails(updateRes.lead.selectedPlan);
    const invoiceNumber = updateRes.lead.invoiceNumber || `INV-BB-${updateRes.lead.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;

    return {
      success: true,
      message: "Bukti transfer berhasil dikirim. Tim verifikasi kami akan meninjau pembayaran dalam waktu 1x24 jam kerja.",
      lead: {
        id: updateRes.lead.id,
        businessName: updateRes.lead.businessName,
        contactName: updateRes.lead.contactName,
        email: updateRes.lead.email,
        phone: updateRes.lead.phone,
        selectedPlan: updateRes.lead.selectedPlan,
        planPrice,
        planTag,
        invoiceNumber,
        invoiceAmount: updateRes.lead.invoiceAmount,
        status: updateRes.lead.status,
        paymentProofUrl: updateRes.lead.paymentProofUrl,
        paymentSenderName: updateRes.lead.paymentSenderName,
        paymentBankName: updateRes.lead.paymentBankName,
        paymentSubmittedAt: updateRes.lead.paymentSubmittedAt,
        createdAt: updateRes.lead.createdAt,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kendala saat memproses konfirmasi bukti transfer.";
    return { success: false, message: msg };
  }
}
