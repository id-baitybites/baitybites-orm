"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function advanceOrderStatus(
  id: string,
  nextStatus: "dimasak" | "siap_pickup"
): Promise<void> {
  const dbStatus = nextStatus === "dimasak" ? "DIMASAK" : "SIAP_PICKUP";

  await db.order.update({
    where: { id },
    data: {
      status: dbStatus,
      ...(dbStatus === "DIMASAK" ? { cookStartedAt: new Date() } : {}),
    },
  });

  revalidatePath("/kitchen");
}
