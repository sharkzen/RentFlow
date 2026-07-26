"use client";
import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  children: React.ReactNode;
}

const POPOVER_WIDTH = 288;

export default function InfoTooltip({ children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const left = Math.min(
        rect.left,
        window.innerWidth - POPOVER_WIDTH - 12,
      );

      setPosition({ top: rect.bottom + 8, left: Math.max(left, 12) });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current?.contains(event.target as Node) ||
        popoverRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300"
      >
        <Info size={11} strokeWidth={2.5} />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: position.top,
              left: position.left,
              width: POPOVER_WIDTH,
            }}
            className="fixed z-9999 rounded-xl border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
