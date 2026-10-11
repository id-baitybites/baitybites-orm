# 🏛️ PANDUAN REPOSITORY TEMPLATING (MASTER vs CLIENT INSTANCE)

Dokumen ini adalah spesifikasi arsitektur standar untuk menduplikasi dan mendistribusikan sistem **Exclusive White-Label E-Commerce & OMS** ke setiap klien baru secara independen.

---

## 1. Konsep Arsitektur: Master vs Client Repository

```text
┌────────────────────────────────────────────────────────┐
│               MASTER CORE REPOSITORY                   │
│   (Upstream: Engine, Next.js, Prisma, Security & OMS)  │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             │ Fork / Template Duplicate │
             ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   CLIENT REPOSITORY A    │   │   CLIENT REPOSITORY B    │
│ (Brand: "Dapur Sambal")  │   │  (Brand: "Kopi Kenangan") │
│ - Dedicated DB PostgreSQL│   │ - Dedicated DB PostgreSQL│
│ - Dedicated Vercel/VPS   │   │ - Dedicated Vercel/VPS   │
│ - Dedicated Google OAuth │   │ - Dedicated Google OAuth │
└──────────────────────────┘   └──────────────────────────┘
```

Setiap klien memiliki **repository tersendiri** dan **database terisolasi 100%**.

---

## 2. Alur Inisialisasi Klien Baru (Client Setup Workflow)

### Langkah 1: Gandakan Repository dari Master
1. Di GitHub, gunakan tombol **"Use this template"** atau duplikasi repo master ke organisasi/akun klien baru:
   ```bash
   git clone https://github.com/your-org/client-store-instance.git
   cd client-store-instance
   ```
2. Install dependency:
   ```bash
   npm install
   ```

### Langkah 2: Salin File Konfigurasi Environment
Salin `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi connection string database PostgreSQL baru untuk klien tersebut:
```env
DATABASE_URL="postgresql://user:password@host-pooler.region.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@host-direct.region.neon.tech/neondb?sslmode=require"
```

### Langkah 3: Sinkronisasi Skema Database
Dorong skema database ke PostgreSQL klien:
```bash
npm run db:push
```

### Langkah 4: Jalankan Onboarding Wizard (`/onboarding`)
1. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
2. Buka browser pada alamat:
   ```text
   http://localhost:1441/onboarding
   ```
3. Ikuti **4 Langkah Wizard**:
   * **Langkah 1**: Buat akun Super Admin & 4-digit Security PIN klien.
   * **Langkah 2**: Masukkan identitas brand (Nama Brand, Tagline, WhatsApp CS, Instagram).
   * **Langkah 3**: Pilih palet warna visual brand (Primary & Accent colors).
   * **Langkah 4**: Pilih katalog (Database Bersih vs Contoh F&B) lalu klik **Selesaikan & Buka Dashboard**.

---

## 3. Sinkronisasi Update dari Master ke Klien (Upstream Merging)

Jika tim Master merilis update fitur inti (misal: perbaikan keamanan, update Next.js, fitur laporan baru):
```bash
# Tambahkan upstream master sekali saja di repo klien
git remote add upstream https://github.com/your-org/master-core-engine.git

# Tarik pembaruan core engine tanpa menghapus konfigurasi klien
git fetch upstream
git merge upstream/main --allow-unrelated-histories
```

Dengan metode ini, setiap klien memiliki kebebasan penuh atas brand identity-nya, data transaksi terisolasi aman, dan tetap dapat menerima pembaruan teknologi di masa mendatang.
