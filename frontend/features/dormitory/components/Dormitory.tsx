import React from "react";
import {
  Search,
  MapPin,
  CircleDollarSign,
  Wifi,
  Car,
  Dumbbell,
  Waves,
} from "lucide-react";
import DormCard from "./DormCard";

// Mock Data
const MOCK_DORMS = [
  {
    id: 1,
    title: "Sunny Loft ใกล้ ม.เกษตร",
    location: "0.5 กม. จาก ม.เกษตรศาสตร์",
    price: 5500,
    beds: 1,
    baths: 1,
    tag: "มาใหม่",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070",
  },
  {
    id: 2,
    title: "Cozy Studio ติดห้าง Central",
    location: "1.2 กม. จาก Central Ladprao",
    price: 8500,
    beds: 1,
    baths: 1,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080",
  },
  {
    id: 3,
    title: "Modern 2BHK ห้องใหญ่ วิวสวน",
    location: "3.0 กม. จาก BTS หมอชิต",
    price: 12000,
    beds: 2,
    baths: 2,
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070",
  },
  {
    id: 4,
    title: "Skyline View Penthouse",
    location: "0.1 กม. จาก MRT พระราม 9",
    price: 25000,
    beds: 3,
    baths: 2,
    tag: "ยอดนิยม",
    image:
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070",
  },
];

export default function Dormitory() {
  return (
    <div suppressHydrationWarning data-aos="fade-up" className="min-h-screen">
      <div className="mx-auto">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              หอพักแนะนำสำหรับคุณ
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {MOCK_DORMS.map((dorm) => (
            <DormCard key={dorm.id} {...dorm} />
          ))}
        </div>
      </div>
    </div>
  );
}
