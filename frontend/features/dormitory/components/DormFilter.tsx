"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Banknote,
  RotateCcw,
  Building2,
  ChevronDown,
  Check,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const filteredGroupedLandmarks = Object.entries(groupedLandmarks).reduce(
    (acc, [type, items]) => {
      const filteredItems = items.filter((lm) =>
        lm.name.toLowerCase().includes(locationSearch.toLowerCase()),
      );

      if (filteredItems.length > 0) {
        acc[type] = filteredItems;
      }

      return acc;
    },
    {} as Record<string, Landmark[]>,
  );

  const executeSearch = (
    overrides?: {
      search?: string;
      landmarkId?: string;
      minPrice?: number | "";
      maxPrice?: number | "";
    },
    doScroll: boolean = true,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentName =
      overrides?.search !== undefined ? overrides.search : name;
    const currentLocation =
      overrides?.landmarkId !== undefined ? overrides.landmarkId : location;
    const currentMin =
      overrides?.minPrice !== undefined ? overrides.minPrice : priceMin;
    const currentMax =
      overrides?.maxPrice !== undefined ? overrides.maxPrice : priceMax;

    if (currentName) params.set("search", currentName);
    else params.delete("search");

    if (currentLocation) params.set("landmarkId", currentLocation);
    else params.delete("landmarkId");

    if (currentMin !== "") params.set("minPrice", String(currentMin));
    else params.delete("minPrice");

    if (currentMax !== "") params.set("maxPrice", String(currentMax));
    else params.delete("maxPrice");

    router.push(`/?${params.toString()}`, {
      scroll: false,
    });

    if (doScroll) {
      setTimeout(() => {
        scroller.scrollTo("dorm-filter", {
          duration: 800,
          delay: 0,
          smooth: "easeInOutQuart",
          offset: -90,
        });
      }, 100);
    }
  };

  const handleReset = () => {
    setName("");
    setIsError(false);
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    setLocationSearch("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("landmarkId");
    params.delete("minPrice");
    params.delete("maxPrice");

    router.push(`/?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleSearchClick = () => {
    const isEmpty =
      !name.trim() && !location && priceMin === "" && priceMax === "";

    if (isEmpty) {
      const hasUrlParams =
        searchParams.get("search") ||
        searchParams.get("landmarkId") ||
        searchParams.get("minPrice") ||
        searchParams.get("maxPrice");

      if (hasUrlParams) {
        handleReset();
      } else {
        setIsError(true);
        inputRef.current?.focus();
      }

      return;
    }

    executeSearch();
  };

  const handleSelectLocation = (id: string) => {
    setLocation(id);
    setIsError(false);
    setIsDropdownOpen(false);
    setLocationSearch("");

    executeSearch({
      landmarkId: id,
    });
  };

  const hasFilter = name || location || priceMin !== "" || priceMax !== "";
  const displayLocationName = location
    ? landmarks.find((l) => l.id === location)?.name || "กำลังโหลด..."
    : "ทั้งหมด";

  return (
    <Element name="dorm-filter">
      <div
        suppressHydrationWarning
        data-aos="fade-up"
        className="relative z-20 mx-auto my-8 w-full"
      >
        <div className="bg-surface ring-border flex flex-col p-2 ring-1 sm:rounded-3xl md:flex-row md:items-center md:p-1.5">
          <div
            className={`border-border group relative flex flex-1 flex-col justify-center px-6 py-3 transition-all md:rounded-l-full md:border-r`}
          >
            <label
              className={`mb-0.5 flex items-center gap-2 text-xs font-bold tracking-wider uppercase ${isError ? "text-red-600" : "text-muted"}`}
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
              className="text-foreground placeholder:text-muted w-full truncate bg-transparent text-sm font-semibold placeholder:font-normal focus:outline-none md:text-base"
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);

                if (val) setIsError(false);

                if (val === "")
                  executeSearch(
                    {
                      search: "",
                    },
                    false,
                  );
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchClick();
              }}
            />
          </div>
          <div
            ref={dropdownRef}
            className="border-border group relative flex flex-1 flex-col justify-center px-6 py-3 transition-colors md:border-r"
          >
            <label className="text-muted my-1 flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
              <MapPin size={14} className="text-rose-500" />
              ทำเล / สถานที่ใกล้เคียง
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-foreground flex w-full cursor-pointer items-center justify-between bg-transparent text-sm font-semibold focus:outline-none md:text-base"
              >
                <span className="truncate pr-4">{displayLocationName}</span>
                <ChevronDown
                  size={14}
                  className={`text-muted transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="border-border bg-surface absolute top-full left-0 z-[100] mt-3 w-full min-w-[240px] overflow-hidden rounded-xl border shadow-xl md:-left-4 md:w-[120%]">
                  <div className="border-border bg-background border-b p-2">
                    <div className="relative">
                      <Search className="text-muted absolute top-2.5 left-3 h-4 w-4" />
                      <input
                        type="text"
                        className="bg-surface text-foreground ring-border h-9 w-full rounded-lg pr-3 pl-9 text-sm ring-1 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                        placeholder="ค้นหาสถานที่..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1">
                    <button
                      type="button"
                      onClick={() => handleSelectLocation("")}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${location === "" ? "bg-rose-50 font-semibold text-rose-600" : "text-muted hover:bg-background"}`}
                    >
                      ทั้งหมด
                      {location === "" && <Check size={16} />}
                    </button>
                    {Object.keys(filteredGroupedLandmarks).length > 0 ? (
                      Object.entries(filteredGroupedLandmarks).map(
                        ([type, items]) => (
                          <div key={type} className="mt-2">
                            <div className="text-muted px-3 py-1 text-xs font-bold tracking-wider uppercase">
                              {type}
                            </div>
                            {items.map((lm) => (
                              <button
                                key={lm.id}
                                type="button"
                                onClick={() => handleSelectLocation(lm.id)}
                                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${location === lm.id ? "bg-rose-50 font-semibold text-rose-600" : "text-muted hover:bg-background"}`}
                              >
                                <span className="truncate">{lm.name}</span>
                                {location === lm.id && <Check size={16} />}
                              </button>
                            ))}
                          </div>
                        ),
                      )
                    ) : (
                      <div className="text-muted py-4 text-center text-sm">
                        ไม่พบสถานที่
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="group relative flex flex-[1.3] flex-col justify-center px-6 py-3 transition-colors">
            <label className="text-muted mb-0.5 flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
              <Banknote size={14} className="text-emerald-500" />
              ช่วงราคา (บาท)
            </label>
            <div className="flex items-center gap-2">
              <input
                min={0}
                type="number"
                placeholder="ต่ำสุด"
                className="text-foreground placeholder:text-muted flex w-full min-w-15 items-center bg-transparent text-sm font-semibold placeholder:font-normal focus:outline-none md:text-base"
                value={priceMin}
                onChange={(e) => {
                  const val =
                    e.target.value === "" ? "" : Number(e.target.value);
                  setPriceMin(val);
                  setIsError(false);

                  if (val === "")
                    executeSearch(
                      {
                        minPrice: "",
                      },
                      false,
                    );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchClick();
                }}
              />
              <span className="text-muted">-</span>
              <input
                min={0}
                type="number"
                placeholder="สูงสุด"
                className="text-foreground placeholder:text-muted w-full min-w-15 bg-transparent text-sm font-semibold placeholder:font-normal focus:outline-none md:text-base"
                value={priceMax}
                onChange={(e) => {
                  const val =
                    e.target.value === "" ? "" : Number(e.target.value);
                  setPriceMax(val);
                  setIsError(false);

                  if (val === "")
                    executeSearch(
                      {
                        maxPrice: "",
                      },
                      false,
                    );
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
                className="bg-background text-muted flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-rose-100 hover:text-rose-600 active:scale-95"
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
