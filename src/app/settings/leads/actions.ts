"use server";

import {
  getAllLeads,
  updateLeadStatus,
  type ClientLead,
  type LeadStatus,
} from "@/lib/leads-store";
import { sendEmailWithFallback } from "@/lib/email-service";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";

const SUPPORT_PHONE = process.env.SUPPORT_WHATSAPP_PHONE?.trim() || "0812-9876-5432";

export async function getLeadsAction(): Promise<ClientLead[]> {
  return await getAllLeads();
}

/**
 * 1. KURASI PENERBITAN INVOICE
 * Memeriksa kelayakan dan menerbitkan invoice resmi ke klien via email transaksional.
 */
export async function curateInvoiceAction(params: {
  leadId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  paymentBank: string;
  customNotes?: string;
}): Promise<{ success: boolean; lead?: ClientLead; message: string }> {
  try {
    const leads = await getAllLeads();
    const lead = leads.find((l) => l.id === params.leadId);
    if (!lead) return { success: false, message: "Data klien tidak ditemukan." };

    // Pemeriksaan syarat: Hanya status BARU atau DIHUBUNGI yang boleh diterbitkan invoice
    if (lead.status !== "BARU" && lead.status !== "DIHUBUNGI") {
      return {
        success: false,
        message: `Peningkatan status ditolak: Status saat ini "${lead.status}" tidak diizinkan untuk penerbitan invoice awal.`,
      };
    }

    const res = await updateLeadStatusAction(
      lead.id,
      "INVOICE_DIKIRIM",
      params.customNotes || `Invoice ${params.invoiceNumber} diterbitkan dengan tujuan transfer ${params.paymentBank}`
    );

    if (!res.success) {
      return { success: false, message: res.error || "Gagal memperbarui status invoice." };
    }

    return {
      success: true,
      lead: res.lead,
      message: `Invoice resmi (${params.invoiceNumber}) berhasil diterbitkan dan dikirimkan ke ${res.emailRecipient || lead.email}!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return { success: false, message: msg };
  }
}

/**
 * 2. KURASI & VERIFIKASI PEMBAYARAN
 * Memeriksa mutasi/bukti transfer sebelum mengizinkan status LUNAS.
 */
export async function curatePaymentVerificationAction(params: {
  leadId: string;
  bankName: string;
  senderName: string;
  referenceCode?: string;
  notes?: string;
}): Promise<{ success: boolean; lead?: ClientLead; message: string }> {
  try {
    const leads = await getAllLeads();
    const lead = leads.find((l) => l.id === params.leadId);
    if (!lead) return { success: false, message: "Data klien tidak ditemukan." };

    // Pemeriksaan syarat: Hanya status INVOICE_DIKIRIM atau BUKTI_DITERIMA yang boleh diverifikasi lunas
    if (lead.status !== "INVOICE_DIKIRIM" && lead.status !== "BUKTI_DITERIMA") {
      return {
        success: false,
        message: `Pemeriksaan ditolak: Status "${lead.status}" belum memiliki tagihan invoice aktif atau sudah diproses.`,
      };
    }

    if (!params.bankName || !params.senderName) {
      return {
        success: false,
        message: "Data kurasi tidak lengkap: Nama bank tujuan dan nama pengirim wajib diverifikasi.",
      };
    }

    // Update data pembayaran dan ubah status ke LUNAS
    const updated = await updateLeadStatus(
      lead.id,
      "LUNAS",
      params.notes || `Pembayaran diverifikasi lunas via ${params.bankName} a.n. ${params.senderName} (Ref: ${params.referenceCode || "-"})`,
      {
        paidAt: new Date(),
        paymentBankName: params.bankName,
        paymentSenderName: params.senderName,
      }
    );

    if (!updated) {
      return { success: false, message: "Gagal menyimpan verifikasi pembayaran di database." };
    }

    // Trigger email konfirmasi pelunasan
    await updateLeadStatusAction(lead.id, "LUNAS");

    return {
      success: true,
      lead: updated,
      message: `Pembayaran ${lead.businessName} telah terverifikasi lunas. Akses persiapan instance kini dibuka!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return { success: false, message: msg };
  }
}

/**
 * 3. KURASI PERSIAPAN INSTANCE (TECHNICAL SETUP)
 * Memeriksa apakah data teknis instance telah disiapkan sebelum mengizinkan status PROVISIONED.
 */
export async function curateProvisionInstanceAction(params: {
  leadId: string;
  subdomain: string;
  repoUrl?: string;
  dbSchemaName?: string;
  contractMonths: number;
}): Promise<{ success: boolean; lead?: ClientLead; message: string }> {
  try {
    const leads = await getAllLeads();
    const lead = leads.find((l) => l.id === params.leadId);
    if (!lead) return { success: false, message: "Data klien tidak ditemukan." };

    // Pemeriksaan syarat: Instance HANYA boleh disiapkan jika status sudah LUNAS!
    if (lead.status !== "LUNAS" && lead.status !== "PROVISIONING") {
      return {
        success: false,
        message: `Pemeriksaan ditolak: Instance dilarang disiapkan sebelum status pembayaran diverifikasi LUNAS (Status saat ini: ${lead.status}).`,
      };
    }

    if (!params.subdomain || params.subdomain.trim().length < 3) {
      return {
        success: false,
        message: "Validasi gagal: Subdomain toko wajib diisi minimal 3 karakter.",
      };
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (params.contractMonths || 1));

    const cleanDomain = params.subdomain.includes(".")
      ? params.subdomain
      : `${params.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")}.baitybites.id`;

    const updated = await updateLeadStatus(
      lead.id,
      "PROVISIONED",
      `Instance teknis berhasil dikurasi & siap: Domain ${cleanDomain}, Skema DB: ${params.dbSchemaName || "tenant_default"}`,
      {
        customDomain: cleanDomain,
        repoUrl: params.repoUrl || `https://github.com/baitybites/${params.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")}`,
        dbSchemaName: params.dbSchemaName || `tenant_${params.subdomain.toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
        provisionedAt: new Date(),
        contractStartDate: startDate,
        contractEndDate: endDate,
      }
    );

    if (!updated) {
      return { success: false, message: "Gagal menyimpan data provisioning instance." };
    }

    return {
      success: true,
      lead: updated,
      message: `Instance toko "${lead.businessName}" (${cleanDomain}) telah siap! Langkah berikutnya: Serah terima kredensial & Go Live.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return { success: false, message: msg };
  }
}

/**
 * 4. KURASI SERAH TERIMA & GO LIVE (HANDOVER)
 * Memeriksa instance dan mengirimkan kredensial resmi sebelum mengaktifkan status WEBSITE_AKTIF.
 */
export async function curateHandoverAndGoLiveAction(leadId: string): Promise<{
  success: boolean;
  lead?: ClientLead;
  message: string;
}> {
  try {
    const leads = await getAllLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return { success: false, message: "Data klien tidak ditemukan." };

    // Pemeriksaan syarat: Hanya instance yang sudah PROVISIONED yang boleh diaktifkan Go Live!
    if (lead.status !== "PROVISIONED" && lead.status !== "ONBOARDING_SELESAI") {
      return {
        success: false,
        message: `Pemeriksaan ditolak: Instance belum berstatus PROVISIONED (Ready). Selesaikan konfigurasi instance terlebih dahulu.`,
      };
    }

    // 1. Buat akun Admin & kirim kredensial via email transaksional
    const inviteRes = await sendOnboardingInviteAction(lead.id);
    if (!inviteRes.success) {
      return {
        success: false,
        message: `Gagal mengirim email kredensial ke klien: ${inviteRes.message}`,
      };
    }

    // 2. Aktifkan status WEBSITE_AKTIF
    const updated = await updateLeadStatus(
      lead.id,
      "WEBSITE_AKTIF",
      `Website resmi diaktifkan & data kredensial terkirim ke klien (${inviteRes.emailRecipient})`,
      {
        activatedAt: new Date(),
      }
    );

    return {
      success: true,
      lead: updated || undefined,
      message: `Kredensial dan panduan onboarding berhasil dikirim ke ${inviteRes.emailRecipient}. Website "${lead.businessName}" kini resmi LIVE!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return { success: false, message: msg };
  }
}

/**
 * Update status lead sekaligus otomatis mengirimkan email notifikasi status & invoice ke klien via email transaksional.
 */
export async function updateLeadStatusAction(
  id: string,
  status: LeadStatus,
  internalNotes?: string
): Promise<{
  success: boolean;
  lead?: ClientLead;
  emailSent?: boolean;
  emailRecipient?: string;
  error?: string;
}> {
  try {
    const updated = await updateLeadStatus(id, status, internalNotes);
    if (!updated) {
      return { success: false, error: "Lead tidak ditemukan" };
    }

    const platformEmail = "id.baitybites@gmail.com";
    let emailSubject = "";
    let emailHtml = "";

    // Tentukan harga paket
    const planUpper = updated.selectedPlan.toUpperCase();
    let planPrice = "Rp 1.490.000 / bulan";
    let planTag = "Business Pro";
    if (planUpper.includes("STARTER")) {
      planPrice = "Rp 750.000 / bulan";
      planTag = "Starter Instance";
    } else if (planUpper.includes("ENTERPRISE")) {
      planPrice = "Rp 3.900.000 / bulan";
      planTag = "Enterprise Dedicated";
    }

    const invoiceNo = `INV-BB-${updated.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
    const todayStr = new Date().toLocaleDateString("id-ID", {
      dateStyle: "full",
      timeZone: "Asia/Jakarta",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://baitybites.site";
    const onboardingUrl = `${baseUrl}/admin?from=%2Fonboarding`;
    const storeUrl = `${baseUrl}/demo/store`;
    const adminUrl = `${baseUrl}/admin`;
    const kdsUrl = `${baseUrl}/kitchen`;

    if (status === "INVOICE_DIKIRIM") {
      emailSubject = `Tagihan Resmi (Invoice) Langganan Baitybites ORM - ${updated.businessName} [${invoiceNo}]`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 26px 32px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
              Dokumen Tagihan Resmi
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Invoice Pembayaran Lisensi</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Nomor: <strong>${invoiceNo}</strong> &bull; ${todayStr}</p>
          </div>

          <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Kepada Yth. <strong>${updated.contactName}</strong> (${updated.businessName}),</p>
            <p>Terima kasih atas kepercayaan Anda memilih <strong>Baitybites ORM</strong> sebagai platform sistem e-commerce dan manajemen operasional bisnis kuliner Anda. Berikut rincian tagihan langganan Anda:</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 140px;">Paket Pilihan:</td>
                  <td style="padding: 6px 0; font-weight: 400; color: #4f46e5;">${updated.selectedPlan} (${planTag})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Total Tagihan:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 16px;">${planPrice}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Fasilitas Termasuk:</td>
                  <td style="padding: 6px 0; color: #334155;">
                    &bull; Dedicated Multi-Tenant Database (Cloud PostgreSQL)<br />
                    &bull; Private Git Repository Source Code<br />
                    &bull; Kitchen Display System (KDS) &amp; POS Kasir Toko<br />
                    &bull; Integrasi Checkout WhatsApp &amp; Katalog Publik
                  </td>
                </tr>
              </table>
            </div>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; font-size: 14px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.04em;">Instruksi Transfer Pembayaran:</h3>
              <p style="margin: 0 0 8px; font-size: 13px;">Silakan melakukan transfer ke salah satu rekening resmi vendor kami:</p>
              <div style="background: #ffffff; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">
                <strong>Bank Central Asia (BCA)</strong><br />
                Nomor Rekening: <code style="font-size: 14px; color: #0f172a; font-weight: 700;">880-1234-567</code><br />
                Atas Nama: <strong>PT Baitybites Solusi Digital</strong>
              </div>
              <div style="background: #ffffff; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 6px;">
                <strong>Bank Mandiri</strong><br />
                Nomor Rekening: <code style="font-size: 14px; color: #0f172a; font-weight: 700;">137-00-9876543-2</code><br />
                Atas Nama: <strong>PT Baitybites Solusi Digital</strong>
              </div>
              <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
                Berita Transfer: <code>${invoiceNo}</code>
              </p>
            </div>

            <!-- TAUTAN KONFIRMASI PEMBAYARAN -->
            <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
              <h4 style="margin: 0 0 6px; color: #b45309; font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em;">Unggah Bukti Transfer Pembayaran</h4>
              <p style="margin: 0 0 12px; font-size: 13px; color: #92400e;">Setelah melakukan transfer, silakan mengunggah foto/screenshot bukti transfer Anda melalui form konfirmasi pembayaran resmi kami. Admin kami akan memverifikasi dalam waktu 1×24 jam:</p>
              <div style="text-align: center; margin: 14px 0 6px;">
                <a href="${baseUrl}/payment-confirmation?lead=${updated.id}&invoice=${invoiceNo}" style="display: inline-block; background: #d97706; color: #ffffff; padding: 11px 22px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 13px;">
                  Unggah Bukti Transfer &rarr;
                </a>
              </div>
              <p style="margin: 10px 0 0; font-size: 12px; color: #92400e; text-align: center;">
                Atau kirim via WhatsApp ke <strong>${SUPPORT_PHONE}</strong> dengan menyebutkan nomor invoice: <code>${invoiceNo}</code>
              </p>
            </div>

            <p style="margin: 20px 0 0;">
              Setelah transfer berhasil dan bukti diterima, tim kami akan memverifikasi dan mengaktifkan instance sistem toko Anda.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Billing &amp; Finance Division
          </div>
        </div>
      `;
    } else if (status === "BUKTI_DITERIMA") {
      emailSubject = `Bukti Transfer Diterima — Sedang Diverifikasi Tim Kami | ${updated.businessName}`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 26px 32px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
              Konfirmasi Penerimaan Bukti
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Bukti Transfer Telah Kami Terima</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Sedang dalam proses verifikasi oleh tim keuangan kami</p>
          </div>

          <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Terima kasih! Bukti transfer pembayaran Anda untuk langganan <strong>${updated.selectedPlan}</strong> di <strong>${updated.businessName}</strong> telah berhasil kami terima.</p>

            <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; font-size: 14px; color: #92400e; text-transform: uppercase;">Status Verifikasi:</h3>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div>
                  <p style="margin: 0; font-weight: 400; color: #b45309;">Bukti diterima — Menunggu Verifikasi Tim Keuangan</p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #92400e;">Estimasi verifikasi: 1×24 jam kerja</p>
                </div>
              </div>
            </div>

            <p>Setelah pembayaran terverifikasi, Anda akan menerima email konfirmasi pembayaran lunas beserta tautan untuk mengakses dan melakukan konfigurasi dashboard sistem toko Anda.</p>

            <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
              Ada pertanyaan? Hubungi tim kami di <a href="mailto:${platformEmail}" style="color: #d97706;">${platformEmail}</a> atau WhatsApp <strong>${SUPPORT_PHONE}</strong>.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Billing &amp; Finance Division
          </div>
        </div>
      `;
    } else if (status === "LUNAS") {
      emailSubject = `Pembayaran Diterima — Akses Setup Toko ${updated.businessName} Telah Dibuka`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 26px 32px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
              Konfirmasi Pelunasan
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Pembayaran Telah Diverifikasi</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Status Langganan: <strong>LUNAS &bull; AKTIF</strong></p>
          </div>

          <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Terima kasih! Pembayaran langganan paket <strong>${updated.selectedPlan}</strong> untuk bisnis <strong>${updated.businessName}</strong> telah kami terima dan diverifikasi secara resmi.</p>

            <!-- CTA ONBOARDING -->
            <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 10px; padding: 22px; margin: 24px 0; text-align: center;">
              <h3 style="margin: 0 0 6px; font-size: 16px; color: #065f46;">Mulai Setup &amp; Konfigurasi Toko Anda</h3>
              <p style="margin: 0 0 16px; font-size: 13px; color: #047857;">Instance Anda telah siap. Klik tombol di bawah untuk melengkapi nama toko, tema warna, dan nomor WhatsApp pemesanan:</p>
              <a href="${onboardingUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 13px 26px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.25);">
                Buka Wizard Onboarding Toko &rarr;
              </a>
              <p style="margin: 10px 0 0; font-size: 12px; color: #047857;">
                Tautan: <a href="${onboardingUrl}" style="color: #059669; word-break: break-all;">${onboardingUrl}</a>
              </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: 0.04em;">Akses Ekosistem Platform:</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                <li><strong>Web Toko Publik:</strong> <a href="${storeUrl}" style="color: #059669;">${storeUrl}</a></li>
                <li><strong>Dashboard Backoffice &amp; Kasir:</strong> <a href="${adminUrl}" style="color: #059669;">${adminUrl}</a></li>
                <li><strong>Kitchen Display System (KDS):</strong> <a href="${kdsUrl}" style="color: #059669;">${kdsUrl}</a></li>
              </ul>
            </div>

            <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
              Jika butuh bantuan segera, Anda dapat menghubungi tim support kami di <a href="mailto:${platformEmail}" style="color: #059669;">${platformEmail}</a>.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Customer Success Team
          </div>
        </div>
      `;
    } else if (status === "DIHUBUNGI") {
      emailSubject = `Pembaruan Status: Permohonan Langganan ${updated.businessName} Sedang Diproses`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px 30px; color: #ffffff;">
            <h1 style="color: #ffffff; margin: 0; font-size: 19px; font-weight: 400;">Baitybites ORM Platform</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">Pembaruan Status Pengajuan</p>
          </div>

          <div style="padding: 28px 30px; color: #0f172a; font-size: 14px; line-height: 1.65;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Tim spesialis Baitybites ORM telah meninjau pengajuan langganan paket <strong>${updated.selectedPlan}</strong> untuk bisnis Anda (<strong>${updated.businessName}</strong>).</p>
            <p>Saat ini status pengajuan Anda adalah: <strong style="color: #0284c7;">Sudah Dihubungi</strong>. Tim kami siap mendampingi Anda dalam menentukan arsitektur dan kebutuhan peluncuran toko online Anda.</p>
            ${internalNotes ? `<div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 10px 14px; margin: 16px 0; font-size: 13px; color: #475569;">${internalNotes}</div>` : ""}
            <div style="margin: 20px 0; text-align: center;">
              <a href="${onboardingUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-weight: 400; text-decoration: none; font-size: 13px;">
                Lihat Simulasi Setup Toko
              </a>
            </div>
            <p style="margin-bottom: 0;">Silakan hubungi kami kembali jika ada detail tambahan yang ingin Anda diskusikan.</p>
          </div>
        </div>
      `;
    } else if (status === "PROVISIONED") {
      emailSubject = `Instance Siap: Toko Online & OMS ${updated.businessName} Telah Aktif!`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 26px 32px; color: #ffffff;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Instance Siap Digunakan</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Sistem Toko ${updated.businessName} Telah Dibuat &bull; Status: AKTIF</p>
          </div>

          <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Kabar gembira! Instance sistem Baitybites ORM untuk <strong>${updated.businessName}</strong> telah berhasil dibuat dan siap dioperasikan.</p>

            <!-- CTA UTAMA ONBOARDING -->
            <div style="background: #f5f3ff; border: 2px solid #7c3aed; border-radius: 10px; padding: 22px; margin: 24px 0; text-align: center;">
              <h3 style="margin: 0 0 6px; font-size: 16px; color: #5b21b6;">Setup &amp; Onboarding Toko Web Anda</h3>
              <p style="margin: 0 0 16px; font-size: 13px; color: #6d28d9;">Mulai kustomisasi nama brand, logo toko, palet warna, dan katalog menu Anda sekarang:</p>
              <a href="${onboardingUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; padding: 13px 26px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.25);">
                Buka Wizard Onboarding Toko &rarr;
              </a>
              <p style="margin: 10px 0 0; font-size: 12px; color: #6d28d9;">
                Tautan: <a href="${onboardingUrl}" style="color: #7c3aed; word-break: break-all;">${onboardingUrl}</a>
              </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: 0.04em;">Tautan Akses Cepat Platform:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 170px;">1. Web Toko Publik:</td>
                  <td style="padding: 6px 0;"><a href="${storeUrl}" style="color: #7c3aed; font-weight: 400;">${storeUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">2. Backoffice &amp; Kasir:</td>
                  <td style="padding: 6px 0;"><a href="${adminUrl}" style="color: #7c3aed; font-weight: 400;">${adminUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">3. Display Dapur (KDS):</td>
                  <td style="padding: 6px 0;"><a href="${kdsUrl}" style="color: #7c3aed; font-weight: 400;">${kdsUrl}</a></td>
                </tr>
              </table>
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b;">
                <strong>Security PIN Admin Toko:</strong> <code style="background: #ffffff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: 700; color: #0f172a;">1234</code>
              </div>
            </div>

            <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
              Jika butuh pendampingan teknis atau peluncuran domain kustom, balas email ini atau hubungi tim kami via WhatsApp di <strong>${SUPPORT_PHONE}</strong>.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Client Onboarding Team
          </div>
        </div>
      `;
    } else if (status === "ONBOARDING_SELESAI") {
      emailSubject = `Selamat! Onboarding Toko ${updated.businessName} Telah Selesai`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 26px 32px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
              Konfigurasi Selesai
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Onboarding Toko Berhasil Diselesaikan</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Identitas brand dan konfigurasi toko ${updated.businessName} telah tersimpan</p>
          </div>

          <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Selamat! Proses onboarding dan konfigurasi toko <strong>${updated.businessName}</strong> telah berhasil diselesaikan. Toko Anda sudah siap beroperasi penuh.</p>

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; font-size: 14px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.04em;">Akses Platform Anda:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 7px 0; color: #64748b; width: 180px;">Web Toko Publik:</td>
                  <td style="padding: 7px 0;"><a href="${storeUrl}" style="color: #0284c7; font-weight: 400;">${storeUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">Dashboard Backoffice:</td>
                  <td style="padding: 7px 0;"><a href="${adminUrl}" style="color: #0284c7; font-weight: 400;">${adminUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">Kitchen Display (KDS):</td>
                  <td style="padding: 7px 0;"><a href="${kdsUrl}" style="color: #0284c7; font-weight: 400;">${kdsUrl}</a></td>
                </tr>
              </table>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; font-size: 14px; color: #334155; text-transform: uppercase;">Langkah Selanjutnya:</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
                <li>Tambahkan dan lengkapi katalog menu / produk toko Anda</li>
                <li>Atur integrasi WhatsApp untuk sistem pemesanan</li>
                <li>Hubungkan domain kustom Anda (opsional, hubungi tim kami)</li>
                <li>Lakukan uji coba transaksi pertama bersama tim Anda</li>
              </ul>
            </div>

            <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
              Tim kami akan mengirimkan email notifikasi resmi aktivasi website toko Anda setelah semua konfigurasi divalidasi. Butuh bantuan teknis? Hubungi kami di <a href="mailto:${platformEmail}" style="color: #0284c7;">${platformEmail}</a>.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Client Success Team
          </div>
        </div>
      `;
    } else if (status === "WEBSITE_AKTIF") {
      emailSubject = `Website Toko ${updated.businessName} Resmi Aktif — Selamat Datang di Baitybites ORM!`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 26px 32px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
              Aktivasi Resmi Website
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Website Toko Anda Resmi Aktif!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">${updated.businessName} &bull; Baitybites ORM SaaS Platform</p>
          </div>

          <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Selamat! Website toko online <strong>${updated.businessName}</strong> telah resmi aktif dan dapat diakses oleh publik. Selamat bergabung bersama keluarga mitra Baitybites ORM!</p>

            <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 10px; padding: 22px; margin: 24px 0; text-align: center;">
              <h3 style="margin: 0 0 6px; font-size: 16px; color: #14532d;">Web Toko Publik Anda</h3>
              <p style="margin: 0 0 14px; font-size: 13px; color: #166534;">Bagikan tautan toko Anda kepada pelanggan sekarang:</p>
              <a href="${storeUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 13px 26px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.25);">
                Kunjungi Toko Anda &rarr;
              </a>
              <p style="margin: 10px 0 0; font-size: 12px; color: #166534; word-break: break-all;">${storeUrl}</p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: 0.04em;">Informasi Kontrak Layanan SaaS:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 7px 0; color: #64748b; width: 160px;">Paket Berlangganan:</td>
                  <td style="padding: 7px 0; font-weight: 400; color: #16a34a;">${updated.selectedPlan}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">Tanggal Aktif:</td>
                  <td style="padding: 7px 0;">${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px; font-size: 13px; color: #854d0e; text-transform: uppercase;">Kewajiban & Ketentuan Layanan:</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #78350f; line-height: 1.9;">
                <li>Perpanjang langganan sebelum masa aktif berakhir untuk menghindari suspensi layanan</li>
                <li>Dilarang mengubah atau mendistribusikan source code platform tanpa izin tertulis</li>
                <li>Gunakan platform sesuai ketentuan penggunaan yang berlaku (ToS Baitybites ORM)</li>
                <li>Laporan gangguan teknis dikirimkan ke email platform kami atau via WhatsApp support</li>
              </ul>
            </div>

            <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
              Untuk panduan lengkap penggunaan platform, dokumentasi, atau bantuan teknis — hubungi tim kami di <a href="mailto:${platformEmail}" style="color: #16a34a;">${platformEmail}</a> atau WhatsApp <strong>${SUPPORT_PHONE}</strong>.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Platform Management &amp; Client Success Team
          </div>
        </div>
      `;
    }


    let emailSent = false;
    let emailRecipient: string | undefined = undefined;

    if (emailSubject && emailHtml && updated.email) {
      const emailResult = await sendEmailWithFallback({
        to: updated.email,
        subject: emailSubject,
        html: emailHtml,
        replyTo: platformEmail,
      });

      if (emailResult.success) {
        emailSent = true;
        emailRecipient = emailResult.deliveredTo;
      }
    }

    return {
      success: true,
      lead: updated,
      emailSent,
      emailRecipient,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { success: false, error: msg };
  }
}

/**
 * Balas pesan / kirim email kustom ke klien via email transaksional
 */
export async function sendEmailReplyAction(params: {
  leadId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const platformEmail = "id.baitybites@gmail.com";

  try {
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 24px 30px; color: #ffffff;">
          <h1 style="color: #ffffff; margin: 0; font-size: 19px; font-weight: 400;">Baitybites ORM Platform</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">Tanggapan Resmi Tim Platform</p>
        </div>

        <div style="padding: 28px 30px; color: #0f172a; font-size: 14px; line-height: 1.65;">
          <p style="margin-top: 0;">Halo <strong>${params.recipientName}</strong>,</p>
          <div style="white-space: pre-wrap; color: #334155; margin: 16px 0;">${params.message}</div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Hormat kami,<br />
            <strong>Tim Platform Baitybites ORM</strong><br />
            Email: <a href="mailto:${platformEmail}" style="color: #4f46e5;">${platformEmail}</a>
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmailWithFallback({
      to: params.recipientEmail,
      subject: params.subject,
      html: htmlBody,
      replyTo: platformEmail,
    });

    if (!emailResult.success) {
      return { success: false, message: `Gagal mengirim email: ${emailResult.error}` };
    }

    // Update status lead to DIHUBUNGI
    await updateLeadStatus(
      params.leadId,
      "DIHUBUNGI",
      `Email balasan terkirim pada ${new Date().toLocaleDateString("id-ID")}`
    );

    return {
      success: true,
      message: `Email balasan berhasil dikirim ke ${emailResult.deliveredTo}!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return { success: false, message: `Gagal mengirim email: ${msg}` };
  }
}

/**
 * Kirim email resmi berisi Kredensial Otentikasi Client Admin & Tautan Setup Onboarding Toko Web ke Klien
 */
export async function sendOnboardingInviteAction(leadId: string): Promise<{
  success: boolean;
  message: string;
  emailRecipient?: string;
}> {
  const leads = await getAllLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead || !lead.email) {
    return { success: false, message: "Data klien atau email tidak ditemukan." };
  }

  const cleanSlug = lead.brandSlug || lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const clientAdminUsername = `admin.${cleanSlug}`;
  const clientAdminPassword = `${cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)}2026!#`;
  const clientAdminPin = "1234";

  // Auto-provision or update Client Admin di database PostgreSQL
  try {
    const existingAdmin = await db.admin.findUnique({
      where: { username: clientAdminUsername },
    });
    const passwordHash = await bcrypt.hash(clientAdminPassword, 10);
    const pinHash = await bcrypt.hash(clientAdminPin, 10);

    if (!existingAdmin) {
      await db.admin.create({
        data: {
          id: `adm-client-${cleanSlug}`,
          username: clientAdminUsername,
          displayName: `Admin ${lead.businessName} (${lead.contactName})`,
          passwordHash,
          pinHash,
          role: "SUPER_ADMIN",
          isActive: true,
          createdBy: "PLATFORM_OWNER",
        },
      });
    } else {
      await db.admin.update({
        where: { username: clientAdminUsername },
        data: {
          passwordHash,
          pinHash,
          isActive: true,
        },
      });
    }
  } catch (dbErr: any) {
    console.warn("Notice: could not auto-create client admin account in db:", dbErr?.message);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://baitybites.site";
  const loginUrl = `${baseUrl}/admin?from=%2Fonboarding`;
  const storeUrl = `${baseUrl}/demo/store`;
  const adminUrl = `${baseUrl}/admin`;
  const kdsUrl = `${baseUrl}/kitchen`;
  const platformEmail = "id.baitybites@gmail.com";

  const emailSubject = `Kredensial Otentikasi Resmi Client Admin & Akses Onboarding Toko — ${lead.businessName}`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 26px 32px; color: #ffffff;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.18); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
          Kredensial Akses Klien
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Aktivasi Akun Client Admin</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Bisnis: <strong>${lead.businessName}</strong> &bull; Peran: <strong>Client Super Admin</strong></p>
      </div>

      <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Halo <strong>${lead.contactName}</strong>,</p>
        <p>Akun resmi otentikasi administrator Anda untuk mengelola platform toko <strong>${lead.businessName}</strong> telah aktif dan terdaftar di database sistem Baitybites ORM.</p>
        
        <p>Sebelum melakukan konfigurasi brand dan menu pada wizard onboarding, silakan lakukan proses autentikasi login terlebih dahulu menggunakan kredensial resmi di bawah ini:</p>

        <!-- KOTAK KREDENSIAL OTENTIKASI -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; font-size: 14px; color: #312e81; text-transform: uppercase; letter-spacing: 0.05em;">Kredensial Login Client Admin Anda:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 160px;">Portal Login:</td>
              <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #4f46e5; font-weight: 400;">${baseUrl}/admin</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Username:</td>
              <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${clientAdminUsername}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Password Sementara:</td>
              <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${clientAdminPassword}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Security PIN Kasir:</td>
              <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${clientAdminPin}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Hak Akses / Role:</td>
              <td style="padding: 6px 0; font-weight: 400; color: #059669;">SUPER_ADMIN (Owner Toko)</td>
            </tr>
          </table>
        </div>

        <!-- TOMBOL CTA LOGIN & ONBOARDING -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
            Login Sebagai Client Admin &amp; Lanjut Onboarding &rarr;
          </a>
          <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
            Tautan Login Resmi: <a href="${loginUrl}" style="color: #4f46e5; word-break: break-all;">${loginUrl}</a>
          </p>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; font-size: 13px; color: #1e40af; text-transform: uppercase;">Alur Otentikasi &amp; Setup:</h4>
          <ol style="margin: 0; padding-left: 18px; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
            <li>Klik tombol login di atas dan masukkan username serta password resmi Anda.</li>
            <li>Setelah terotentikasi, sistem akan langsung mengenali Anda sebagai Client Admin <strong>${lead.businessName}</strong>.</li>
            <li>Sesi terotentikasi akan membawa Anda ke Wizard Onboarding untuk mengatur identitas logo, tema visual, nomor WhatsApp toko, dan menu produk kuliner Anda.</li>
            <li>Demi keamanan, Anda disarankan langsung mengganti password sementara melalui menu Profil / Pengaturan Akun setelah login.</li>
          </ol>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; font-size: 14px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.04em;">Akses Cepat Platform Anda:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 180px;">Web E-Commerce Publik:</td>
              <td style="padding: 5px 0;"><a href="${storeUrl}" style="color: #2563eb; font-weight: 400;">Lihat Tampilan Toko Publik</a></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Dashboard Kasir &amp; OMS:</td>
              <td style="padding: 5px 0;"><a href="${adminUrl}" style="color: #2563eb; font-weight: 400;">Buka Portal Backoffice Admin</a></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Kitchen Display (KDS):</td>
              <td style="padding: 5px 0;"><a href="${kdsUrl}" style="color: #2563eb; font-weight: 400;">Buka Layar Display Dapur</a></td>
            </tr>
          </table>
        </div>

        <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
          Jika Anda mengalami kendala saat login atau verifikasi, hubungi tim dukungan kami di <a href="mailto:${platformEmail}" style="color: #4f46e5;">${platformEmail}</a> atau WhatsApp support di <strong>${SUPPORT_PHONE}</strong>.
        </p>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Security &amp; Client Success Division
      </div>
    </div>
  `;

  const emailResult = await sendEmailWithFallback({
    to: lead.email,
    subject: emailSubject,
    html: emailHtml,
    replyTo: platformEmail,
  });

  if (!emailResult.success) {
    return { success: false, message: `Gagal mengirim email: ${emailResult.error}` };
  }

  await updateLeadStatus(
    lead.id,
    lead.status,
    `Kredensial Client Admin & Tautan onboarding dikirimkan via email pada ${new Date().toLocaleDateString("id-ID")}`
  );

  return {
    success: true,
    message: `Kredensial Client Admin berhasil dikirim ke ${emailResult.deliveredTo}!`,
    emailRecipient: emailResult.deliveredTo,
  };
}

/**
 * Kirim ulang email resume / konfirmasi formulir berlangganan ke calon klien via email transaksional
 */
export async function resendSubscriptionResumeAction(leadId: string): Promise<{
  success: boolean;
  message: string;
  emailRecipient?: string;
}> {
  const leads = await getAllLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead || !lead.email) {
    return { success: false, message: "Data calon klien atau email tidak ditemukan." };
  }

  const platformEmail = "id.baitybites@gmail.com";
  const planLabel = lead.selectedPlan;

  const clientHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px 32px; color: #ffffff;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 400;">Baitybites ORM</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Dedicated F&amp;B Engine &amp; E-Commerce Platform</p>
      </div>

      <div style="padding: 28px 32px;">
        <p style="font-size: 15px; color: #0f172a; line-height: 1.6; margin-top: 0;">
          Halo <strong>${lead.contactName}</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Terima kasih telah mengajukan permohonan berlangganan paket <strong style="color: #4f46e5;">${planLabel}</strong> di platform Baitybites ORM.
          Kami telah menerima permohonan Anda dan tim kami akan segera menghubungi Anda dalam waktu <strong>1×24 jam</strong> kerja untuk proses aktivasi dan persiapan instance.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 400; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">Ringkasan Data:</p>
          <p style="margin: 0; font-size: 13px; color: #0f172a; line-height: 1.6;">
            <strong>Paket:</strong> ${planLabel}<br />
            <strong>Nama Bisnis:</strong> ${lead.businessName}<br />
            <strong>Email:</strong> ${lead.email}<br />
            <strong>WhatsApp/Telepon:</strong> ${lead.phone}
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          Jika Anda memiliki pertanyaan mendesak, silakan balas email ini atau hubungi kami di <a href="mailto:${platformEmail}" style="color: #4f46e5; text-decoration: none;">${platformEmail}</a>.
        </p>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Hak cipta dilindungi undang-undang.
      </div>
    </div>
  `;

  const emailResult = await sendEmailWithFallback({
    to: lead.email,
    subject: `Terima Kasih! Permintaan Langganan ${planLabel} Anda Telah Diterima`,
    html: clientHtml,
    replyTo: platformEmail,
  });

  if (!emailResult.success) {
    return { success: false, message: `Gagal mengirim email: ${emailResult.error}` };
  }

  await updateLeadStatus(
    lead.id,
    lead.status,
    `Email resume langganan dikirim ulang via email pada ${new Date().toLocaleString("id-ID")}`
  );

  return {
    success: true,
    message: `Email resume langganan berhasil dikirim ulang ke ${emailResult.deliveredTo}!`,
    emailRecipient: emailResult.deliveredTo,
  };
}
