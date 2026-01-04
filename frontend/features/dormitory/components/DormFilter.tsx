"use client";
import React, { useState, useEffect } from "react";
import { Search, MapPin, Banknote, RotateCcw, Building2 } from "lucide-react"; // เปลี่ยน BadgeThaiBaht เป็น Banknote
import { Element, scroller } from "react-scroll";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LandmarkService,
  Landmark,
} from "@/features/dormitory/services/landmark.service";

export default function DormFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(
    searchParams.get("landmarkId") || "",
  );
  const [priceMin, setPriceMin] = useState<number | "">(
    searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "",
  );
  const [priceMax, setPriceMax] = useState<number | "">(
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "",
  );

  const [landmarks, setLandmarks] = useState<Landmark[]>([]);

  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const data = await LandmarkService.getAllLandmarks();
        setLandmarks(data);
      } catch (error) {
        console.error("Failed to fetch landmarks", error);
      }
    };
    fetchLandmarks();
  }, []);

  const groupedLandmarks = landmarks.reduce(
    (acc, landmark) => {
      const type = landmark.type || "OTHER";
      if (!acc[type]) acc[type] = [];
      acc[type].push(landmark);
      return acc;
    },
    {} as Record<string, Landmark[]>,
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (name) params.set("search", name);
    if (location) params.set("landmarkId", location);
    if (priceMin !== "") params.set("minPrice", String(priceMin));
    if (priceMax !== "") params.set("maxPrice", String(priceMax));

    router.push(`/?${params.toString()}`, { scroll: false });
    setTimeout(() => {
      scroller.scrollTo("dorm-filter", {
        duration: 500,
        delay: 0,
        smooth: "easeInOutQuart",
        offset: -100,
      });
    });
  };

  const handleReset = () => {
    setName("");
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    router.push(`/?`, { scroll: false });
  };

  const hasFilter = name || location || priceMin || priceMax;

  return (
    <Element name="dorm-filter">
      <div
        suppressHydrationWarning
        data-aos="fade-up"
        className="relative z-20 my-8 w-full"
      >
        <div className="flex flex-col items-stretch divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-100 bg-white p-2 md:flex-row md:items-center md:divide-x md:divide-y-0">
          <div className="group flex-1 rounded-xl px-4 py-3 transition-colors md:rounded-none md:rounded-l-xl">
            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
              ค้นหา
            </label>
            <div className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-blue-500" />
              <input
                type="text"
                placeholder="ชื่อหอพัก..."
                className="w-full truncate bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 md:text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="group flex-1 px-4 py-3 transition-colors">
            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
              ทำเล / ใกล้สถานที่
            </label>
            <div className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-red-500" />
              <div className="relative w-full">
                <select
                  className="w-full cursor-pointer appearance-none truncate bg-transparent pr-4 text-sm font-medium text-gray-900 outline-none md:text-base"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">ทั้งหมด</option>
                  {Object.entries(groupedLandmarks).map(([type, items]) => (
                    <optgroup key={type} label={type} className="font-semibold">
                      {items.map((lm) => (
                        <option
                          key={lm.id}
                          value={lm.id}
                          className="text-gray-700"
                        >
                          {lm.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="group flex-[1.2] px-4 py-3 transition-colors">
            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
              ช่วงราคา (บาท)
            </label>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 shrink-0 text-green-500" />

              <input
                type="number"
                placeholder="ต่ำสุด"
                className="w-full min-w-16 bg-transparent text-sm font-medium text-gray-900 outline-none md:text-base"
                value={priceMin}
                onChange={(e) =>
                  setPriceMin(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
              <span className="px-1 font-light text-gray-300">|</span>
              <input
                type="number"
                placeholder="สูงสุด"
                className="w-full min-w-16 bg-transparent text-sm font-medium text-gray-900 outline-none md:text-base"
                value={priceMax}
                onChange={(e) =>
                  setPriceMax(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 pl-4">
            <div
              className={`overflow-hidden transition-all duration-300 ${
                hasFilter ? "w-10 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <button
                onClick={handleReset}
                title="ล้างตัวกรอง"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-red-500"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <button
              onClick={handleSearch}
              className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-8 py-3.5 text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-300 active:scale-95 md:flex-none"
            >
              <Search className="h-5 w-5 group-hover:animate-pulse" />
              <span className="font-bold whitespace-nowrap">ค้นหา</span>
            </button>
          </div>
        </div>
      </div>
    </Element>
  );
}
