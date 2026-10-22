import dns from "dns";

export interface DomainCheckResult {
  domain: string;
  isValidFormat: boolean;
  isConfigured: boolean;
  cnameTargets: string[];
  recommendedCname: string;
  status: "VERIFIED" | "PENDING_DNS" | "INVALID_DOMAIN";
  message: string;
}

const EXPECTED_CNAME_TARGETS = [
  "cname.vercel-dns.com",
  "baitybites.site",
  "instance.baitybites.site",
];

/**
 * Validasi sintaks format nama domain
 */
export function validateDomainFormat(domain: string): boolean {
  if (!domain || typeof domain !== "string") return false;
  const clean = domain.trim().toLowerCase();
  // Validasi domain e.g. resto.com, order.kateringku.id
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(clean);
}

/**
 * Verifikasi DNS CNAME record untuk Custom Domain klien secara real-time
 */
export async function verifyCustomDomainDns(domain: string): Promise<DomainCheckResult> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const isValidFormat = validateDomainFormat(cleanDomain);

  if (!isValidFormat) {
    return {
      domain: cleanDomain,
      isValidFormat: false,
      isConfigured: false,
      cnameTargets: [],
      recommendedCname: "cname.vercel-dns.com",
      status: "INVALID_DOMAIN",
      message: `Format nama domain '${cleanDomain}' tidak valid. Pastikan tanpa http:// atau garis miring.`,
    };
  }

  try {
    const cnameRecords = await dns.promises.resolveCname(cleanDomain);
    const matchesTarget = cnameRecords.some((record) =>
      EXPECTED_CNAME_TARGETS.some((target) => record.toLowerCase().includes(target))
    );

    if (matchesTarget) {
      return {
        domain: cleanDomain,
        isValidFormat: true,
        isConfigured: true,
        cnameTargets: cnameRecords,
        recommendedCname: "cname.vercel-dns.com",
        status: "VERIFIED",
        message: `Domain '${cleanDomain}' berhasil terverifikasi dan mengarah ke cluster server Baitybites.`,
      };
    } else {
      return {
        domain: cleanDomain,
        isValidFormat: true,
        isConfigured: false,
        cnameTargets: cnameRecords,
        recommendedCname: "cname.vercel-dns.com",
        status: "PENDING_DNS",
        message: `CNAME terdeteksi (${cnameRecords.join(", ")}), namun belum mengarah ke 'cname.vercel-dns.com'.`,
      };
    }
  } catch (dnsErr: any) {
    // Jika CNAME belum dipasang atau DNS belum propagate
    return {
      domain: cleanDomain,
      isValidFormat: true,
      isConfigured: false,
      cnameTargets: [],
      recommendedCname: "cname.vercel-dns.com",
      status: "PENDING_DNS",
      message: `Rekord DNS CNAME untuk '${cleanDomain}' belum terdeteksi. Silakan pasang CNAME mengarah ke 'cname.vercel-dns.com' di panel DNS registrar Anda.`,
    };
  }
}
