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
  const [name, setName] = useState(searchParams.get("search") || "");
  const [isError, setIsError] = useState(false);
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
        log.error("Failed to fetch landmarks", error);
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

  const executeSearch = (overrides?: {
    search?: string;
    landmarkId?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const params = new URLSearchParams();
    const currentName =
      overrides?.search !== undefined ? overrides.search : name;
    const currentLocation =
      overrides?.landmarkId !== undefined ? overrides.landmarkId : location;
    const currentMin =
      overrides?.minPrice !== undefined ? overrides.minPrice : priceMin;
    const currentMax =
      overrides?.maxPrice !== undefined ? overrides.maxPrice : priceMax;

    if (currentName) params.set("search", currentName);

    if (currentLocation) params.set("landmarkId", currentLocation);

    if (currentMin !== "") params.set("minPrice", String(currentMin));

    if (currentMax !== "") params.set("maxPrice", String(currentMax));

    router.push(`/?${params.toString()}`, {
      scroll: false,
    });

    setTimeout(() => {
      scroller.scrollTo("dorm-filter", {
        duration: 800,
        delay: 0,
        smooth: "easeInOutQuart",
        offset: -90,
      });
    }, 100);
  };

  const handleSearchClick = () => {
    const isEmpty =
      !name.trim() && !location && priceMin === "" && priceMax === "";

    if (isEmpty) {
      setIsError(true);
      inputRef.current?.focus();
      return;
    }

    executeSearch();
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    setIsError(false);

    executeSearch({
      landmarkId: newLocation,
    });
  };

  const handleReset = () => {
    setName("");
    setIsError(false);
    setLocation("");
    setPriceMin("");
    setPriceMax("");

    router.push(`/?`, {
      scroll: false,
    });
  };

  const hasFilter = name || location || priceMin || priceMax;

  return (
    <Element name="dorm-filter">
      <div
        suppressHydrationWarning
        data-aos="fade-up"
        className="relative z-20 mx-auto my-8 w-full"
      >
        <div className="flex flex-col rounded-3xl bg-white p-2 shadow ring-1 shadow-slate-200/60 ring-slate-100 md:flex-row md:items-center md:p-1.5">
          <div
            className={`group relative flex flex-1 flex-col justify-center px-6 py-3 transition-all md:rounded-l-full md:border-r ${isError ? "bg-red-50/30 ring-2 ring-red-500 md:border-transparent" : "md:border-slate-100"}`}
          >
            <label
              className={`mb-0.5 flex items-center gap-2 text-xs font-bold tracking-wider uppercase ${isError ? "text-red-600" : "text-slate-500"}`}
            >
              <Building2
                size={14}
                className={isError ? "text-red-500" : "text-blue-500"}
              />
              ค้นหาชื่อหอพัก{" "}
              {isError && (
                <span className="animate-pulse text-[10px] font-medium normal-case">
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
          <div className="group relative flex flex-1 flex-col justify-center px-6 py-3 transition-colors md:border-r md:border-slate-100">
            <label className="mb-0.5 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <MapPin size={14} className="text-rose-500" />
              ทำเล / สถานที่ใกล้เคียง
            </label>
            <div className="relative">
              <select
                className="w-full cursor-pointer appearance-none truncate bg-transparent pr-4 text-sm font-semibold text-slate-700 placeholder:font-normal focus:outline-none md:text-base"
                value={location}
                onChange={handleLocationChange}
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
                  setPriceMin(
                    e.target.value === "" ? "" : Number(e.target.value),
                  );
                  setIsError(false);
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
                  setPriceMax(
                    e.target.value === "" ? "" : Number(e.target.value),
                  );
                  setIsError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchClick();
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 md:pl-0">
            <div
              className={`overflow-hidden transition-all duration-300 ${hasFilter ? "w-10 scale-100 opacity-100" : "w-0 scale-90 opacity-0"}`}
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
