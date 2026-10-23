"use server";

import { saveLead, updateLeadStatus } from "@/lib/leads-store";
import { sendEmailWithFallback } from "@/lib/email-service";

export interface SubscriptionRequest {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  selectedPlan: string;
  message?: string;
}

export interface SubscriptionResult {
  success: boolean;
  message: string;
}

export async function sendSubscriptionEmail(
  data: SubscriptionRequest
): Promise<SubscriptionResult> {
  const PLATFORM_EMAIL = "id.baitybites@gmail.com";

  const planLabel = data.selectedPlan;
  const timestamp = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  });

  // ── Simpan Permintaan ke Backoffice Leads Store ─────────────────────
  let savedLeadId: string | null = null;
  try {
    const saved = await saveLead({
      businessName: data.businessName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      selectedPlan: planLabel,
      message: data.message,
    });
    savedLeadId = saved.id;
  } catch (err) {
    console.error("[sendSubscriptionEmail] Gagal menyimpan ke leads-store:", err);
  }

  // ── HTML Notifikasi ke Platform Owner (id.baitybites@gmail.com) ───
  const ownerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px 32px; color: #ffffff;">
        <div style="display: inline-block; padding: 4px 10px; background: rgba(255, 255, 255, 0.2); border-radius: 20px; font-size: 11px; font-weight: 400; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
          Pemberitahuan Langganan Baru
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 400;">Permintaan Langganan: ${planLabel}</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">${timestamp}</p>
      </div>

      <div style="padding: 28px 32px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 10px 0; color: #64748b; width: 140px; vertical-align: top; font-weight: 400;">Paket Pilihan</td>
            <td style="padding: 10px 0; font-weight: 400; color: #4f46e5;">${planLabel}</td>
          </tr>
          <tr style="border-top: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; vertical-align: top; font-weight: 400;">Nama Bisnis</td>
            <td style="padding: 10px 0; color: #0f172a; font-weight: 550;">${data.businessName}</td>
          </tr>
          <tr style="border-top: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; vertical-align: top; font-weight: 400;">Nama Kontak</td>
            <td style="padding: 10px 0; color: #0f172a;">${data.contactName}</td>
          </tr>
          <tr style="border-top: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; vertical-align: top; font-weight: 400;">Email Calon Klien</td>
            <td style="padding: 10px 0;"><a href="mailto:${data.email}" style="color: #4f46e5; text-decoration: none;">${data.email}</a></td>
          </tr>
          <tr style="border-top: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; vertical-align: top; font-weight: 400;">Nomor WhatsApp/HP</td>
            <td style="padding: 10px 0; color: #0f172a;">
              <a href="https://wa.me/${data.phone.replace(/[^0-9]/g, "")}" style="color: #059669; text-decoration: none; font-weight: 400;">${data.phone}</a>
            </td>
          </tr>
          ${data.message
      ? `<tr style="border-top: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; vertical-align: top; font-weight: 400;">Pesan Tambahan</td>
                  <td style="padding: 10px 0; color: #334155; line-height: 1.5;">${data.message}</td>
                </tr>`
      : ""
    }
        </table>

        <div style="margin-top: 24px; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #475569;">
          <strong>Tips:</strong> Anda bisa langsung membalas email ini untuk berkorespondensi langsung dengan calon klien (<span style="color: #4f46e5;">${data.email}</span>).
        </div>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
        Email ini dikirim otomatis oleh sistem <strong>Baitybites ORM Platform</strong>.
      </div>
    </div>
  `;

  // ── HTML Konfirmasi ke Calon Klien ─────────────────────────────────
  const clientHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px 32px; color: #ffffff;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 400;">Baitybites ORM</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Dedicated F&amp;B Engine &amp; E-Commerce Platform</p>
      </div>

      <div style="padding: 28px 32px;">
        <p style="font-size: 15px; color: #0f172a; line-height: 1.6; margin-top: 0;">
          Halo <strong>${data.contactName}</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Terima kasih telah mengajukan permohonan berlangganan paket <strong style="color: #4f46e5;">${planLabel}</strong> di platform Baitybites ORM.
          Kami telah menerima permohonan Anda dan tim kami akan segera menghubungi Anda dalam waktu <strong>1×24 jam</strong> kerja untuk proses aktivasi dan persiapan instance.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 400; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">Ringkasan Data:</p>
          <p style="margin: 0; font-size: 13px; color: #0f172a; line-height: 1.6;">
            <strong>Paket:</strong> ${planLabel}<br />
            <strong>Nama Bisnis:</strong> ${data.businessName}<br />
            <strong>Email:</strong> ${data.email}<br />
            <strong>WhatsApp/Telepon:</strong> ${data.phone}
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          Jika Anda memiliki pertanyaan mendesak, silakan balas email ini atau hubungi kami di <a href="mailto:${PLATFORM_EMAIL}" style="color: #4f46e5; text-decoration: none;">${PLATFORM_EMAIL}</a>.
        </p>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Hak cipta dilindungi undang-undang.
      </div>
    </div>
  `;

  try {
    // 1. Kirim email notifikasi ke Platform Owner via email transaksional
    const ownerResult = await sendEmailWithFallback({
      to: PLATFORM_EMAIL,
      replyTo: data.email,
      subject: `Permintaan Langganan Baru - ${planLabel} (${data.businessName})`,
      html: ownerHtml,
    });

    if (!ownerResult.success) {
      console.warn("[Email Warning - Owner Email]", ownerResult.error);
    }

    // 2. Kirim email konfirmasi ke Calon Klien via email transaksional
    const clientEmailResult = await sendEmailWithFallback({
      to: data.email,
      subject: `Terima Kasih! Permintaan Langganan ${planLabel} Anda Telah Diterima`,
      html: clientHtml,
      replyTo: PLATFORM_EMAIL,
    });

    if (!clientEmailResult.success) {
      console.warn("[Email Warning - Client Email]", clientEmailResult.error);
      if (savedLeadId) {
        try {
          await updateLeadStatus(
            savedLeadId,
            "BARU",
            `Email resume konfirmasi gagal terkirim otomatis (${clientEmailResult.error || "Gagal email"}). Gunakan tombol "Kirim Resume" di menu Leads.`
          );
        } catch {
          // ignore
        }
      }
    }

    return {
      success: true,
      message:
        "Permintaan langganan berhasil dikirim! Tim Baitybites ORM akan segera menghubungi Anda.",
    };
  } catch (error: unknown) {
    console.error("[Email Error]", error);
    const errorMsg =
      error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return {
      success: false,
      message: `Gagal mengirim email: ${errorMsg}`,
    };
  }
}
