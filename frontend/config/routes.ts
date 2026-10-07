/**
 * Central route map for the app, derived from the `app/` directory structure.
 * Keep this in sync with route groups under `app/(admin)`, `app/(auth)`,
 * `app/(owner)`, `app/(tenant)`, and `app/(public)`.
 */
export const routes = {
  admin: {
    approvals: "/admin/approvals",
    billingOrders: "/admin/billing-orders",
    billingReports: "/admin/billing-reports",
    billingSettings: "/admin/billing-settings",
    coupons: "/admin/coupons",
    plans: "/admin/plans",
    dashboard: "/admin/dashboard",
    dormitories: "/admin/dormitories",
    featured: "/admin/featured",
    features: "/admin/features",
    landmarks: "/admin/landmarks",
    lockedUsers: "/admin/locked-users",
    owners: "/admin/owners",
    users: "/admin/users",
  },
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  owner: {
    announcements: "/owner/announcements",
    billing: "/owner/billing",
    bills: "/owner/bills",
    dashboard: "/owner/dashboard",
    dorms: "/owner/dorms",
    maintenance: "/owner/maintenance",
    payments: "/owner/payments",
    profile: "/owner/profile",
    qrScanAuth: "/owner/qr-scan-auth",
    rooms: "/owner/rooms",
    tenants: "/owner/tenants",
  },
  tenant: {
    announcements: "/tenant/announcements",
    bills: "/tenant/bills",
    billDetail: (slug: string) => `/tenant/bills/${slug}`,
    contract: "/tenant/contract",
    dashboard: "/tenant/dashboard",
    maintenance: "/tenant/maintenance",
    profile: "/tenant/profile",
  },
  public: {
    dorms: "/dorms",
    dormDetail: (slug: string) => `/dorms/${slug}`,
  },
} as const;

export default routes;
