import { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";
import { checkOnboardingStatus } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Setup & Onboarding Brand Baru | Dedicated Instance",
  description: "Inisialisasi akun Super Admin, brand identity, dan konfigurasi awal toko Anda.",
};

export default async function OnboardingPage() {
  const status = await checkOnboardingStatus();

  // Jika sistem sudah pernah di-onboard dan ada admin, arahkan ke login/dashboard
  if (status.isInitialized) {
    redirect("/admin");
  }

  return <OnboardingClient />;
}
