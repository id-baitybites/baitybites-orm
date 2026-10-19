"use server";

import { revalidatePath } from "next/cache";
import {
  createDatabaseSnapshot,
  listSnapshots,
  getSnapshotContent,
  restoreFromSnapshot,
  type SnapshotMeta,
  type DatabaseSnapshotPayload,
} from "@/lib/backup-engine";
import { getCurrentAdminUsername } from "@/lib/auth";

export async function triggerBackupAction(): Promise<{
  success: boolean;
  filename?: string;
  size?: string;
  counts?: Record<string, number>;
  error?: string;
}> {
  const admin = await getCurrentAdminUsername();
  if (!admin) {
    return { success: false, error: "Akses ditolak. Sesi admin tidak valid." };
  }

  const result = await createDatabaseSnapshot();
  if (result.success) {
    revalidatePath("/settings/backup");
    return {
      success: true,
      filename: result.filename,
      size: result.sizeFormatted,
      counts: result.counts,
    };
  }

  return { success: false, error: result.error };
}

export async function getBackupsListAction(): Promise<SnapshotMeta[]> {
  return await listSnapshots();
}

export async function downloadBackupAction(filename: string): Promise<{
  success: boolean;
  content?: string;
  filename?: string;
  error?: string;
}> {
  const admin = await getCurrentAdminUsername();
  if (!admin) {
    return { success: false, error: "Akses ditolak." };
  }

  const content = await getSnapshotContent(filename);
  if (!content) {
    return { success: false, error: "File backup tidak ditemukan." };
  }

  return { success: true, content, filename };
}

export async function restoreBackupAction(
  jsonPayloadString: string,
  confirmText: string
): Promise<{
  success: boolean;
  message?: string;
  restoredCounts?: Record<string, number>;
  error?: string;
}> {
  const admin = await getCurrentAdminUsername();
  if (!admin) {
    return { success: false, error: "Akses ditolak. Anda harus login sebagai admin." };
  }

  if (confirmText.trim().toUpperCase() !== "PULIHKAN DATABASE") {
    return {
      success: false,
      error: 'Konfirmasi tidak sesuai. Harap ketik "PULIHKAN DATABASE" untuk melanjutkan.',
    };
  }

  try {
    const payload: DatabaseSnapshotPayload = JSON.parse(jsonPayloadString);
    const result = await restoreFromSnapshot(payload);

    revalidatePath("/dashboard");
    revalidatePath("/products");
    revalidatePath("/orders");
    revalidatePath("/settings");
    revalidatePath("/settings/backup");

    return {
      success: true,
      message: result.message,
      restoredCounts: result.restoredCounts,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memulihkan database.",
    };
  }
}
