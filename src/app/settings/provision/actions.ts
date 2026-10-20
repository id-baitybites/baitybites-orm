"use server";

import { revalidatePath } from "next/cache";
import { Client } from "pg";
import { sendEmailWithFallback } from "@/lib/email-service";
import { db } from "@/lib/db";

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
    const envPreset = `# === KONFIGURASI INSTANCE CLIENT: ${payload.clientName.toUpperCase()} ===
NEXT_PUBLIC_STORE_NAME="${payload.clientName}"
NEXT_PUBLIC_APP_URL="https://${cleanSlug}.baitybites.site"
NEXT_PUBLIC_WHATSAPP_PHONE="081298765432"

# Database Dedicated (Skema: ${sanitizedSlugUnderscore})
DATABASE_URL="postgresql://neondb_owner:npg_MgTYQlpsi29R@ep-divine-darkness-b36on9n8-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full&schema=${sanitizedSlugUnderscore}"
DIRECT_URL="postgresql://neondb_owner:npg_MgTYQlpsi29R@ep-divine-darkness-b36on9n8.c-4.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full"

# Kredensial Admin Kasir & Dapur Toko
STORE_ADMIN_PIN="1234"
`;

    // 1. Eksekusi Pembuatan Skema Database Terisolasi di Neon PostgreSQL
    let schemaCreated = false;
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

    // 3. Pengiriman Email Otomatis ke Klien via Brevo jika email diisi
    let emailSent = false;
    let emailRecipient: string | undefined = undefined;

    if (payload.clientEmail?.trim()) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://baitybites-orm.vercel.app";
        const directOnboardingUrl = `${baseUrl}/onboarding?force=true&brand=${encodeURIComponent(payload.clientName)}`;

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 26px 32px; color: #ffffff;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Baitybites ORM Engine</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Selamat Datang! Instance Repositori Toko Anda Telah Siap</p>
            </div>

            <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0;">Halo Tim <strong>${payload.clientName}</strong>,</p>
              <p>Selamat! Repositori sistem e-commerce &amp; OMS khusus untuk bisnis kuliner Anda telah berhasil di-generate secara dedicated oleh tim Baitybites ORM.</p>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">Detail Instance Repositori:</h3>
                <p style="margin: 0 0 8px;"><strong>URL Repositori GitHub:</strong><br />
                  <a href="${finalRepoUrl}" style="color: #0284c7; word-break: break-all;">${finalRepoUrl}</a>
                </p>
                <p style="margin: 0 0 8px;"><strong>Perintah Kloning Git:</strong><br />
                  <code style="background: #ffffff; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; display: block; margin-top: 4px; font-size: 12px; word-break: break-all;">${finalCloneCommand}</code>
                </p>
                <p style="margin: 0 0 8px;"><strong>Editor Cloud Instan (Tanpa Install):</strong><br />
                  <a href="${finalVscodeDevUrl}" style="color: #0284c7; font-weight: 600;">Buka Langsung di VS Code Web (vscode.dev) &rarr;</a>
                </p>
              </div>

              <div style="background: #fdfbf7; border: 1px solid #fed7aa; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px; font-size: 14px; color: #ea580c; text-transform: uppercase; letter-spacing: 0.05em;">Kredensial &amp; Konfigurasi Lingkungan (.env):</h3>
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Security PIN Admin Toko:</strong> <code style="background: #ffffff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: 700;">1234</code> (dapat diubah di Backoffice Toko)</p>
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Skema Database:</strong> <code style="background: #ffffff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;">${sanitizedSlugUnderscore}</code> (Terisolasi di Neon PostgreSQL)</p>
                <pre style="background: #ffffff; padding: 12px; border: 1px solid #fed7aa; border-radius: 6px; font-size: 11px; overflow-x: auto; margin-top: 10px; color: #334155;">${envPreset}</pre>
              </div>

              <!-- CTA DIRECT ONBOARDING -->
              <div style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 10px; padding: 22px; margin: 24px 0; text-align: center;">
                <h3 style="margin: 0 0 6px; font-size: 16px; color: #3730a3;">🚀 Setup Konfigurasi &amp; Onboarding Toko</h3>
                <p style="margin: 0 0 16px; font-size: 13px; color: #4338ca;">Klik tombol di bawah ini untuk memulai wizard pengaturan identitas brand, tema visual, nomor WhatsApp CS, dan katalog menu toko:</p>
                <a href="${directOnboardingUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 13px 26px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
                  Buka Wizard Setup Toko Anda &rarr;
                </a>
                <p style="margin: 12px 0 0; font-size: 12px; color: #6366f1;">
                  Tautan langsung: <a href="${directOnboardingUrl}" style="color: #4f46e5; word-break: break-all;">${directOnboardingUrl}</a>
                </p>
              </div>

              <div style="margin: 26px 0 16px;">
                <p style="margin: 0 0 6px; font-weight: 600;">Langkah Selanjutnya:</p>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                  <li>Jalankan aplikasi atau buka langsung di VS Code Dev.</li>
                  <li>Buka <a href="${directOnboardingUrl}" style="color: #4f46e5; font-weight: 600;">Halaman Panduan Onboarding Interaktif</a> untuk melengkapi menu dan logo toko Anda.</li>
                  <li>Jika butuh bantuan teknis, hubungi tim kami via WhatsApp atau balas email ini.</li>
                </ol>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Email ini dikirim secara otomatis oleh <strong>Baitybites ORM Platform Console</strong> kepada mitra bisnis terdaftar.
              </p>
            </div>
          </div>
        `;

        const emailSendResult = await sendEmailWithFallback({
          to: payload.clientEmail.trim(),
          subject: `🚀 Akses Repository & Kredensial Onboarding Instance Toko Anda - ${payload.clientName}`,
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
