"use server";

import { revalidatePath } from "next/cache";
import { Client } from "pg";
import * as bcrypt from "bcryptjs";
import { sendEmailWithFallback } from "@/lib/email-service";
import { db } from "@/lib/db";
import { provisionClientDatabaseBranch } from "@/lib/neon-branch";

export interface ProvisionRequest {
  clientName: string;
  clientEmail?: string;
  brandSlug: string;
  targetOrgOrUser: string;
  templateRepo: string;
  isPrivate: boolean;
  githubToken?: string;
  databaseUrlPreset?: string;
  directUrlPreset?: string;
}

export interface ProvisionResult {
  success: boolean;
  repoUrl?: string;
  cloneCommand?: string;
  vscodeDevUrl?: string;
  directTemplateUrl?: string;
  onboardingUrl?: string;
  envPreset?: string;
  emailSent?: boolean;
  emailRecipient?: string;
  schemaCreated?: boolean;
  schemaName?: string;
  message?: string;
  error?: string;
}

/**
 * Server Action: Provisioning Client Repository
 * 1. Membuat schema PostgreSQL terisolasi khusus di Neon Database
 * 2. Meng-generate repository dari template master di GitHub
 * 3. Mengirimkan kredensial & preset .env otomatis ke email klien via Brevo
 */
export async function provisionClientRepository(
  payload: ProvisionRequest
): Promise<ProvisionResult> {
  try {
    const cleanSlug = payload.brandSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");

    if (!cleanSlug) {
      return { success: false, error: "Slug nama repo brand wajib diisi." };
    }

    const templateRepo = payload.templateRepo.trim() || "id-baitybites/baitybites-orm";
    const [templateOwner, templateName] = templateRepo.split("/");

    const token = payload.githubToken?.trim() || process.env.GITHUB_PROVISION_TOKEN;
    const targetOwner = payload.targetOrgOrUser.trim() || "id-baitybites";

    // Format env preset untuk instance toko klien dengan skema database terisolasi
    const sanitizedSlugUnderscore = cleanSlug.replace(/-/g, "_");

    let clientDbUrl = process.env.DATABASE_URL?.trim() || "";
    if (clientDbUrl) {
      if (clientDbUrl.includes("schema=")) {
        clientDbUrl = clientDbUrl.replace(/schema=[^&]+/, `schema=${sanitizedSlugUnderscore}`);
      } else if (clientDbUrl.includes("?")) {
        clientDbUrl = `${clientDbUrl}&schema=${sanitizedSlugUnderscore}`;
      } else {
        clientDbUrl = `${clientDbUrl}?schema=${sanitizedSlugUnderscore}`;
      }
    } else {
      clientDbUrl = `postgresql://db_user:password@neon.tech/neondb?sslmode=require&schema=${sanitizedSlugUnderscore}`;
    }

    const clientDirectUrl =
      process.env.DIRECT_URL?.trim() ||
      "postgresql://db_user:password@neon.tech/neondb?sslmode=require";

    // Masking kredensial sensitif untuk tampilan browser & email klien
    const maskSecret = (url: string) => url.replace(/:\/\/[^:]+:([^@]+)@/, "://neondb_owner:••••••••@");

    const envPreset = `# === KONFIGURASI INSTANCE CLIENT: ${payload.clientName.toUpperCase()} ===
NEXT_PUBLIC_STORE_NAME="${payload.clientName}"
NEXT_PUBLIC_APP_URL="https://${cleanSlug}.baitybites.site"
NEXT_PUBLIC_WHATSAPP_PHONE="081298765432"

# Database Dedicated (Skema: ${sanitizedSlugUnderscore})
# Kredensial dikelola otomatis dan aman di server environment
DATABASE_URL="${maskSecret(clientDbUrl)}"
DIRECT_URL="${maskSecret(clientDirectUrl)}"

# Kredensial Admin Kasir & Dapur Toko
STORE_ADMIN_PIN="1234"
`;

    // 1. Eksekusi Pembuatan Dedicated Branch / Skema Database Terisolasi di Neon PostgreSQL
    let schemaCreated = false;
    try {
      await provisionClientDatabaseBranch(cleanSlug, { isEnterprise: true });
    } catch (branchErr: any) {
      console.warn("Neon branch provisioning notice:", branchErr?.message);
    }

    if (process.env.DIRECT_URL) {
      try {
        const dbClient = new Client({
          connectionString: process.env.DIRECT_URL,
          ssl: { rejectUnauthorized: false },
        });
        await dbClient.connect();
        await dbClient.query(`CREATE SCHEMA IF NOT EXISTS "${sanitizedSlugUnderscore}"`);
        await dbClient.end();
        schemaCreated = true;
      } catch (dbErr: any) {
        console.warn("Neon DB schema provision notice:", dbErr?.message);
      }
    }

    // 2. Eksekusi otomatis via GitHub REST API jika token tersedia
    let finalRepoUrl = `https://github.com/${targetOwner}/${cleanSlug}`;
    let finalCloneCommand = `git clone ${finalRepoUrl}.git`;
    let finalVscodeDevUrl = `https://vscode.dev/github/${targetOwner}/${cleanSlug}`;
    let successMessage = `Repository klien '${cleanSlug}' siap digunakan!`;

    if (token && templateOwner && templateName) {
      try {
        const isSelfUser = !targetOwner || targetOwner === "id-baitybites";

        const requestBody: { name: string; description: string; private: boolean; owner?: string } = {
          name: cleanSlug,
          description: `Dedicated White-Label Client Instance for ${payload.clientName}`,
          private: payload.isPrivate,
        };

        if (!isSelfUser) {
          requestBody.owner = targetOwner;
        }

        const ghResponse = await fetch(
          `https://api.github.com/repos/${templateOwner}/${templateName}/generate`,
          {
            method: "POST",
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${token}`,
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
              "User-Agent": "Baitybites-ORM-Provisioner",
            },
            body: JSON.stringify(requestBody),
          }
        );

        const ghData = await ghResponse.json();

        if (ghResponse.ok && ghData.html_url) {
          finalRepoUrl = ghData.html_url;
          finalCloneCommand = `git clone ${ghData.clone_url || finalRepoUrl + ".git"}`;
          finalVscodeDevUrl = `https://vscode.dev/github/${ghData.full_name}`;
          successMessage = `Repository klien '${ghData.full_name}' berhasil dibuat secara otomatis di GitHub!`;
        } else {
          // Jika target org tidak ditemukan (misal: baitybites-clients), coba fallback buat di akun personal id-baitybites
          if (!isSelfUser && (ghResponse.status === 404 || ghResponse.status === 422)) {
            const retryRes = await fetch(
              `https://api.github.com/repos/${templateOwner}/${templateName}/generate`,
              {
                method: "POST",
                headers: {
                  Accept: "application/vnd.github+json",
                  Authorization: `Bearer ${token}`,
                  "X-GitHub-Api-Version": "2022-11-28",
                  "Content-Type": "application/json",
                  "User-Agent": "Baitybites-ORM-Provisioner",
                },
                body: JSON.stringify({
                  name: cleanSlug,
                  description: `Dedicated White-Label Client Instance for ${payload.clientName}`,
                  private: payload.isPrivate,
                }),
              }
            );

            const retryData = await retryRes.json();
            if (retryRes.ok && retryData.html_url) {
              finalRepoUrl = retryData.html_url;
              finalCloneCommand = `git clone ${retryData.clone_url || finalRepoUrl + ".git"}`;
              finalVscodeDevUrl = `https://vscode.dev/github/${retryData.full_name}`;
              successMessage = `Repositori berhasil dibuat di akun utama vendor (${retryData.full_name})!`;
            }
          }
        }
      } catch (apiErr: any) {
        console.warn("GitHub API fetch failure:", apiErr?.message);
      }
    }

    // 3. Auto-Generate Akun Client Admin & Pengiriman Email Kredensial via Brevo
    let emailSent = false;
    let emailRecipient: string | undefined = undefined;

    const clientAdminUsername = `admin.${cleanSlug}`;
    const clientAdminPassword = `${cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)}2026!#`;
    const clientAdminPin = "1234";

    try {
      const existingAdmin = await db.admin.findUnique({
        where: { username: clientAdminUsername },
      });
      const passwordHash = await bcrypt.hash(clientAdminPassword, 10);
      const pinHash = await bcrypt.hash(clientAdminPin, 10);
      if (!existingAdmin) {
        await db.admin.create({
          data: {
            id: `adm-client-${cleanSlug}`,
            username: clientAdminUsername,
            displayName: `Admin ${payload.clientName}`,
            passwordHash,
            pinHash,
            role: "SUPER_ADMIN",
            isActive: true,
            createdBy: "PLATFORM_PROVISION",
          },
        });
      } else {
        await db.admin.update({
          where: { username: clientAdminUsername },
          data: {
            passwordHash,
            pinHash,
            isActive: true,
          },
        });
      }
    } catch (adminErr: any) {
      console.warn("Notice: could not ensure client admin account in db:", adminErr?.message);
    }

    if (payload.clientEmail?.trim()) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://baitybites-orm.vercel.app";
        const loginUrl = `${baseUrl}/admin?from=%2Fonboarding`;

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 26px 32px; color: #ffffff;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.18); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
                Aktivasi Akun &amp; Instance
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Instance Siap &amp; Kredensial Client Admin</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Bisnis: <strong>${payload.clientName}</strong> &bull; Peran: <strong>Client Super Admin</strong></p>
            </div>

            <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0;">Halo Tim <strong>${payload.clientName}</strong>,</p>
              <p>Selamat! Instance sistem e-commerce dan operasional restoran Anda telah berhasil disiapkan di platform Baitybites ORM.</p>

              <!-- KOTAK KREDENSIAL OTENTIKASI RESMI -->
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #312e81; text-transform: uppercase; letter-spacing: 0.05em;">Kredensial Otentikasi Client Admin:</h3>
                <p style="margin: 0 0 10px; font-size: 12px; color: #64748b;">
                  Gunakan kredensial resmi di bawah ini untuk autentikasi sebelum masuk ke wizard onboarding setup toko:
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 160px;">Portal Login:</td>
                    <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #4f46e5; font-weight: 400;">${baseUrl}/admin</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Username:</td>
                    <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${clientAdminUsername}</code></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Password Sementara:</td>
                    <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${clientAdminPassword}</code></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Security PIN Kasir:</td>
                    <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${clientAdminPin}</code></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Hak Akses / Role:</td>
                    <td style="padding: 6px 0; font-weight: 400; color: #059669;">SUPER_ADMIN (Owner Toko)</td>
                  </tr>
                </table>
              </div>

              <!-- CTA LOGIN OTENTIKASI & ONBOARDING -->
              <div style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 10px; padding: 22px; margin: 24px 0; text-align: center;">
                <h3 style="margin: 0 0 6px; font-size: 16px; color: #3730a3;">🔐 Autentikasi &amp; Lanjut Onboarding Toko</h3>
                <p style="margin: 0 0 16px; font-size: 13px; color: #4338ca;">Demi keamanan sistem, Anda diwajibkan melakukan autentikasi login terlebih dahulu sebelum masuk ke Wizard Setup Brand dan Menu:</p>
                <a href="${loginUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 30px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
                  🔐 Login Client Admin &amp; Setup Toko &rarr;
                </a>
                <p style="margin: 12px 0 0; font-size: 12px; color: #6366f1;">
                  Tautan login resmi: <a href="${loginUrl}" style="color: #4f46e5; word-break: break-all;">${loginUrl}</a>
                </p>
              </div>

              <!-- DETAIL REPOSITORI & ENVIRONMENT -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">Detail Repositori Dedicated:</h3>
                <p style="margin: 0 0 8px;"><strong>URL Repositori GitHub:</strong><br />
                  <a href="${finalRepoUrl}" style="color: #0284c7; word-break: break-all;">${finalRepoUrl}</a>
                </p>
                <p style="margin: 0 0 8px;"><strong>Perintah Kloning Git:</strong><br />
                  <code style="background: #ffffff; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; display: block; margin-top: 4px; font-size: 12px; word-break: break-all;">${finalCloneCommand}</code>
                </p>
                <p style="margin: 0 0 8px;"><strong>Editor Cloud Instan (Tanpa Install):</strong><br />
                  <a href="${finalVscodeDevUrl}" style="color: #0284c7; font-weight: 400;">Buka Langsung di VS Code Web (vscode.dev) &rarr;</a>
                </p>
              </div>

              <div style="background: #fdfbf7; border: 1px solid #fed7aa; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px; font-size: 14px; color: #ea580c; text-transform: uppercase; letter-spacing: 0.05em;">Konfigurasi Lingkungan Database (.env):</h3>
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Skema Database:</strong> <code style="background: #ffffff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;">${sanitizedSlugUnderscore}</code> (Terisolasi di Neon PostgreSQL)</p>
                <pre style="background: #ffffff; padding: 12px; border: 1px solid #fed7aa; border-radius: 6px; font-size: 11px; overflow-x: auto; margin-top: 10px; color: #334155;">${envPreset}</pre>
              </div>

              <div style="margin: 26px 0 16px;">
                <p style="margin: 0 0 6px; font-weight: 400;">Alur Otentikasi &amp; Setup:</p>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                  <li>Klik tombol <strong>Login Client Admin</strong> di atas dan masukkan username serta password resmi Anda.</li>
                  <li>Setelah terotentikasi, sistem akan mengarahkan Anda ke Wizard Setup &amp; Onboarding untuk melengkapi nama brand, warna visual, dan menu toko Anda.</li>
                  <li>Untuk keamanan, Anda dapat mengganti password sementara melalui menu Pengaturan setelah onboarding selesai.</li>
                </ol>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Email ini dikirim secara otomatis oleh <strong>Baitybites ORM Platform Security &amp; Provisioning Engine</strong> kepada mitra bisnis terdaftar.
              </p>
            </div>
          </div>
        `;

        const emailSendResult = await sendEmailWithFallback({
          to: payload.clientEmail.trim(),
          subject: `🔐 Kredensial Otentikasi Resmi Client Admin & Akses Onboarding Toko — ${payload.clientName}`,
          html: emailHtml,
        });

        if (emailSendResult.success) {
          emailSent = true;
          emailRecipient = emailSendResult.deliveredTo;
        }
      } catch (mailErr: any) {
        console.warn("Brevo automated provision email notice:", mailErr?.message);
      }
    }

    // Update status lead di database menjadi PROVISIONED jika email cocok
    if (payload.clientEmail?.trim()) {
      try {
        const matchedLead = await db.clientLead.findFirst({
          where: { email: payload.clientEmail.trim() },
        });
        if (matchedLead) {
          await db.clientLead.update({
            where: { id: matchedLead.id },
            data: {
              status: "PROVISIONED",
              brandSlug: cleanSlug,
              repoUrl: finalRepoUrl,
              dbSchemaName: sanitizedSlugUnderscore,
              provisionedAt: new Date(),
            },
          });
        }
      } catch (dbErr: any) {
        console.warn("Notice: could not update client lead status after provision:", dbErr?.message);
      }
    }

    revalidatePath("/settings/provision");
    revalidatePath("/settings/leads");
    revalidatePath("/platform/console");

    return {
      success: true,
      repoUrl: finalRepoUrl,
      cloneCommand: finalCloneCommand,
      vscodeDevUrl: finalVscodeDevUrl,
      directTemplateUrl: `https://github.com/${templateRepo}/generate`,
      onboardingUrl: `/onboarding`,
      envPreset,
      emailSent,
      emailRecipient,
      schemaCreated,
      schemaName: sanitizedSlugUnderscore,
      message: successMessage,
    };
  } catch (error: any) {
    console.error("provisionClientRepository error:", error);
    return {
      success: false,
      error: error?.message || "Gagal membuat generator repository klien.",
    };
  }
}
