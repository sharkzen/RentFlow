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
  enforceLimits: boolean;
  slipOkPlatformQuota: number;
  /** อ่านอย่างเดียว ไม่ต้องส่งกลับตอนบันทึก */
  slipUsage?: {
    period: string;
    total: number;
    quota: number;
    percent: number | null;
  };
}

export type SubscriptionState =
  | "FREE"
  | "TRIAL"
  | "ACTIVE"
  | "GRACE"
  | "EXPIRED"
  | "CANCELED";

export interface MyBilling {
  status: SubscriptionState;
  canManage: boolean;
  readOnly: boolean;
  plan: Plan;
  periodEnd: string | null;
  graceEndsAt: string | null;
  usage: { dorms: number; rooms: number; slips: number };
  trial:
    | { available: false }
    | { available: true; planName: string; days: number };
  promotion: {
    pricePerMonth: number;
    maxSlots: number;
    slotsAvailable: number;
    active: { id: string; dormId: string; dormName: string; endsAt: string }[];
  };
  payTo: { promptPayId: string; promptPayName: string };
}

export type OrderStatus =
  | "PENDING"
  | "PENDING_REVIEW"
  | "PAID"
  | "REJECTED"
  | "EXPIRED";

export interface BillingOrder {
  id: string;
  type: "PLAN" | "PROMOTION";
  status: OrderStatus;
  months: number;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  holdUntil: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  plan?: { name: string } | null;
  dorm?: { name: string } | null;
}

export interface CreateOrderPayload {
  type: "PLAN" | "PROMOTION";
  planId?: string;
  dormId?: string;
  months: number;
  couponCode?: string;
}

export interface CouponPreview {
  code: string;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface OrderQr {
  qr: string;
  amount: number;
  promptPayName: string;
  holdUntil: string | null;
}

export type CouponType = "PERCENT" | "FIXED";
export type CouponScope = "PLAN" | "PROMOTION" | "BOTH";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  appliesTo: CouponScope;
  planIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  perOwnerLimit: number;
  isActive: boolean;
  _count?: { redemptions: number };
}

export type CouponPayload = Omit<Coupon, "id" | "_count">;

export interface AdminOrder extends BillingOrder {
  coupon?: { code: string } | null;
  owner: { fullName: string; user: { email: string } };
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
