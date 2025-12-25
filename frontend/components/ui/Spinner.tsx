import * as React from "react";
import { cn } from "@/lib/utils";

const TICKS = 12;

function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-ios-spin relative h-5 w-5", className)}
    >
      {Array.from({ length: TICKS }).map((_, i) => (
        <span
          key={i}
          className="absolute top-1/2 left-1/2 block h-1.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
          style={{
            transform: `rotate(${i * 30}deg) translateY(-8px)`,
            opacity: (i + 1) / TICKS,
            animation: "ios-fade 1s linear infinite",
            animationDelay: `${i * (1 / TICKS)}s`,
          }}
        />
      ))}
    </div>
  );
}

export { Spinner };
