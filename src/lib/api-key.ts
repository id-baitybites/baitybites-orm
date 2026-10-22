import { NextRequest, NextResponse } from "next/server";

export interface ApiAuthResult {
  isAuthenticated: boolean;
  apiKeyName?: string;
  errorResponse?: NextResponse;
}

/**
 * Validasi otentikasi API Key untuk endpoint REST API publik v1
 * Menerima kunci dari header 'x-api-key' atau 'Authorization: Bearer <key>'
 */
export function validateApiKey(req: NextRequest): ApiAuthResult {
  const headerKey = req.headers.get("x-api-key");
  const authHeader = req.headers.get("authorization");
  const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const providedKey = (headerKey || bearerKey)?.trim();

  if (!providedKey) {
    return {
      isAuthenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "API Key diperlukan. Gunakan header 'x-api-key: <key>' atau 'Authorization: Bearer <key>'.",
        },
        { status: 401 }
      ),
    };
  }

  // Bandingkan dengan master API key platform atau fallback developer key
  const validMasterKeys = [
    process.env.PLATFORM_API_KEY?.trim(),
    process.env.ENTERPRISE_API_KEY?.trim(),
    process.env.INTERNAL_CRON_SECRET?.trim(),
    // Default development fallback jika belum diatur di .env
    "bb_live_enterprise_demo_secret",
  ].filter(Boolean) as string[];

  const isMatched = validMasterKeys.some((k) => k === providedKey);

  if (!isMatched) {
    return {
      isAuthenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "API Key tidak valid atau telah dicabut.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    isAuthenticated: true,
    apiKeyName: "Enterprise Client API Key",
  };
}
