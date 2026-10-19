import { Suspense } from "react";
import { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import ProvisionClient from "./ProvisionClient";
import "./provision.scss";

export const metadata: Metadata = {
  title: "Generator Instance Klien | Platform Owner",
  description: "Tool otomatisasi pembuatan repository GitHub dedicated untuk klien baru.",
};

export default function ProvisionPage() {
  return (
    <AppShell>
      <div className="provision-page">
        <header className="provision-page__heading">
          <div>
            <p className="eyebrow">PLATFORM OWNER &amp; VENDOR TOOLS</p>
            <h1>GitHub Template &amp; Client Repository Generator</h1>
            <p>
              Hasilkan repository terisolasi untuk klien baru yang telah menyelesaikan pembayaran.
              Sistem menyediakan URL clone, tautan satu-klik ke VS Code Web (vscode.dev), dan instruksi onboarding yang siap diteruskan ke klien.
            </p>
          </div>

          <div className="provision-page__badge-owner">
            <span>👑 Akses Platform Owner</span>
          </div>
        </header>

        <Suspense fallback={<div>Memuat generator...</div>}>
          <ProvisionClient />
        </Suspense>
      </div>
    </AppShell>
  );
}
