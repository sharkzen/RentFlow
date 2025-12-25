"use client";
import React, { useState } from "react";
import { Search, MapPin, CircleDollarSign, X } from "lucide-react";
import { Element } from "react-scroll";
import { useRouter } from "next/navigation";
export default function DormFilter() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");

  const router = useRouter();

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (name) params.set("name", name);
    if (location) params.set("location", location);
    if (priceMin !== "") params.set("priceMin", String(priceMin));
    if (priceMax !== "") params.set("priceMax", String(priceMax));

    router.push(`/?${params.toString()}`, { scroll: false });
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
        {/* --- Filter Row --- */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow md:flex-row md:p-2">
          {/* Name Filter */}
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

          {/* Location Filter */}
          <div className="flex w-full flex-1 items-center border-b border-gray-100 px-4 py-2 md:border-r md:border-b-0">
            <MapPin className="mr-3 h-5 w-5 text-gray-400" />
            <select
              className="w-full cursor-pointer appearance-none bg-transparent text-gray-700 outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">ใกล้สถานที่สำคัญ...</option>
              <optgroup label="มหาวิทยาลัย">
                <option value="uni1">ม.เกษตรศาสตร์</option>
                <option value="uni2">ม.มหิดล</option>
              </optgroup>
              <optgroup label="ห้างสรรพสินค้า">
                <option value="mall1">Siam Paragon</option>
                <option value="mall2">Central World</option>
              </optgroup>
            </select>
          </div>

          {/* Price Filter */}
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
              รีเซ็ตค่า <X size={20} />
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
