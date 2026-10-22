import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatcher";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/webhooks/test
 * Menguji pengiriman event webhook uji coba ke URL endpoint tertentu.
 */
export async function POST(req: NextRequest) {
  const auth = validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { targetUrl, signingSecret } = body;

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Parameter 'targetUrl' wajib diisi." },
        { status: 400 }
      );
    }

    const testPayload = {
      test: true,
      message: "Ping uji coba integrasi Webhook Baitybites ORM Enterprise",
      dispatchedAt: new Date().toISOString(),
    };

    const result = await dispatchWebhookEvent("order.created", testPayload, {
      customTargetUrl: targetUrl,
      signingSecret: signingSecret || undefined,
    });

    return NextResponse.json({
      success: result.sent,
      targetUrl: result.targetUrl,
      statusCode: result.statusCode,
      error: result.error,
      message: result.sent
        ? `Event webhook berhasil dikirim ke '${targetUrl}' (HTTP ${result.statusCode}).`
        : `Gagal mengirim webhook: ${result.error}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses uji coba webhook" },
      { status: 500 }
    );
  }
}
