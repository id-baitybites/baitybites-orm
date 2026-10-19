import { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import LeadsClient from "./LeadsClient";
import { getLeadsAction } from "./actions";
import "./leads.scss";

export const metadata: Metadata = {
  title: "Permintaan Klien Baru (Leads) | Platform Owner",
  description: "Backoffice manajemen prospek & permohonan langganan platform Baitybites ORM",
};

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getLeadsAction();

  return (
    <AppShell>
      <div className="leads-page-wrapper">
        <LeadsClient initialLeads={leads} />
      </div>
    </AppShell>
  );
}
