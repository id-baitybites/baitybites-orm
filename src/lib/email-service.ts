import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  isSimulated: boolean;
  deliveredTo: string;
  provider: "BREVO" | "SMTP" | "RESEND";
  error?: string;
}

const PLATFORM_EMAIL = process.env.STORE_EMAIL || process.env.SMTP_FROM_EMAIL || "id.baitybites@gmail.com";
const PLATFORM_TEST_INBOX = process.env.STORE_EMAIL || "id.baitybites@gmail.com";

/**
 * Universal Email Dispatcher — urutan prioritas:
 * 1. BREVO API (HTTP)  → real delivery ke email siapapun, tidak butuh domain verification
 * 2. SMTP (Nodemailer) → real delivery via SMTP relay (fallback jika BREVO_API_KEY tidak ada)
 * 3. RESEND API        → fallback terakhir (sandbox mode, mungkin terbatas ke email terdaftar)
 */
export async function sendEmailWithFallback(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  // ── 1. Kirim via Brevo HTTP API ───────────────────────────────────────────
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  if (brevoApiKey && !brevoApiKey.startsWith("xkeysib-REPLACE")) {
    const result = await sendViaBrevoAPI(options, brevoApiKey);
    if (result.success) return result;
    console.warn("[Email Service] Brevo API gagal, mencoba SMTP...", result.error);
  }

  // ── 2. Kirim via SMTP (Nodemailer) ────────────────────────────────────────
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)?.trim();
  if (smtpUser && smtpPass) {
    const result = await sendViaSMTP(options, smtpUser, smtpPass);
    if (result.success) return result;
    console.warn("[Email Service] SMTP gagal, mencoba Resend...", result.error);
  }

  // ── 3. Kirim via Resend API ───────────────────────────────────────────────
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    return sendViaResend(options, resendApiKey);
  }

  return {
    success: false,
    isSimulated: false,
    deliveredTo: "",
    provider: "BREVO",
    error:
      "Tidak ada kredensial email yang dikonfigurasi. Atur BREVO_API_KEY di .env.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver 1: Brevo HTTP API
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaBrevoAPI(
  options: SendEmailOptions,
  apiKey: string
): Promise<SendEmailResult> {
  try {
    const senderName = process.env.NEXT_PUBLIC_STORE_NAME || "Toko Kami";
    const payload = {
      sender: { name: senderName, email: PLATFORM_EMAIL },
      to: [{ email: options.to.trim() }],
      replyTo: { email: options.replyTo || PLATFORM_EMAIL },
      subject: options.subject,
      htmlContent: options.html,
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (response.ok && data.messageId) {
      console.log(
        `[Email Service - Brevo API] ✅ Terkirim ke ${options.to} | ID: ${data.messageId}`
      );
      return {
        success: true,
        isSimulated: false,
        deliveredTo: options.to.trim(),
        provider: "BREVO",
      };
    }

    const errMsg =
      (data.message as string) || `HTTP ${response.status}: ${JSON.stringify(data)}`;
    console.error("[Email Service - Brevo API Error]:", errMsg);
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "BREVO",
      error: `Brevo API: ${errMsg}`,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Kesalahan jaringan Brevo API";
    console.error("[Email Service - Brevo API Exception]:", msg);
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "BREVO",
      error: msg,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver 2: SMTP via Nodemailer
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaSMTP(
  options: SendEmailOptions,
  smtpUser: string,
  smtpPass: string
): Promise<SendEmailResult> {
  try {
    const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure =
      process.env.SMTP_SECURE != null
        ? process.env.SMTP_SECURE === "true"
        : smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const senderName = process.env.NEXT_PUBLIC_STORE_NAME || "Toko Kami";
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || `${senderName} <${smtpUser}>`,
      to: options.to.trim(),
      replyTo: options.replyTo || smtpUser,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email Service - SMTP] ✅ Terkirim ke ${options.to}`);
    return {
      success: true,
      isSimulated: false,
      deliveredTo: options.to.trim(),
      provider: "SMTP",
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Kesalahan pengiriman SMTP";
    console.error("[Email Service - SMTP Error]:", msg);
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "SMTP",
      error: msg,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver 3: Resend API (fallback)
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaResend(
  options: SendEmailOptions,
  apiKey: string
): Promise<SendEmailResult> {
  const resend = new Resend(apiKey);
  const senderName = process.env.NEXT_PUBLIC_STORE_NAME || "Toko Kami";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    `${senderName} <onboarding@resend.dev>`;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to.trim(),
      replyTo: options.replyTo || PLATFORM_TEST_INBOX,
      subject: options.subject,
      html: options.html,
    });

    if (!result.error) {
      return {
        success: true,
        isSimulated: false,
        deliveredTo: options.to.trim(),
        provider: "RESEND",
      };
    }

    // Sandbox restriction — redirect ke inbox platform
    const isSandbox =
      result.error.name === "validation_error" ||
      (result.error.message || "").includes("only send testing emails");

    if (isSandbox) {
      console.warn(
        `[Email Service] Resend sandbox: mengalihkan ke ${PLATFORM_TEST_INBOX}`
      );
      const notice = `
        <div style="background:#fffbeb;border:2px dashed #f59e0b;padding:14px 18px;border-radius:8px;margin-bottom:22px;font-size:13px;color:#92400e">
          <strong>⚠️ CATATAN SANDBOX:</strong><br/>
          Email ini aslinya ditujukan ke <strong>${options.to}</strong>.<br/>
          Resend sandbox mengalihkan ke inbox platform: <code>${PLATFORM_TEST_INBOX}</code>
        </div>
      `;
      const fallback = await resend.emails.send({
        from: fromEmail,
        to: PLATFORM_TEST_INBOX,
        replyTo: options.to.trim(),
        subject: `[SIMULASI: ${options.to}] ${options.subject}`,
        html: `${notice}${options.html}`,
      });
      if (!fallback.error) {
        return {
          success: true,
          isSimulated: true,
          deliveredTo: `${PLATFORM_TEST_INBOX} (Simulasi: ${options.to})`,
          provider: "RESEND",
        };
      }
    }

    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "RESEND",
      error: result.error.message,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kesalahan internal Resend";
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "RESEND",
      error: msg,
    };
  }
}
