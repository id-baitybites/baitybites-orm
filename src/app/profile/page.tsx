import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfileDataAction } from "./actions";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil Pelanggan | Baitybites",
  description: "Kelola data profil pelanggan, alamat pengiriman, dan riwayat pesanan Baitybites Anda.",
};

interface ProfilePageProps {
  searchParams: Promise<{
    loggedIn?: string;
  }>;
}

export default async function CustomerProfilePage({ searchParams }: ProfilePageProps) {
  const profileData = await getProfileDataAction();
  const params = await searchParams;

  // Jika belum login sebagai pelanggan, arahkan ke login
  if (!profileData) {
    redirect("/login?tab=customer&from=/profile");
  }

  return (
    <ProfileClient
      initialData={profileData}
      justLoggedIn={params.loggedIn === "true"}
    />
  );
}
