<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Aturan Pengembangan & Konten Baitybites ORM

## 1. Larangan Penggunaan Emoji & Karakter Simbol
- **Dilarang keras** menggunakan emoji atau karakter simbol unicode (misal: 🔐, 📎, ❌, 📞, 👑, 🏪, 🍳, 🧾, ✨, dsb.) pada seluruh konten aplikasi.
- Larangan ini berlaku untuk semua teks UI, modal dialog, formulir input/select, status feedback, pesan error/toast, judul, subjek email, dan template body email transaksional.
- Setiap elemen visual ikonik **wajib** menggunakan komponen resmi dari **Hugeicons** (`@hugeicons/core-free-icons` dan `@hugeicons/react` via `<HugeiconsIcon icon={...} />`).
- Untuk pesan status, validasi, dan feedback sistem, gunakan kalimat deskriptif yang bersih dan profesional tanpa imbuhan simbol/emoji.

## 2. Sanitasi Branding & Provider Pihak Ketiga
- Jangan menyertakan nama merk dagang, vendor, atau provider eksternal (misal: Vercel, Neon, Brevo, GitHub, AWS, Supabase, dsb.) pada teks yang dapat diakses pengguna atau klien (UI, email, label input, error message, atau dokumen publik).
- Gunakan terminologi arsitektur generik (misal: *Platform Hosting*, *Dedicated Database Branch*, *Cloud Database*, *Email Gateway / Transactional Email*, *Repositori Kode Klien*, *CI/CD Pipeline*).
- Gunakan domain resmi proyek (`baitybites.site`) untuk tautan publik, bukan subdomain default vendor (misal `.vercel.app`).
