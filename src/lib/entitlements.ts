/** What each plan unlocks. Every feature check in the product reads from here. */

import type { Category } from "@/types/suggestion";
import type { PlanId } from "./plans";

export interface Entitlements {
  categories: Category[];
  rhythm: boolean;
  voice: boolean;
  stetScope: "draft" | "all";
  draftLimit: number | null;
}

const PAID: Entitlements = {
  categories: ["spelling", "clarity", "voice"],
  rhythm: true,
  voice: true,
  stetScope: "all",
  draftLimit: null,
};

export const FREE_DRAFT_LIMIT = 20;

export function entitlementsFor(plan: PlanId): Entitlements {
  if (plan === "free") {
    return {
      categories: ["spelling"],
      rhythm: false,
      voice: false,
      stetScope: "draft",
      draftLimit: FREE_DRAFT_LIMIT,
    };
  }
  return PAID;
}
