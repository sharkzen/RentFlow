"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface PrivacyConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  // เพิ่มค่าทุกครั้งที่ผู้ใช้กดส่งฟอร์มโดยยังไม่ติ๊ก เพื่อให้กล่องสั่นเตือน
  shakeKey?: number;
  showError?: boolean;
  id?: string;
  children: React.ReactNode;
}

export default function PrivacyConsent({
  checked,
  onChange,
  shakeKey = 0,
  showError = false,
  id = "privacy-consent",
  children,
}: PrivacyConsentProps) {
  return (
    <div className="space-y-1">
      <motion.div
        key={shakeKey}
        animate={
          shakeKey > 0 && showError && !checked
            ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.45 }}
        className={`flex items-start gap-3 rounded-xl border p-3 transition-colors duration-300 ${
          checked
            ? "border-emerald-500/50 bg-emerald-500/5"
            : showError
              ? "border-red-500/60 bg-red-500/5"
              : "border-border bg-background"
        }`}
      >
        <label
          htmlFor={id}
          className="relative mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center"
        >
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />

          <AnimatePresence>
            {checked && (
              <motion.span
                key="ripple"
                initial={{ scale: 0.6, opacity: 0.5 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-md bg-emerald-500"
              />
            )}
          </AnimatePresence>

          <motion.span
            animate={{ scale: checked ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className={`relative flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400 peer-focus-visible:ring-offset-2 ${
              checked
                ? "border-emerald-500 bg-emerald-500"
                : showError
                  ? "bg-surface border-red-500"
                  : "border-border bg-surface"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                initial={false}
                animate={{
                  pathLength: checked ? 1 : 0,
                  opacity: checked ? 1 : 0,
                }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              />
            </svg>
          </motion.span>
        </label>

        <div className="text-foreground min-w-0 flex-1 text-sm leading-relaxed">
          <span className="mr-1 inline-flex align-middle">
            <ShieldCheck
              className={`h-4 w-4 transition-colors duration-300 ${checked ? "text-emerald-500" : "text-muted"}`}
            />
          </span>
          {children}{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 underline-offset-2 hover:underline"
          >
            อ่านนโยบายความเป็นส่วนตัว
          </Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {showError && !checked && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-600"
          >
            กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนดำเนินการต่อ
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
