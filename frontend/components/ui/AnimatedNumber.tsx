"use client";
import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  decimals?: number;
}

export default function AnimatedNumber({
  value,
  duration = 1,
  decimals = 0,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numericValue =
      typeof value === "string"
        ? parseFloat(value.replace(/,/g, "")) || 0
        : value || 0;

    const controls = animate(0, numericValue, {
      duration: duration,
      ease: "easeOut",

      onUpdate(val: number) {
        setDisplayValue(val);
      },
    });

    return () => controls.stop();
  }, [value, duration]);

  return (
    <>
      {Number(displayValue.toFixed(decimals)).toLocaleString("th-TH", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}
