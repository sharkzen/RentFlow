"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BillingService } from "../services/billing.service";
import type { MyBilling } from "../types";

interface OwnerBillingValue {
  billing: MyBilling | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** แอดมินเปิดบังคับโควต้าและเจ้าของหอยังใช้งานงานจัดการเต็มรูปแบบไม่ได้ */
  restricted: boolean;
}

const OwnerBillingContext = createContext<OwnerBillingValue>({
  billing: null,
  loading: true,
  refresh: async () => {},
  restricted: false,
});

/**
 * ดึงสถานะแพ็คเกจครั้งเดียวต่อ layout เจ้าของหอ แล้วแชร์ให้เมนู, modal แจ้งเตือน,
 * หน้าล็อก และฟอร์มหอพัก (ล็อกการตั้งค่าการเงิน) ใช้ร่วมกัน
 */
export function OwnerBillingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [billing, setBilling] = useState<MyBilling | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setBilling(await BillingService.getMyBilling());
    } catch {
      // ดึงสถานะไม่ได้ (เช่น เน็ตหลุด) ปล่อยให้ใช้งานต่อ ฝั่ง backend ยังตรวจสิทธิ์อยู่
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<OwnerBillingValue>(
    () => ({
      billing,
      loading,
      refresh,
      restricted: !!billing && billing.enforced && billing.access !== "full",
    }),
    [billing, loading, refresh],
  );

  return (
    <OwnerBillingContext.Provider value={value}>
      {children}
    </OwnerBillingContext.Provider>
  );
}

export const useOwnerBilling = () => useContext(OwnerBillingContext);

/** เมนูงานจัดการที่ต้องมีแพ็คเกจ (เส้นทาง -> ชื่อฟีเจอร์) ใช้ร่วมกันทั้งเมนูและหน้าล็อก */
export const MANAGE_FEATURES: { prefix: string; key: string; name: string }[] =
  [
    { prefix: "/owner/tenants", key: "tenants", name: "จัดการผู้เช่า" },
    { prefix: "/owner/bills", key: "bills", name: "จัดการบิล" },
    { prefix: "/owner/maintenance", key: "maintenance", name: "จัดการแจ้งซ่อม" },
    { prefix: "/owner/announcements", key: "announcements", name: "ประกาศ" },
    {
      prefix: "/owner/qr-scan-auth",
      key: "qr",
      name: "เข้าระบบด้วย QR Code",
    },
  ];

export const FEATURE_NAME_BY_KEY: Record<string, string> = Object.fromEntries([
  ...MANAGE_FEATURES.map((f) => [f.key, f.name]),
  ["ocr", "สแกนมิเตอร์ด้วย OCR"],
  ["finance", "ตั้งค่าการเงินของหอพัก"],
]);
