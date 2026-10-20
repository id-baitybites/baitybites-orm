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

            <p style="margin: 20px 0 0;">
              Setelah transfer berhasil, balas email ini atau kirimkan bukti transfer via WhatsApp ke tim kami di nomor <strong>0812-9876-5432</strong>. Sistem instance Anda akan langsung di-generate setelah pembayaran terkonfirmasi.
            </p>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Billing &amp; Finance Division
          </div>
        </div>
      `;
    } else if (status === "LUNAS") {
      emailSubject = `🎉 Pembayaran Diterima — Instance ${updated.businessName} Sedang Dipersiapkan`;
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

            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; font-size: 14px; color: #065f46; text-transform: uppercase; letter-spacing: 0.04em;">Langkah Selanjutnya (Automated Provisioning):</h3>
              <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #047857;">
                <li>Tim Platform Engineering sedang menyiapkan private repository GitHub khusus untuk toko Anda.</li>
                <li>Skema database PostgreSQL terisolasi (multi-tenant dedicated) sedang dialokasikan.</li>
                <li>Dalam hitungan menit, Anda akan menerima email kedua berisi <strong>URL Repository, Git Clone Command, dan Kredensial Onboarding Toko</strong>.</li>
              </ol>
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
            <p style="margin-bottom: 0;">Silakan hubungi kami kembali jika ada detail tambahan yang ingin Anda diskusikan.</p>
          </div>
        </div>
      `;
    } else if (status === "PROVISIONED") {
      emailSubject = `🚀 Instance Siap: Toko Online & OMS ${updated.businessName} Telah Aktif!`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 26px 32px; color: #ffffff;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Instance Siap Pakai</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Sistem Toko ${updated.businessName} Telah Dibuat</p>
          </div>

          <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Halo <strong>${updated.contactName}</strong>,</p>
            <p>Kabar gembira! Instance sistem Baitybites ORM untuk <strong>${updated.businessName}</strong> telah berhasil dibuat dan siap dioperasikan.</p>
            <p>Seluruh kredensial repositori, skema database mandiri, dan preset konfigurasi telah disiapkan. Silakan periksa email konfigurasi onboarding Anda untuk mulai mengatur menu dan menerima pesanan pelanggan.</p>
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
