"use client";
import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

export const ShareButton: React.FC<{ title: string; text: string }> = ({
  title,
  text,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled the share sheet, nothing to do
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="border-border bg-foreground/5 text-foreground hover:bg-foreground/10 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors active:scale-95"
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "คัดลอกลิงก์แล้ว" : "แชร์ลิงก์หอพัก"}
    </button>
  );
};
