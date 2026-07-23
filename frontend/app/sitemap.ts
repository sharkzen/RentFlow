import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3001";

async function getDormSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/dorms/all?page=1`, {
      next: {
        revalidate: 3600,
      },
    });

    if (!res.ok) return [];

    const { data, meta } = await res.json();
    const slugs: string[] = data.map((d: any) => d.slug);

    const totalPages = Math.min(meta?.totalPages ?? 1, 10);

    for (let page = 2; page <= totalPages; page++) {
      const pageRes = await fetch(`${API_URL}/api/dorms/all?page=${page}`, {
        next: {
          revalidate: 3600,
        },
      });

      if (!pageRes.ok) continue;

      const pageJson = await pageRes.json();
      slugs.push(...pageJson.data.map((d: any) => d.slug));
    }

    return slugs;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dormSlugs = await getDormSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const dormRoutes: MetadataRoute.Sitemap = dormSlugs.map((slug) => ({
    url: `${SITE_URL}/dorms/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...dormRoutes];
}
