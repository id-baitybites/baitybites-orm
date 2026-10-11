/**
 * Rate Limiter sederhana berbasis in-memory untuk Server Actions.
 *
 * Catatan: In-memory berarti reset saat server restart (serverless per-invocation).
 * Untuk production multi-instance, gunakan Redis (Upstash, dll.).
 * Untuk Vercel single-region deployment ini sudah cukup efektif.
 */

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

// Singleton global agar persisten selama satu instance server hidup
const globalForRateLimit = globalThis as unknown as {
  loginAttempts?: Map<string, AttemptRecord>;
};

const loginAttempts: Map<string, AttemptRecord> =
  globalForRateLimit.loginAttempts ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.loginAttempts = loginAttempts;
}

/** Maksimal percobaan sebelum dikunci */
const MAX_ATTEMPTS = 5;
/** Window waktu dalam milidetik (15 menit) */
const WINDOW_MS = 15 * 60 * 1000;
/** Durasi lockout dalam milidetik (15 menit) */
const LOCKOUT_MS = 15 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  /** Sisa percobaan sebelum dikunci */
  remaining?: number;
  /** Waktu (dalam detik) sampai lockout berakhir */
  retryAfterSeconds?: number;
  /** Pesan error yang bisa ditampilkan ke user */
  error?: string;
}

/**
 * Periksa apakah identifier (IP atau username) boleh mencoba login.
 * Panggil ini SEBELUM memverifikasi credentials.
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (record) {
    // Jika sedang dikunci
    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds,
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(retryAfterSeconds / 60)} menit.`,
      };
    }

    // Reset jika window sudah lewat
    if (now - record.firstAttemptAt > WINDOW_MS) {
      loginAttempts.delete(identifier);
      return { allowed: true, remaining: MAX_ATTEMPTS };
    }

    // Masih dalam window, hitung sisa percobaan
    const remaining = MAX_ATTEMPTS - record.count;
    if (remaining <= 0) {
      // Set lockout
      record.lockedUntil = now + LOCKOUT_MS;
      loginAttempts.set(identifier, record);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(LOCKOUT_MS / 60000)} menit.`,
      };
    }

    return { allowed: true, remaining };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS };
}

/**
 * Catat satu percobaan login gagal untuk identifier tertentu.
 * Panggil ini SETELAH verifikasi credential gagal.
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    loginAttempts.set(identifier, { count: 1, firstAttemptAt: now });
  } else {
    // Reset jika window sudah lewat
    if (now - record.firstAttemptAt > WINDOW_MS) {
      loginAttempts.set(identifier, { count: 1, firstAttemptAt: now });
    } else {
      record.count += 1;
      loginAttempts.set(identifier, record);
    }
  }
}

/**
 * Hapus record percobaan untuk identifier (dipanggil saat login sukses).
 */
export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}
