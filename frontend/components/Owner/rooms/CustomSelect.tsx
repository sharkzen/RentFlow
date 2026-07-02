import { CustomSelectProps } from "@/features/room/types";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const CustomSelect = ({
  value,
  onChange,
  options,
  disabled = false,
  icon,
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      {icon && (
        <div className="absolute top-2.5 left-3 text-gray-400">{icon}</div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          !disabled && setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all outline-none ${icon ? "pl-10" : ""} ${disabled ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400" : isOpen ? "border-blue-500 bg-white ring-2 ring-blue-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption?.label || "เลือกข้อมูล"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 duration-100">
          <ul className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={option.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${option.value === value ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-50"} ${option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  {option.value === value && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
