/**
 * Auth Cookie & Session Constants
 * Berkas ini HANYA berisi konstanta murni (tanpa import Node.js / database / bcrypt)
 * agar 100% aman diimpor oleh Next.js Middleware di Edge Runtime.
 */

export const SESSION_COOKIE = "bb_session";
export const SESSION_ADMIN_COOKIE = "bb_admin";
export const CUSTOMER_SESSION_COOKIE = "bb_customer_session";
export const CUSTOMER_INFO_COOKIE = "bb_customer_info";
