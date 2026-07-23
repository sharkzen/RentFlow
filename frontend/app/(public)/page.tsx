import Hero from "@/features/dormitory/components/public/Hero";
import IndexContainer from "@/features/dormitory/components/public/IndexContainer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ค้นหาหอพักที่ใช่ ในสไตล์ที่เป็นคุณ",
  description:
    "ค้นหาหอพักคุณภาพดีใกล้มหาวิทยาลัยและสถานที่สำคัญ เปรียบเทียบราคา ดูรูปภาพ และติดต่อเจ้าของหอพักได้ทันทีบน RentFlow",

  openGraph: {
    title: "ค้นหาหอพักที่ใช่ ในสไตล์ที่เป็นคุณ | RentFlow",
    description:
      "ค้นหาหอพักคุณภาพดีใกล้มหาวิทยาลัยและสถานที่สำคัญ เปรียบเทียบราคาและติดต่อเจ้าของหอพักได้ทันที",
    images: ["/hero.jpg"],
  },
};

export default function page() {
  return (
    <main className="min-h-screen">
      <Hero />
      <IndexContainer />
    </main>
  );
}
