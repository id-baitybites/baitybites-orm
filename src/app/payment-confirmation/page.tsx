import { Metadata } from "next";
import { PaymentConfirmationClient } from "./PaymentConfirmationClient";
import { getLeadForPaymentConfirmation, type PublicPaymentConfirmationLead } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Konfirmasi & Unggah Bukti Pembayaran | Baitybites ORM",
  description:
    "Portal resmi konfirmasi pembayaran tagihan lisensi dan unggah bukti transfer perbankan Baitybites ORM.",
};

interface PaymentConfirmationPageProps {
  searchParams: Promise<{
    lead?: string;
    invoice?: string;
  }>;
}

export default async function PaymentConfirmationPage({
  searchParams,
}: PaymentConfirmationPageProps) {
  const { lead, invoice } = await searchParams;

  let initialLead: PublicPaymentConfirmationLead | null = null;
  let initialError: string | undefined = undefined;

  if (lead || invoice) {
    const res = await getLeadForPaymentConfirmation(lead, invoice);
    if (res.success && res.lead) {
      initialLead = res.lead;
    } else {
      initialError = res.error || "Data tagihan invoice tidak ditemukan.";
    }
  }

  return (
    <PaymentConfirmationClient
      initialLead={initialLead}
      initialError={initialError}
      queryLead={lead}
      queryInvoice={invoice}
    />
  );
}
