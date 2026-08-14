"use client";
import { useId, useRef, useState, useEffect } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();

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

  const focusOption = (index: number) => {
    const clamped = (index + options.length) % options.length;
    optionRefs.current[clamped]?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
      e.preventDefault();
      setIsOpen(true);
      requestAnimationFrame(() => focusOption(0));
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(index - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`bg-surface flex h-full w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold transition-all hover:border-blue-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 dark:border-gray-800 ${isOpen ? "border-blue-500" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span
            className={`truncate ${!selectedLabel ? "text-gray-400 dark:text-white" : "text-gray-700 dark:text-white"}`}
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
        <div
          id={listboxId}
          role="listbox"
          className="animate-in fade-in zoom-in-95 bg-background border-border absolute right-0 z-50 mt-2 w-full min-w-40 overflow-hidden rounded-xl border duration-200 dark:border-gray-800"
        >
          <div className="custom-scrollbar max-h-60 overflow-y-auto">
            {options.map((option, index) => {
              const isActive = option.value === value;

              return (
                <button
                  key={option.value}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors dark:text-white ${isActive ? "bg-blue-50 font-semibold text-blue-600 dark:bg-gray-800" : "text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"}`}
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
