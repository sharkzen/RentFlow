"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Banknote,
  RotateCcw,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Element, scroller } from "react-scroll";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LandmarkService,
  Landmark,
} from "@/features/dormitory/services/landmark.service";
import log from "@/lib/logger";

export default function DormFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [name, setName] = useState(searchParams.get("search") || "");
  const [isError, setIsError] = useState(false);
  const [location, setLocation] = useState(searchParams.get("landmarkId") || "");
  const [priceMin, setPriceMin] = useState<number | "">(
    searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : ""
  );
  const [priceMax, setPriceMax] = useState<number | "">(
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : ""
  );
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);

  // Fetch Landmarks
  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const data = await LandmarkService.getAllLandmarks();
        setLandmarks(data);
      } catch (error) {
        log.error("Failed to fetch landmarks", error);
      }
    };
    fetchLandmarks();
  }, []);

  // Group Landmarks
  const groupedLandmarks = landmarks.reduce(
    (acc, landmark) => {
      const type = landmark.type || "OTHER";
      if (!acc[type]) acc[type] = [];
      acc[type].push(landmark);
      return acc;
    },
    {} as Record<string, Landmark[]>
  );

  // ฟังก์ชันกลางสำหรับสร้าง URL และ Redirect (Reusable)
  // รับ overrides เพื่อใช้ค่าล่าสุดทันที (แก้ปัญหา state update ช้าใน event handler)
  const executeSearch = (overrides?: {
    search?: string;
    landmarkId?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const params = new URLSearchParams();

    // ใช้ค่าจาก overrides ถ้ามี ถ้าไม่มีให้ใช้ state ปัจจุบัน
    const currentName = overrides?.search !== undefined ? overrides.search : name;
    const currentLocation = overrides?.landmarkId !== undefined ? overrides.landmarkId : location;
    const currentMin = overrides?.minPrice !== undefined ? overrides.minPrice : priceMin;
    const currentMax = overrides?.maxPrice !== undefined ? overrides.maxPrice : priceMax;

    if (currentName) params.set("search", currentName);
    if (currentLocation) params.set("landmarkId", currentLocation);
    if (currentMin !== "") params.set("minPrice", String(currentMin));
    if (currentMax !== "") params.set("maxPrice", String(currentMax));

    router.push(`/?${params.toString()}`, {
      scroll: false,
    });

    // Scroll Smooth ไปที่จุดแสดงผล
    setTimeout(() => {
      scroller.scrollTo("dorm-filter", {
        duration: 800,
        delay: 0,
        smooth: "easeInOutQuart",
        offset: -90,
      });
    }, 100);
  };

  // ปุ่มกดค้นหา (Manual Search)
  const handleSearchClick = () => {
    // Logic ใหม่: เช็คว่า "ว่างทุกช่อง" หรือไม่?
    // ถ้าไม่มีชื่อ AND ไม่มีโลเคชั่น AND ไม่มีราคาเลย -> Error
    const isEmpty = !name.trim() && !location && priceMin === "" && priceMax === "";

    if (isEmpty) {
      setIsError(true);
      inputRef.current?.focus();
      return;
    }

    // ถ้ามีการกรอกช่องใดช่องหนึ่งแล้ว ให้ค้นหาได้เลย
    executeSearch();
  };

  // เปลี่ยนทำเลแล้วค้นหาทันที (Auto Search)
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    setIsError(false); // ปลด Error ทันทีเพราะถือว่ามีการเลือก Filter แล้ว

    // สั่งค้นหาทันทีโดยส่งค่าใหม่เข้าไป
    executeSearch({ landmarkId: newLocation });
  };

  const handleReset = () => {
    setName("");
    setIsError(false);
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    router.push(`/?`, { scroll: false });
  };

  // เช็คว่ามี Filter ค้างอยู่ไหม (สำหรับปุ่ม Reset)
  const hasFilter = name || location || priceMin || priceMax;

  return (
    <Element name="dorm-filter">
      <div
        suppressHydrationWarning
        data-aos="fade-up"
        className="relative z-20 mx-auto my-8 w-full"
      >
        <div className="flex flex-col rounded-3xl bg-white p-2 shadow ring-1 shadow-slate-200/60 ring-slate-100 md:flex-row md:items-center md:p-1.5">
          
          {/* --- INPUT: ชื่อหอพัก --- */}
          <div
            className={`group relative flex flex-1 flex-col justify-center px-6 py-3 transition-all md:rounded-l-full md:border-r ${
              isError
                ? "ring-2 ring-red-500 bg-red-50/30 md:border-transparent"
                : "md:border-slate-100"
            }`}
          >
            <label
              className={`mb-0.5 flex items-center gap-2 text-xs font-bold tracking-wider uppercase ${
                isError ? "text-red-600" : "text-slate-500"
              }`}
            >
              <Building2
                size={14}
                className={isError ? "text-red-500" : "text-blue-500"}
              />
              ค้นหาชื่อหอพัก{" "}
              {isError && (
                <span className="text-[10px] normal-case font-medium animate-pulse">
                  (กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง)
                </span>
              )}
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="เช่น หอพักใจดี..."
              className="w-full truncate bg-transparent text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none md:text-base"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value) setIsError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchClick();
              }}
            />
          </div>

          {/* --- INPUT: ทำเล (Auto Fetch) --- */}
          <div className="group relative flex flex-1 flex-col justify-center px-6 py-3 transition-colors md:border-r md:border-slate-100">
            <label className="mb-0.5 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <MapPin size={14} className="text-rose-500" />
              ทำเล / สถานที่ใกล้เคียง
            </label>
            <div className="relative">
              <select
                className="w-full cursor-pointer appearance-none truncate bg-transparent pr-4 text-sm font-semibold text-slate-700 placeholder:font-normal focus:outline-none md:text-base"
                value={location}
                onChange={handleLocationChange} // ใช้ฟังก์ชันใหม่ที่ Auto Fetch
              >
                <option value="">ทั้งหมด</option>
                {Object.entries(groupedLandmarks).map(([type, items]) => (
                  <optgroup
                    key={type}
                    label={type}
                    className="font-semibold text-slate-900"
                  >
                    {items.map((lm) => (
                      <option
                        key={lm.id}
                        value={lm.id}
                        className="text-slate-600"
                      >
                        {lm.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* --- INPUT: ช่วงราคา --- */}
          <div className="group relative flex flex-[1.3] flex-col justify-center px-6 py-3 transition-colors">
            <label className="mb-0.5 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <Banknote size={14} className="text-emerald-500" />
              ช่วงราคา (บาท)
            </label>
            <div className="flex items-center gap-2">
              <input
              min={0}
                type="number"
                placeholder="ต่ำสุด"
                className="w-full min-w-15 bg-transparent text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none md:text-base"
                value={priceMin}
                onChange={(e) => {
                  setPriceMin(e.target.value === "" ? "" : Number(e.target.value));
                  setIsError(false); // พิมพ์ราคา ก็ถือว่ามี filter แล้ว ปลด error ได้
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchClick();
                }}
              />
              <span className="text-slate-300">-</span>
              <input
              min={0}
                type="number"
                placeholder="สูงสุด"
                className="w-full min-w-15 bg-transparent text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none md:text-base"
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(e.target.value === "" ? "" : Number(e.target.value));
                  setIsError(false); // พิมพ์ราคา ก็ถือว่ามี filter แล้ว ปลด error ได้
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchClick();
                }}
              />
            </div>
          </div>

          {/* --- BUTTONS --- */}
          <div className="flex items-center gap-2 p-2 md:pl-0">
            <div
              className={`overflow-hidden transition-all duration-300 ${
                hasFilter ? "w-10 scale-100 opacity-100" : "w-0 scale-90 opacity-0"
              }`}
            >
              <button
                onClick={handleReset}
                title="ล้างตัวกรอง"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-rose-100 hover:text-rose-600 active:scale-95"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <button
              onClick={handleSearchClick}
              className="group relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-cyan-500 py-3.5 pr-8 pl-6 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-blue-500/50 active:scale-95 md:flex-none"
            >
              <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-base font-bold whitespace-nowrap">
                ค้นหา
              </span>
            </button>
          </div>
        </div>
      </div>
    </Element>
  );
}