"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AiTwotoneQuestionCircle } from "react-icons/ai";

interface InfoTooltipProps {
  children: React.ReactNode;
  fullscreen?: boolean;
}

export default function InfoTooltip({
  children,
  fullscreen = false,
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const toggleTooltip = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        buttonRef.current?.contains(event.target as Node) ||
        popoverRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        tabIndex={-1}
        ref={buttonRef}
        type="button"
        onClick={toggleTooltip}
        className={`text-muted hover:bg-border flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${!isOpen ? "animate-pulse hover:animate-none" : ""}`}
      >
        <AiTwotoneQuestionCircle size={20} />
      </button>
      {isOpen &&
        createPortal(
          <div
            className={`fixed inset-0 z-9999 flex items-center justify-center ${fullscreen ? "" : "p-4"}`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-0 bg-black/40 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={popoverRef}
              className={`animate-in fade-in zoom-in-95 bg-surface relative ${fullscreen ? "flex h-full max-h-full w-full max-w-full flex-col overflow-hidden p-4 sm:h-[95vh] sm:max-w-3xl sm:rounded-xl sm:p-6" : "max-h-[90vh] w-full max-w-[320px] overflow-y-auto p-4"}`}
            >
              {!fullscreen && <div className="mt-2">{children}</div>}
              {fullscreen && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-muted hover:bg-border absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-lg"
                  >
                    ✕
                  </button>
                  <div className="mt-6 min-h-0 flex-1">{children}</div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
