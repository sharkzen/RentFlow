import DormSlugContainer from "@/features/dormitory/components/public/dormslug/DormSlugContainer";
import type { Metadata } from "next";
const API_URL = process.env.API_URL || "http://localhost:3001";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(
      `${API_URL}/api/dorms/${encodeURIComponent(slug)}`,
      {
        next: {
          revalidate: 3600,
        },
      },
    );

    if (!res.ok) return {};

    const dorm = await res.json();
    const image = dorm.images?.[0]?.url as string | undefined;
    const description = dorm.address
      ? `หอพัก ${dorm.name} ที่ ${dorm.address} ดูรายละเอียดห้องว่าง ราคา และติดต่อเจ้าของหอพักได้ทันทีบน RentFlow`
      : `รายละเอียดหอพัก ${dorm.name} บน RentFlow`;

    return {
      title: dorm.name,
      description,

      openGraph: {
        title: dorm.name,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default function page() {
  return <DormSlugContainer />;
}
