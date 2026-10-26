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
  provider: "HTTP_API" | "SMTP_RELAY";
  error?: string;
}

const PLATFORM_EMAIL =
  process.env.STORE_EMAIL ||
  process.env.SMTP_FROM_EMAIL ||
  "id.baitybites@gmail.com";

/**
 * Universal Email Dispatcher — Dual-Channel Transactional Provider:
 * 1. HTTP API (POST ke endpoint email provider) -> Pengiriman langsung ke email tujuan
 * 2. SMTP Relay (fallback otomatis jika HTTP API ada gangguan)
 */
export async function sendEmailWithFallback(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const errors: string[] = [];

  // ── 1. Kirim via HTTP API (Utama) ────────────────────────────────────────
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  if (brevoApiKey && !brevoApiKey.startsWith("xkeysib-REPLACE")) {
    const result = await sendViaHTTPAPI(options, brevoApiKey);
    if (result.success) return result;
    console.warn("[Email Service] HTTP API gagal, mencoba SMTP Relay...", result.error);
    if (result.error) errors.push(`HTTP API: ${result.error}`);
  } else {
    errors.push("Kunci API email transaksional belum dikonfigurasi.");
  }

  // ── 2. Kirim via SMTP Relay (Fallback) ────────────────────────────────────
  const smtpUser = process.env.SMTP_USER?.trim() || "a2bf9a001@smtp-brevo.com";
  const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)?.trim();
  if (smtpPass) {
    const result = await sendViaSMTPRelay(options, smtpUser, smtpPass);
    if (result.success) return result;
    console.warn("[Email Service] SMTP Relay gagal:", result.error);
    if (result.error) errors.push(`SMTP Relay: ${result.error}`);
  } else {
    errors.push("Kredensial SMTP Relay belum dikonfigurasi.");
  }

  return {
    success: false,
    isSimulated: false,
    deliveredTo: "",
    provider: "HTTP_API",
    error: errors.join(" | ") || "Layanan pengiriman email tidak dapat dijangkau.",
  };
}

/**
 * Driver 1: HTTP API
 */
async function sendViaHTTPAPI(
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
        `[Email Service - HTTP API] Email berhasil terkirim ke ${options.to} | Message ID: ${data.messageId}`
      );
      return {
        success: true,
        isSimulated: false,
        deliveredTo: options.to.trim(),
        provider: "HTTP_API",
      };
    }

    const errMsg =
      (data.message as string) || `HTTP ${response.status}: ${JSON.stringify(data)}`;
    console.error("[Email Service - HTTP API Error]:", errMsg);
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "HTTP_API",
      error: `Email API: ${errMsg}`,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Kesalahan jaringan Email API";
    console.error("[Email Service - HTTP API Exception]:", msg);
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "HTTP_API",
      error: msg,
    };
  }
}

/**
 * Driver 2: SMTP Relay via Nodemailer
 */
async function sendViaSMTPRelay(
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

    console.log(`[Email Service - SMTP Relay] Email berhasil terkirim via SMTP ke ${options.to}`);
    return {
      success: true,
      isSimulated: false,
      deliveredTo: options.to.trim(),
      provider: "SMTP_RELAY",
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Kesalahan pengiriman SMTP Relay";
    console.error("[Email Service - SMTP Relay Error]:", msg);
    return {
      success: false,
      isSimulated: false,
      deliveredTo: "",
      provider: "SMTP_RELAY",
      error: msg,
    };
  }
}
