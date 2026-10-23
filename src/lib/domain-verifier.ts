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
  "cname.baitybites.site",
];

const RECOMMENDED_CNAME = "cname.baitybites.site";

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
      recommendedCname: RECOMMENDED_CNAME,
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
        recommendedCname: RECOMMENDED_CNAME,
        status: "VERIFIED",
        message: `Domain '${cleanDomain}' berhasil terverifikasi dan mengarah ke cluster server Baitybites.`,
      };
    } else {
      return {
        domain: cleanDomain,
        isValidFormat: true,
        isConfigured: false,
        cnameTargets: cnameRecords,
        recommendedCname: RECOMMENDED_CNAME,
        status: "PENDING_DNS",
        message: `CNAME terdeteksi (${cnameRecords.join(", ")}), namun belum mengarah ke '${RECOMMENDED_CNAME}'.`,
      };
    }
  } catch (dnsErr: any) {
    // Jika CNAME belum dipasang atau DNS belum propagate
    return {
      domain: cleanDomain,
      isValidFormat: true,
      isConfigured: false,
      cnameTargets: [],
      recommendedCname: RECOMMENDED_CNAME,
      status: "PENDING_DNS",
      message: `Rekord DNS CNAME untuk '${cleanDomain}' belum terdeteksi. Silakan pasang CNAME mengarah ke '${RECOMMENDED_CNAME}' di panel DNS registrar Anda.`,
    };
  }
}
