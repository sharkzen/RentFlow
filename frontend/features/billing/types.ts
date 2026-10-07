export interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  maxDorms: number;
  maxRooms: number;
  slipQuotaMonthly: number;
  slipOverageRate: number | null;
  slipUnlimited: boolean;
  hasOcr: boolean;
  discountPct3m: number;
  discountPct6m: number;
  discountPct12m: number;
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
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
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

export type AccessLevel = "full" | "readonly" | "locked";

export interface PayTo {
  promptPayId: string;
  promptPayName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
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
  ocrAllowed: boolean;
  /** ระดับสิทธิ์งานจัดการ: full ใช้ได้ / readonly ดูได้อย่างเดียว / locked ล็อก */
  access: AccessLevel;
  /** แอดมินเปิดบังคับโควต้าอยู่หรือไม่ (ปิดอยู่ = ไม่ล็อกอะไร) */
  enforced: boolean;
  trialBlocked: boolean;
  plan: Plan;
  periodEnd: string | null;
  graceEndsAt: string | null;
  usage: { dorms: number; rooms: number; slips: number };
  trial:
    | { available: false }
    | {
        available: true;
        planName: string;
        days: number;
        limits: Pick<
          Plan,
          | "maxDorms"
          | "maxRooms"
          | "slipQuotaMonthly"
          | "slipUnlimited"
          | "hasOcr"
        >;
      };
  promotion: {
    pricePerMonth: number;
    maxSlots: number;
    slotsAvailable: number;
    active: { id: string; dormId: string; dormName: string; endsAt: string }[];
  };
  payTo: PayTo;
}

export type OrderStatus =
  | "PENDING"
  | "PENDING_REVIEW"
  | "PAID"
  | "REJECTED"
  | "EXPIRED"
  | "REFUNDED";

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

export interface OrderDetail {
  order: BillingOrder & {
    listPrice: number;
    termDiscount: number;
    couponCode: string | null;
    slipUrls: string[];
    plan?: Plan | null;
    dorm?: { id: string; name: string } | null;
  };
  payTo: PayTo;
  qr: string | null;
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

export interface RevenueReport {
  totals: {
    allTime: number;
    discountGiven: number;
    paidOrders: number;
    thisMonth: number;
    lastMonth: number;
  };
  monthly: { period: string; plan: number; promotion: number; total: number }[];
  subscriptions: {
    active: number;
    trial: number;
    grace: number;
    expired: number;
    mrr: number;
    byPlan: { planId: string; name: string; price: number; count: number }[];
  };
  promotions: { active: number; maxSlots: number };
  pendingReview: number;
}

/** ข้อมูลสมาชิกของเจ้าของหอรายคน (หน้าแอดมิน) */
export interface OwnerSubscriptionInfo {
  subscription: {
    id: string;
    planId: string;
    planName: string;
    status: SubscriptionState;
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
  } | null;
  usage: { dorms: number; rooms: number };
  trial: { usedAt: string | null; blocked: boolean };
  promotions: { id: string; dormName: string; startsAt: string; endsAt: string }[];
  plans: {
    id: string;
    name: string;
    priceMonthly: number;
    maxDorms: number;
    maxRooms: number;
  }[];
  orders: {
    id: string;
    type: "PLAN" | "PROMOTION";
    status: OrderStatus;
    label: string;
    months: number;
    finalAmount: number;
    paidAt: string | null;
    createdAt: string;
  }[];
}

export type OwnerSubscriptionAction =
  | {
      action: "GRANT";
      planId: string;
      days: number;
      trial?: boolean;
      reason: string;
    }
  | { action: "EXTEND"; days: number; reason: string }
  | { action: "SET_END"; endsAt: string; reason: string }
  | { action: "CANCEL"; reason: string };
