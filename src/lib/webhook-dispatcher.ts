import crypto from "crypto";

export type WebhookEventType =
  | "order.created"
  | "order.status_updated"
  | "payment.confirmed"
  | "tenant.provisioned";

export interface WebhookPayload<T = any> {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: T;
}

export interface WebhookDispatchResult {
  sent: boolean;
  targetUrl: string;
  statusCode?: number;
  error?: string;
}

/**
 * Dispatch webhook event ke target URL klien dengan tanda tangan HMAC-SHA256
 */
export async function dispatchWebhookEvent<T = any>(
  event: WebhookEventType,
  data: T,
  options?: {
    customTargetUrl?: string;
    signingSecret?: string;
  }
): Promise<WebhookDispatchResult> {
  const targetUrl = options?.customTargetUrl || process.env.CLIENT_WEBHOOK_URL?.trim();
  const secret = options?.signingSecret || process.env.WEBHOOK_SIGNING_SECRET?.trim() || "baitybites_webhook_secret_key";

  if (!targetUrl) {
    return {
      sent: false,
      targetUrl: "",
      error: "Target webhook URL tidak dikonfigurasi (CLIENT_WEBHOOK_URL kosong).",
    };
  }

  const payload: WebhookPayload<T> = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Baitybites-Event": event,
        "X-Baitybites-Signature": `sha256=${signature}`,
        "User-Agent": "Baitybites-Webhook-Dispatcher/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return {
      sent: response.ok,
      targetUrl,
      statusCode: response.status,
      error: response.ok ? undefined : `Target server returned HTTP ${response.status}`,
    };
  } catch (err: any) {
    return {
      sent: false,
      targetUrl,
      error: err?.name === "AbortError" ? "Webhook delivery timeout (6s)" : err?.message,
    };
  }
}
