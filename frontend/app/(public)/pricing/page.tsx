import type { Metadata } from "next";
import PricingView, {
  type Pricing,
} from "@/features/billing/components/public/PricingView";

export const metadata: Metadata = {
  title: "ราคาแพ็คเกจ",
  description:
    "ลงประกาศหอพักฟรี และเลือกแพ็คเกจระบบจัดการหอพัก RentFlow ที่เหมาะกับจำนวนหอและห้องของคุณ พร้อมบริการโปรโมทหอพัก",
};

const API_URL = process.env.API_URL || "http://localhost:3001";

async function getPricing(): Promise<Pricing | null> {
  try {
    const res = await fetch(`${API_URL}/api/billing/public/pricing`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    return (await res.json()).data as Pricing;
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const pricing = await getPricing();

  return (
    <main className="bg-grid bg-background min-h-screen w-full px-6 py-24">
      {pricing ? (
        <PricingView pricing={pricing} />
      ) : (
        <p className="text-muted mt-16 text-center text-sm">
          ไม่สามารถโหลดข้อมูลราคาได้ในขณะนี้ กรุณาลองใหม่ภายหลัง
        </p>
      )}
    </main>
  );
}
