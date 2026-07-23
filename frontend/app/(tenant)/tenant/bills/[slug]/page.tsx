import BillSlugContainer from "@/features/bill/components/tenant/slug/BillSlugContainer";
import { cookies } from "next/headers";
import type { Metadata } from "next";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${API_URL}/api/tenants/bills/${slug}`, {
      headers: {
        Cookie: cookieHeader,
      },

      cache: "no-store",
    });

    if (!res.ok) return {};

    const bill = await res.json();
    const month = bill.billingMonth
      ? new Date(bill.billingMonth).toLocaleDateString("th-TH", {
          month: "long",
          year: "numeric",
        })
      : "";

    return {
      title: `บิลห้อง ${bill.roomNumberSnapshot ?? ""} เดือน ${month}`.trim(),
    };
  } catch {
    return {};
  }
}

export default function page() {
  return <BillSlugContainer />;
}
