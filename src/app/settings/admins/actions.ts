"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import { getCurrentAdminUsername } from "@/lib/auth";

export interface AdminListItem {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getAdminsAction(): Promise<AdminListItem[]> {
  const admins = await db.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
  return admins;
}

// ─── Create (Promosi) ─────────────────────────────────────────────────────────

export async function createAdminAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const displayName = (formData.get("displayName") as string)?.trim();
  const password = formData.get("password") as string;
  const pin = (formData.get("pin") as string)?.trim() || undefined;

  if (!username || !displayName || !password) {
    return { success: false, error: "Username, nama, dan password wajib diisi." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password minimal 8 karakter." };
  }
  if (pin && !/^\d{4}$/.test(pin)) {
    return { success: false, error: "PIN harus 4 digit angka." };
  }

  const exists = await db.admin.findUnique({ where: { username } });
  if (exists) {
    return { success: false, error: `Username "${username}" sudah digunakan.` };
  }

  const promotedBy = await getCurrentAdminUsername();
  const passwordHash = await bcrypt.hash(password, 10);
  const pinHash = pin ? await bcrypt.hash(pin, 10) : undefined;

  await db.admin.create({
    data: {
      username,
      displayName,
      passwordHash,
      pinHash: pinHash ?? null,
      isActive: true,
      createdBy: promotedBy ?? "SYSTEM",
    },
  });

  revalidatePath("/settings/admins");
  return { success: true };
}

// ─── Toggle Aktif ─────────────────────────────────────────────────────────────

export async function toggleAdminActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentAdminUsername();

  // Cegah menonaktifkan diri sendiri
  const target = await db.admin.findUnique({ where: { id } });
  if (target?.username === currentUser) {
    return { success: false, error: "Tidak dapat menonaktifkan akun Anda sendiri." };
  }

  await db.admin.update({ where: { id }, data: { isActive } });
  revalidatePath("/settings/admins");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteAdminAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentAdminUsername();

  const target = await db.admin.findUnique({ where: { id } });
  if (!target) return { success: false, error: "Admin tidak ditemukan." };
  if (target.username === currentUser) {
    return { success: false, error: "Tidak dapat menghapus akun Anda sendiri." };
  }

  // Pastikan minimal 1 admin aktif tersisa
  const activeCount = await db.admin.count({ where: { isActive: true } });
  if (activeCount <= 1 && target.isActive) {
    return { success: false, error: "Harus ada minimal 1 admin aktif." };
  }

  await db.admin.delete({ where: { id } });
  revalidatePath("/settings/admins");
  return { success: true };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetAdminPasswordAction(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const newPassword = formData.get("newPassword") as string;
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password baru minimal 8 karakter." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.admin.update({ where: { id }, data: { passwordHash } });

  revalidatePath("/settings/admins");
  return { success: true };
}
