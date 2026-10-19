import { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { BackupClient } from "./BackupClient";
import { listSnapshots } from "@/lib/backup-engine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Backup & Recovery Tool | BaityBites BO",
  description:
    "Manajemen otomatisasi backup harian, snapshot database portabel, dan modul disaster recovery mandiri.",
};

export default async function BackupPage() {
  const backups = await listSnapshots();

  return (
    <AppShell>
      <BackupClient initialBackups={backups} />
    </AppShell>
  );
}
