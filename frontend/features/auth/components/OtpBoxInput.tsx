"use client";
import React, { useEffect, useRef } from "react";

type OtpBoxInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function OtpBoxInput({
  length,
  value,
  onChange,
  disabled,
  autoFocus,
}: OtpBoxInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus]);

  const setDigitAt = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");

    if (!cleaned) {
      setDigitAt(index, "");
      return;
    }

    if (cleaned.length > 1) {
      const next = digits.slice();
      let cursor = index;

      for (const char of cleaned) {
        if (cursor >= length) break;
        next[cursor] = char;
        cursor += 1;
      }

      onChange(next.join("").slice(0, length));
      const focusIndex = Math.min(cursor, length - 1);
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    setDigitAt(index, cleaned);

    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigitAt(index, "");
        return;
      }

      if (index > 0) {
        e.preventDefault();
        inputsRef.current[index - 1]?.focus();
        setDigitAt(index - 1, "");
      }

      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    handleChange(index, pasted);
  };

  return (
    <div
      className="flex justify-center gap-2 sm:gap-3"
      onPaste={(e) => handlePaste(0, e)}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 rounded-lg border border-slate-300 text-center font-mono text-2xl font-semibold text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}
