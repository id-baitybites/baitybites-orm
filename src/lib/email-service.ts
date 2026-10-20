import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  isSimulated?: boolean;
  deliveredTo: string;
  provider: "BREVO" | "BREVO_SMTP";
  error?: string;
}

const PLATFORM_EMAIL =
  process.env.STORE_EMAIL ||
  process.env.SMTP_FROM_EMAIL ||
  "id.baitybites@gmail.com";

/**
 * Universal Email Dispatcher — Khusus Brevo (Dedicated Transactional Provider):
 * 1. Brevo HTTP API (POST https://api.brevo.com/v3/smtp/email) → Pengiriman langsung ke email tujuan
 * 2. Brevo SMTP Relay (smtp-relay.brevo.com:587) → Fallback otomatis jika HTTP API ada gangguan
 */
export async function sendEmailWithFallback(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  // ── 1. Kirim via Brevo HTTP API (Utama) ──────────────────────────────────
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  if (brevoApiKey && !brevoApiKey.startsWith("xkeysib-REPLACE")) {
    const result = await sendViaBrevoAPI(options, brevoApiKey);
    if (result.success) return result;
    console.warn("[Email Service] Brevo HTTP API gagal, mencoba Brevo SMTP...", result.error);
  }

  // ── 2. Kirim via Brevo SMTP Relay (Fallback) ────────────────────────────
  const smtpUser = process.env.SMTP_USER?.trim() || "a2bf9a001@smtp-brevo.com";
  const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)?.trim();
  if (smtpPass) {
    const result = await sendViaBrevoSMTP(options, smtpUser, smtpPass);
    if (result.success) return result;
    console.warn("[Email Service] Brevo SMTP gagal:", result.error);
  }

  return {
    success: false,
    isSimulated: false,
    deliveredTo: "",
    provider: "BREVO",
    error:
      "Layanan email Brevo belum terhubung. Pastikan BREVO_API_KEY terpasang di .env.",
  };
}

/**
 * Driver 1: Brevo HTTP API
 */
async function sendViaBrevoAPI(
  options: SendEmailOptions,
  apiKey: string
): Promise<SendEmailResult> {
  try {
    const senderName = process.env.NEXT_PUBLIC_STORE_NAME || "Baitybites ORM";
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
        `[Email Service - Brevo API] ✅ Email berhasil terkirim ke ${options.to} | Message ID: ${data.messageId}`
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

/**
 * Driver 2: Brevo SMTP Relay via Nodemailer
 */
async function sendViaBrevoSMTP(
  options: SendEmailOptions,
  smtpUser: string,
  smtpPass: string
): Promise<SendEmailResult> {
  try {
    const smtpHost = process.env.SMTP_HOST?.trim() || "smtp-relay.brevo.com";
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

    const senderName = process.env.NEXT_PUBLIC_STORE_NAME || "Baitybites ORM";
    await transporter.sendMail({
      from: `${senderName} <${PLATFORM_EMAIL}>`,
      to: options.to.trim(),
      replyTo: options.replyTo || PLATFORM_EMAIL,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email Service - Brevo SMTP] ✅ Email berhasil terkirim via SMTP ke ${options.to}`);
    return {
      success: true,
      isSimulated: false,
      deliveredTo: options.to.trim(),
      provider: "BREVO_SMTP",
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Kesalahan pengiriman Brevo SMTP";
    console.error("[Email Service - Brevo SMTP Error]:", msg);
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "BREVO_SMTP",
      error: msg,
    };
  }
}
