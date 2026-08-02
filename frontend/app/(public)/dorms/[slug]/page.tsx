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
    // Next.js does not deep-merge openGraph/twitter with the root layout, so
    // fall back to the site's default OG image explicitly instead of omitting it.
    // Point at the cover-image proxy route (not dorm.images[].url directly) since
    // that URL is a presigned R2 link that expires in 1 hour and would go stale
    // before crawlers re-fetch it. The route lives on this (public) frontend
    // origin, not API_URL, since API_URL is an internal-only backend address
    // in production and wouldn't be reachable by external crawlers.
    const hasImages = (dorm.images?.length ?? 0) > 0;
    const image = hasImages
      ? `/api/og-image/${encodeURIComponent(slug)}`
      : "/og-image.jpg";
    const price = dorm.settings?.roomPrice as number | undefined;
    const title = price
      ? `${dorm.name} | เริ่มต้น ${price.toLocaleString()} บาท/เดือน`
      : dorm.name;
    const description = dorm.address
      ? `หอพัก ${dorm.name} ที่ ${dorm.address} ดูรายละเอียดห้องว่าง ราคา และติดต่อเจ้าของหอพักได้ทันทีบน RentFlow`
      : `รายละเอียดหอพัก ${dorm.name} บน RentFlow`;

    return {
      title,
      description,

      openGraph: {
        title,
        description,
        images: [image],
      },

      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {};
  }
}

export default function page() {
  return <DormSlugContainer />;
}
