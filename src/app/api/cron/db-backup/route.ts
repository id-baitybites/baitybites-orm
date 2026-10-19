import { NextResponse } from "next/server";
import { createDatabaseSnapshot } from "@/lib/backup-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verifikasi secret Vercel Cron jika diset
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  console.log("[CRON] Memicu database snapshot harian otomatis...");
  const result = await createDatabaseSnapshot();

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        executedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Snapshot database harian berhasil disimpan.",
    filename: result.filename,
    size: result.sizeFormatted,
    counts: result.counts,
    executedAt: new Date().toISOString(),
  });
}
