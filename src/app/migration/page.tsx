import { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import MigrationClient from "./MigrationClient";
import {
  isMigrationVerified,
  runMigrationChecks,
  getReleaseConfig,
  getEnvironmentCredentials,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modul Migrasi & Publikasi | BaityBites BO",
  description:
    "Modul panduan dan audit kesiapan migrasi infrastruktur database, server hosting, domain, release versioning, dan OAuth.",
};

export default async function MigrationPage() {
  const verified = await isMigrationVerified();
  const initialResults = verified ? await runMigrationChecks() : [];
  const initialReleaseConfig = verified ? await getReleaseConfig() : null;
  const initialCredentials = verified ? await getEnvironmentCredentials() : null;

  return (
    <AppShell>
      <MigrationClient
        initialVerified={verified}
        initialResults={initialResults}
        initialReleaseConfig={initialReleaseConfig}
        initialCredentials={initialCredentials}
      />
    </AppShell>
  );
}
