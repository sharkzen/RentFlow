"use client";
import React, { useState, useEffect } from "react";
import { Search, MapPin, CircleDollarSign, X } from "lucide-react";
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
        duration: 100,
        delay: 0,
        smooth: "easeInOutQuart",
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

  return (
    <Element name="dorm-filter">
      <div
        suppressHydrationWarning
        data-aos="fade-up"
        className="relative z-10 mx-auto my-10 w-full"
      >
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow md:flex-row md:p-2">
          <div className="flex w-full flex-1 items-center border-b border-gray-100 px-4 py-2 md:border-r md:border-b-0">
            <Search className="mr-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหอพัก..."
              className="w-full text-gray-700 outline-none placeholder:text-gray-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-1 items-center border-b border-gray-100 px-4 py-2 md:border-r md:border-b-0">
            <MapPin className="mr-3 h-5 w-5 text-gray-400" />
            <select
              className="w-full cursor-pointer appearance-none bg-transparent text-gray-700 outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">เลือกสถานที่ใกล้เคียง...</option>

              {Object.entries(groupedLandmarks).map(([type, items]) => (
                <optgroup key={type} label={type}>
                  {items.map((lm) => (
                    <option key={lm.id} value={lm.id}>
                      {lm.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex w-full flex-[1.2] items-center px-4 py-2">
            <CircleDollarSign className="mr-3 h-5 w-5 text-gray-400" />
            <div className="flex w-full items-center gap-2">
              <input
                type="number"
                placeholder="น้อยสุด"
                className="w-1/2 bg-transparent text-sm text-gray-700 outline-none"
                value={priceMin}
                onChange={(e) =>
                  setPriceMin(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
              <span className="text-gray-300">-</span>
              <input
                type="number"
                placeholder="มากสุด"
                className="w-1/2 bg-transparent text-sm text-gray-700 outline-none"
                value={priceMax}
                onChange={(e) =>
                  setPriceMax(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          {(name || location || priceMin || priceMax) && (
            <span
              onClick={handleReset}
              className="flex-0.5 flex items-center text-blue-500 hover:cursor-pointer hover:underline"
            >
              รีเซ็ต <X size={20} />
            </span>
          )}

          <button
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#1d6ef2] px-8 py-3 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 md:w-auto"
            onClick={handleSearch}
          >
            <Search className="h-5 w-5" />
            <span>ค้นหา</span>
          </button>
        </div>
      </div>
    </Element>
  );
}
