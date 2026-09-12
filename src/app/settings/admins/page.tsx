import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { getAdminsAction } from "./actions";
import { getCurrentAdminUsername } from "@/lib/auth";
import { AdminsClient } from "./AdminsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manajemen Admin",
};

export default async function AdminsPage() {
  const [admins, currentUsername] = await Promise.all([
    getAdminsAction(),
    getCurrentAdminUsername(),
  ]);

  return (
    <AppShell>
      <AdminsClient initialAdmins={admins} currentUsername={currentUsername} />
    </AppShell>
  );
}
