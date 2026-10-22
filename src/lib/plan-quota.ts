/**
 * Plan Quota & Feature Matrix Configuration
 * Digunakan untuk enforce batas kuota cabang, staf, katalog produk, dan fitur per-tier langganan.
 */

export type SubscriptionPlan = "Starter Instance" | "Business Pro" | "Enterprise" | "Enterprise White-Label";

export interface PlanQuotaDefinition {
  name: SubscriptionPlan;
  maxBranches: number; // Infinity = Unlimited
  maxStaffAccounts: number;
  maxProducts: number;
  hasKDS: boolean;
  hasCustomDomain: boolean;
  hasApiAndWebhook: boolean;
  hasDedicatedDatabaseBranch: boolean;
  prioritySlaUptime: number; // e.g. 99.9
}

export const PLAN_QUOTAS: Record<string, PlanQuotaDefinition> = {
  "Starter Instance": {
    name: "Starter Instance",
    maxBranches: 1,
    maxStaffAccounts: 2,
    maxProducts: 100,
    hasKDS: false,
    hasCustomDomain: false,
    hasApiAndWebhook: false,
    hasDedicatedDatabaseBranch: false,
    prioritySlaUptime: 99.5,
  },
  "Business Pro": {
    name: "Business Pro",
    maxBranches: 3,
    maxStaffAccounts: 10,
    maxProducts: Infinity,
    hasKDS: true,
    hasCustomDomain: true,
    hasApiAndWebhook: false,
    hasDedicatedDatabaseBranch: false,
    prioritySlaUptime: 99.8,
  },
  Enterprise: {
    name: "Enterprise",
    maxBranches: Infinity,
    maxStaffAccounts: Infinity,
    maxProducts: Infinity,
    hasKDS: true,
    hasCustomDomain: true,
    hasApiAndWebhook: true,
    hasDedicatedDatabaseBranch: true,
    prioritySlaUptime: 99.9,
  },
  "Enterprise White-Label": {
    name: "Enterprise White-Label",
    maxBranches: Infinity,
    maxStaffAccounts: Infinity,
    maxProducts: Infinity,
    hasKDS: true,
    hasCustomDomain: true,
    hasApiAndWebhook: true,
    hasDedicatedDatabaseBranch: true,
    prioritySlaUptime: 99.99,
  },
};

/**
 * Normalisasi nama plan ke definisi kuota
 */
export function getPlanQuota(planName?: string | null): PlanQuotaDefinition {
  if (!planName) return PLAN_QUOTAS["Starter Instance"];
  
  if (planName.toLowerCase().includes("enterprise")) {
    return planName.toLowerCase().includes("white-label")
      ? PLAN_QUOTAS["Enterprise White-Label"]
      : PLAN_QUOTAS["Enterprise"];
  }
  
  if (planName.toLowerCase().includes("business")) {
    return PLAN_QUOTAS["Business Pro"];
  }

  return PLAN_QUOTAS["Starter Instance"];
}

/**
 * Validasi apakah penambahan cabang/outlet baru diizinkan berdasarkan paket
 */
export function checkBranchQuota(
  planName: string,
  currentBranchCount: number
): { allowed: boolean; maxAllowed: number; message?: string } {
  const quota = getPlanQuota(planName);
  
  if (currentBranchCount >= quota.maxBranches) {
    return {
      allowed: false,
      maxAllowed: quota.maxBranches,
      message: `Batas kuota cabang tercapai (${quota.maxBranches} cabang). Silakan upgrade ke paket Enterprise untuk cabang unlimited.`,
    };
  }

  return {
    allowed: true,
    maxAllowed: quota.maxBranches,
  };
}

/**
 * Validasi apakah fitur API & Webhook diizinkan untuk paket
 */
export function isApiAndWebhookAllowed(planName: string): boolean {
  return getPlanQuota(planName).hasApiAndWebhook;
}
