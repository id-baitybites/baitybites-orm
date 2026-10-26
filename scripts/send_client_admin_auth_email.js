require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function sendAuthEmail() {
  const args = process.argv.slice(2);
  const recipientEmail = args[0] || process.env.CLIENT_ADMIN_EMAIL;
  const contactName = args[1] || process.env.CLIENT_CONTACT_NAME || "Mitra Klien";
  const businessName = args[2] || process.env.CLIENT_BUSINESS_NAME || "Toko Mitra";
  const username = args[3] || process.env.CLIENT_ADMIN_USERNAME || "admin.toko";
  const rawPassword = args[4] || process.env.CLIENT_ADMIN_PASSWORD || "GantiPasswordSaatLogin2026!";
  const pin = args[5] || process.env.CLIENT_ADMIN_PIN || "1234";

  if (!recipientEmail) {
    console.error("[Error] Mohon sertakan email penerima sebagai argumen: node scripts/send_client_admin_auth_email.js <email> [contactName] [businessName] [username] [password] [pin]");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://baitybites-orm.vercel.app";
  const loginUrl = `${baseUrl}/admin?from=%2Fonboarding`;
  const platformEmail = process.env.PLATFORM_SUPPORT_EMAIL || "id.baitybites@gmail.com";
  const supportPhone = process.env.SUPPORT_WHATSAPP_PHONE || "0812-9876-5432";

  const emailSubject = `Kredensial Otentikasi Resmi Client Admin — ${businessName} [Baitybites ORM]`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 28px 32px; color: #ffffff;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.18); display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 400; margin-bottom: 6px;">
          Kredensial Akses Klien
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 700;">Aktivasi Akun Client Admin</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Bisnis: <strong>${businessName}</strong> &bull; Peran: <strong>Client Super Admin</strong></p>
      </div>

      <div style="padding: 28px 32px; color: #0f172a; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Halo <strong>${contactName}</strong>,</p>
        <p>Akun resmi otentikasi administrator Anda untuk mengelola platform toko <strong>${businessName}</strong> telah aktif dan terdaftar secara sah di database sistem Baitybites ORM.</p>
        
        <p>Sebelum melakukan konfigurasi brand dan katalog pada wizard onboarding, silakan lakukan proses autentikasi login terlebih dahulu menggunakan kredensial resmi di bawah ini:</p>

        <!-- KOTAK KREDENSIAL OTENTIKASI -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; font-size: 14px; color: #312e81; text-transform: uppercase; letter-spacing: 0.05em;">Kredensial Login Client Admin Anda:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 160px;">Portal Login:</td>
              <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #4f46e5; font-weight: 400;">${baseUrl}/admin</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Username:</td>
              <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${username}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Password Sementara:</td>
              <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${rawPassword}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Security PIN Kasir:</td>
              <td style="padding: 6px 0;"><code style="background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-weight: 700; color: #0f172a;">${pin}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Hak Akses / Role:</td>
              <td style="padding: 6px 0; font-weight: 400; color: #059669;">SUPER_ADMIN (Pemilik Toko)</td>
            </tr>
          </table>
        </div>

        <!-- TOMBOL CTA LOGIN -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
            Login Sebagai Client Admin &amp; Lanjut Onboarding &rarr;
          </a>
          <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
            Tautan Login: <a href="${loginUrl}" style="color: #4f46e5; word-break: break-all;">${loginUrl}</a>
          </p>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; font-size: 13px; color: #1e40af; text-transform: uppercase;">Alur Otentikasi &amp; Setup:</h4>
          <ol style="margin: 0; padding-left: 18px; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
            <li>Klik tombol login di atas dan masukkan username serta password Anda.</li>
            <li>Setelah terotentikasi, sistem akan langsung mengenali Anda sebagai Client Admin <strong>${businessName}</strong>.</li>
            <li>Sesi terotentikasi akan membawa Anda ke Wizard Onboarding untuk mengatur logo, tema warna toko, dan menu produk.</li>
            <li>Demi keamanan, Anda disarankan langsung mengganti password sementara melalui menu Profil / Pengaturan Akun setelah login.</li>
          </ol>
        </div>

        <p style="margin: 20px 0 0; font-size: 13px; color: #64748b;">
          Jika Anda mengalami kendala saat melakukan login atau verifikasi, hubungi tim dukungan kami di <a href="mailto:${platformEmail}" style="color: #4f46e5;">${platformEmail}</a> atau WhatsApp support di <strong>${supportPhone}</strong>.
        </p>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} <strong>Baitybites ORM</strong> &bull; Security &amp; Identity Division
      </div>
    </div>
  `;

  const emailApiKey = (process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY)?.trim();
  if (!emailApiKey) {
    console.error("[Error] API Key transactional email tidak ditemukan di environment.");
    process.exit(1);
  }

  const payload = {
    sender: { name: "Baitybites ORM Security", email: platformEmail },
    to: [{ email: recipientEmail }],
    replyTo: { email: platformEmail },
    subject: emailSubject,
    htmlContent: emailHtml,
  };

  console.log(`[Info] Mengirim kredensial client admin via Email Gateway ke ${recipientEmail}...`);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": emailApiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const resData = await response.json();
  if (response.ok) {
    console.log(`[Success] Email berhasil dikirim ke ${recipientEmail} (HTTP ${response.status})`);
  } else {
    console.error(`[Error] Gagal mengirim email (HTTP ${response.status}):`, resData?.message || resData);
  }
}

sendAuthEmail().catch((err) => {
  console.error("[Fatal Error]:", err?.message || err);
});
