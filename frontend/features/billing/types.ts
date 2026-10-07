export interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  maxDorms: number;
  maxRooms: number;
  slipQuotaMonthly: number;
  slipOverageRate: number | null;
  allowTrial: boolean;
  isFree: boolean;
  isActive: boolean;
  sortOrder: number;
  _count?: { subscriptions: number };
}

export type PlanPayload = Omit<Plan, "id" | "_count">;

export interface BillingSettings {
  trialEnabled: boolean;
  trialPlanId: string | null;
  trialDays: number;
  graceDays: number;
  promptPayId: string;
  promptPayName: string;
  promoPricePerMonth: number;
  promoMaxSlots: number;
  promoHoldMinutes: number;
}
