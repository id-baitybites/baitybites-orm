import { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { getAllLeads } from "@/lib/leads-store";
import { PlatformConsoleClient } from "./PlatformConsoleClient";

export const metadata: Metadata = {
  title: "Platform Console | Baitybites ORM",
  description: "Pusat kontrol enterprise Platform Owner Baitybites ORM untuk mengelola armada tenant klien, lisensi, dan infrastruktur cloud.",
};

export const dynamic = "force-dynamic";

export default async function PlatformConsolePage() {
  const leads = await getAllLeads();

  return (
    <AppShell>
      <PlatformConsoleClient leads={leads} />
    </AppShell>
  );
}
