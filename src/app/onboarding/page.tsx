import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import OnboardingClient from "./OnboardingClient";
import { checkOnboardingStatus } from "./actions";
import { SESSION_COOKIE } from "@/lib/auth-constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Setup & Onboarding Brand Baru | Dedicated Instance",
  description: "Inisialisasi akun Super Admin, brand identity, dan konfigurasi awal toko Anda.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ force?: string }>;
}) {
  const cookieStore = await cookies();
  const isAdminAuthenticated = cookieStore.get(SESSION_COOKIE)?.value === "authenticated";
  const params = await searchParams;
  const isForce = params?.force === "true";

  const status = await checkOnboardingStatus();

  // Hanya redirect jika sistem sudah diinisialisasi DAN pengguna belum login sebagai admin
  // (Jika admin/platform owner sedang login atau ada param ?force=true, izinkan akses wizard untuk demonstrasi atau rekonfigurasi)
  if (status.isInitialized && !isAdminAuthenticated && !isForce) {
    redirect("/admin");
  }

  return <OnboardingClient isReconfiguration={status.isInitialized} />;
}

