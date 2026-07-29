"use client";
import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  children: React.ReactNode;
}

const POPOVER_WIDTH = 288;
const VIEWPORT_MARGIN = 12;
const MIN_SPACE_BELOW = 160;

interface PopoverPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

export default function InfoTooltip({ children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [position, setPosition] = useState<PopoverPosition>({
    top: 0,
    left: 0,
    width: POPOVER_WIDTH,
    maxHeight: 400,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();

      if (!rect) return;

      const width = Math.min(
        POPOVER_WIDTH,
        window.innerWidth - VIEWPORT_MARGIN * 2,
      );
      const left = Math.min(
        rect.left,
        window.innerWidth - width - VIEWPORT_MARGIN,
      );
      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
      const spaceAbove = rect.top - VIEWPORT_MARGIN;
      const openAbove = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow;

      setPosition({
        left: Math.max(left, VIEWPORT_MARGIN),
        width,
        maxHeight: Math.max(openAbove ? spaceAbove : spaceBelow, 120),
        top: openAbove ? undefined : rect.bottom + 8,
        bottom: openAbove ? window.innerHeight - rect.top + 8 : undefined,
      });
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
        className={`bg-background text-muted hover:bg-border flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-colors ${!isOpen ? "animate-pulse hover:animate-none" : ""}`}
      >
        <Info size={11} strokeWidth={2.5} />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
            className="border-border bg-surface text-muted fixed z-9999 overflow-y-auto rounded-xl border p-3 text-xs leading-relaxed shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
