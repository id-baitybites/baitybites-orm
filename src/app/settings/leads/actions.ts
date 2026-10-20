"use server";

import {
  getAllLeads,
  updateLeadStatus,
  type ClientLead,
  type LeadStatus,
} from "@/lib/leads-store";
import { sendEmailWithFallback } from "@/lib/email-service";

export async function getLeadsAction(): Promise<ClientLead[]> {
  return await getAllLeads();
}

/**
 * Update status lead sekaligus otomatis mengirimkan email notifikasi status & invoice ke klien via Brevo.
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://baitybites-orm.vercel.app";
    const onboardingUrl = `${baseUrl}/onboarding?force=true&brand=${encodeURIComponent(updated.businessName)}`;
    const storeUrl = `${baseUrl}/demo/store`;
    const adminUrl = `${baseUrl}/admin`;
    const kdsUrl = `${baseUrl}/kitchen`;

    if (status === "INVOICE_DIKIRIM") {
      emailSubject = `🧾 Tagihan Resmi (Invoice) Langganan Baitybites ORM — ${updated.businessName} [${invoiceNo}]`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 26px 32px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 600; margin-bottom: 6px;">
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
                  <td style="padding: 6px 0; font-weight: 600; color: #4f46e5;">${updated.selectedPlan} (${planTag})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Total Tagihan:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 16px;">${planPrice}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Fasilitas Termasuk:</td>
                  <td style="padding: 6px 0; color: #334155;">
                    &bull; Dedicated Multi-Tenant Database (Neon PostgreSQL)<br />
                    &bull; Private GitHub Repository Source Code<br />
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

            <!-- TAUTAN ONBOARDING & SETUP PREVIEW -->
            <div style="background: #fdfbf7; border: 1px solid #fed7aa; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
              <h4 style="margin: 0 0 6px; color: #c2410c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em;">🚀 Akses Awal: Setup &amp; Onboarding Toko</h4>
              <p style="margin: 0 0 12px; font-size: 13px; color: #7c2d12;">Sembari menyelesaikan proses pembayaran, Anda sudah dapat mencoba simulator konfigurasi identitas brand, tema warna, dan katalog toko Anda di tautan berikut:</p>
              <div style="text-align: center; margin: 14px 0 6px;">
                <a href="${onboardingUrl}" style="display: inline-block; background: #ea580c; color: #ffffff; padding: 11px 22px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 13px;">
                  Buka Wizard Onboarding Toko &rarr;
                </a>
              </div>
              <p style="margin: 8px 0 0; font-size: 11px; color: #9a3412; text-align: center;">
                Tautan: <a href="${onboardingUrl}" style="color: #ea580c; word-break: break-all;">${onboardingUrl}</a>
              </p>
            </div>

            <p style="margin: 20px 0 0;">
              Setelah transfer berhasil, balas email ini atau kirimkan bukti transfer via WhatsApp ke tim kami di nomor <strong>0812-9876-5432</strong>. Sistem instance Anda akan langsung diaktifkan secara otomatis.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Billing &amp; Finance Division
          </div>
        </div>
      `;
    } else if (status === "LUNAS") {
      emailSubject = `🎉 Pembayaran Diterima — Akses Setup Toko ${updated.businessName} Telah Dibuka`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 26px 32px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 600; margin-bottom: 6px;">
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
              <h3 style="margin: 0 0 6px; font-size: 16px; color: #065f46;">🚀 Mulai Setup &amp; Konfigurasi Toko Anda</h3>
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
      emailSubject = `📞 Pembaruan Status: Permohonan Langganan ${updated.businessName} Sedang Diproses`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px 30px; color: #ffffff;">
            <h1 style="color: #ffffff; margin: 0; font-size: 19px; font-weight: 600;">Baitybites ORM Platform</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">Pembaruan Status Pengajuan</p>
          </div>

          <div style="padding: 28px 30px; color: #0f172a; font-size: 14px; line-height: 1.65;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Tim spesialis Baitybites ORM telah meninjau pengajuan langganan paket <strong>${updated.selectedPlan}</strong> untuk bisnis Anda (<strong>${updated.businessName}</strong>).</p>
            <p>Saat ini status pengajuan Anda adalah: <strong style="color: #0284c7;">Sudah Dihubungi</strong>. Tim kami siap mendampingi Anda dalam menentukan arsitektur dan kebutuhan peluncuran toko online Anda.</p>
            ${internalNotes ? `<div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 10px 14px; margin: 16px 0; font-size: 13px; color: #475569;">${internalNotes}</div>` : ""}
            <div style="margin: 20px 0; text-align: center;">
              <a href="${onboardingUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 13px;">
                Lihat Simulasi Setup Toko &rarr;
              </a>
            </div>
            <p style="margin-bottom: 0;">Silakan hubungi kami kembali jika ada detail tambahan yang ingin Anda diskusikan.</p>
          </div>
        </div>
      `;
    } else if (status === "PROVISIONED") {
      emailSubject = `🚀 Instance Siap: Toko Online & OMS ${updated.businessName} Telah Aktif!`;
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
              <h3 style="margin: 0 0 6px; font-size: 16px; color: #5b21b6;">🚀 Setup &amp; Onboarding Toko Web Anda</h3>
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
                  <td style="padding: 6px 0;"><a href="${storeUrl}" style="color: #7c3aed; font-weight: 600;">${storeUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">2. Backoffice &amp; Kasir:</td>
                  <td style="padding: 6px 0;"><a href="${adminUrl}" style="color: #7c3aed; font-weight: 600;">${adminUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">3. Display Dapur (KDS):</td>
                  <td style="padding: 6px 0;"><a href="${kdsUrl}" style="color: #7c3aed; font-weight: 600;">${kdsUrl}</a></td>
                </tr>
              </table>
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b;">
                <strong>Security PIN Admin Toko:</strong> <code style="background: #ffffff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: 700; color: #0f172a;">1234</code>
              </div>
            </div>

            <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
              Jika butuh pendampingan teknis atau peluncuran domain kustom, balas email ini atau hubungi tim kami via WhatsApp di <strong>0812-9876-5432</strong>.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Client Onboarding Team
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
 * Balas pesan / kirim email kustom ke klien via Brevo
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
          <h1 style="color: #ffffff; margin: 0; font-size: 19px; font-weight: 600;">Baitybites ORM Platform</h1>
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
 * Kirim email khusus berisi Tautan Setup Konfigurasi & Onboarding Toko Web ke Klien
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://baitybites-orm.vercel.app";
  const onboardingUrl = `${baseUrl}/onboarding?force=true&brand=${encodeURIComponent(lead.businessName)}`;
  const storeUrl = `${baseUrl}/demo/store`;
  const adminUrl = `${baseUrl}/admin`;
  const kdsUrl = `${baseUrl}/kitchen`;
  const platformEmail = "id.baitybites@gmail.com";

  const emailSubject = `🚀 Akses Setup Konfigurasi & Onboarding Toko Web Anda — ${lead.businessName}`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 26px 32px; color: #ffffff;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 600; margin-bottom: 6px;">
          Panduan Setup Toko Web
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Akses Onboarding Sistem Toko</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Bisnis: <strong>${lead.businessName}</strong> &bull; Paket: <strong>${lead.selectedPlan}</strong></p>
      </div>

      <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Halo <strong>${lead.contactName}</strong>,</p>
        <p>Selamat bergabung di platform <strong>Baitybites ORM</strong>! Instance sistem toko online e-commerce dan manajemen operasional bisnis kuliner Anda siap untuk dikonfigurasi.</p>

        <!-- CTA BUTTON UTAMA -->
        <div style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 10px; padding: 22px; margin: 24px 0; text-align: center;">
          <h3 style="margin: 0 0 6px; font-size: 16px; color: #3730a3;">🚀 Setup &amp; Onboarding Toko Web Anda</h3>
          <p style="margin: 0 0 16px; font-size: 13px; color: #4338ca;">Klik tombol di bawah ini untuk memulai wizard pengaturan identitas brand, tema visual, nomor WhatsApp CS, dan katalog menu toko:</p>
          <a href="${onboardingUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
            Buka Wizard Setup &amp; Onboarding Toko &rarr;
          </a>
          <p style="margin: 12px 0 0; font-size: 12px; color: #6366f1;">
            Tautan langsung: <a href="${onboardingUrl}" style="color: #4f46e5; word-break: break-all;">${onboardingUrl}</a>
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; font-size: 14px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">Langkah Mudah Setup Toko (4 Langkah Interaktif):</h3>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
            <li style="margin-bottom: 6px;"><strong>Buat Akun Super Admin Toko</strong>: Daftarkan username, display name, password, dan 4-digit Security PIN kasir (PIN default awal: <code>1234</code>).</li>
            <li style="margin-bottom: 6px;"><strong>Identitas Brand</strong>: Lengkapi nama brand toko Anda (<code>${lead.businessName}</code>), tagline, nomor WhatsApp CS untuk pesanan masuk, dan akun Instagram.</li>
            <li style="margin-bottom: 6px;"><strong>Warna Visual Brand</strong>: Pilih warna primer dan aksen yang sesuai dengan ciri khas toko Anda.</li>
            <li><strong>Database &amp; Katalog Menu</strong>: Pilih untuk mulai dengan database bersih atau contoh menu produk kuliner siap edit.</li>
          </ol>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; font-size: 14px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.04em;">Akses Cepat Platform Anda:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 180px;">Web E-Commerce Publik:</td>
              <td style="padding: 5px 0;"><a href="${storeUrl}" style="color: #2563eb; font-weight: 600;">Lihat Tampilan Toko Publik &rarr;</a></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Dashboard Kasir &amp; OMS:</td>
              <td style="padding: 5px 0;"><a href="${adminUrl}" style="color: #2563eb; font-weight: 600;">Buka Portal Backoffice Admin &rarr;</a></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Kitchen Display (KDS):</td>
              <td style="padding: 5px 0;"><a href="${kdsUrl}" style="color: #2563eb; font-weight: 600;">Buka Layar Display Dapur &rarr;</a></td>
            </tr>
          </table>
        </div>

        <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
          Jika Anda memerlukan asistensi teknis, silakan hubungi tim kami di <a href="mailto:${platformEmail}" style="color: #4f46e5;">${platformEmail}</a> atau melalui WhatsApp support kami di <strong>0812-9876-5432</strong>.
        </p>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Client Onboarding &amp; Success Team
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
    `Tautan onboarding dikirimkan via Brevo pada ${new Date().toLocaleDateString("id-ID")}`
  );

  return {
    success: true,
    message: `Tautan setup & onboarding berhasil dikirim ke ${emailResult.deliveredTo}!`,
    emailRecipient: emailResult.deliveredTo,
  };
}
