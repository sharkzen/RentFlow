"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: any) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  icon,
  className = "",
  disabled = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-full w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold transition-all hover:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 ${isOpen ? "border-blue-500 ring-2 ring-blue-100" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span
            className={`truncate ${!selectedLabel ? "text-gray-400" : "text-gray-700"}`}
          >
            {selectedLabel || placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-full min-w-40 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 duration-200">
          <div className="custom-scrollbar max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isActive = option.value === value;

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${isActive ? "bg-blue-50 font-semibold text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isActive && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-3 text-center text-sm text-gray-400">
                ไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
