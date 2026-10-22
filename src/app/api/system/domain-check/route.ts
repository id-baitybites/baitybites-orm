import { NextRequest, NextResponse } from "next/server";
import { verifyCustomDomainDns } from "@/lib/domain-verifier";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Parameter 'domain' wajib diisi." }, { status: 400 });
    }

    const result = await verifyCustomDomainDns(domain);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal memproses verifikasi domain." },
      { status: 500 }
    );
  }
}
