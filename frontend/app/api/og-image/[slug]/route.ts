import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const res = await fetch(
    `${API_URL}/api/dorms/${encodeURIComponent(slug)}/cover-image`,
    { redirect: "follow" },
  );

  if (!res.ok) {
    return NextResponse.redirect(new URL("/og-image.jpg", _request.url));
  }

  return NextResponse.redirect(res.url);
}
