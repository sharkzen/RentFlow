import React from "react";
import Link from "next/link";
import { showBackendError } from "@/lib/backendError";

/** error ที่แก้ได้ด้วยการอัปเกรดแพ็คเกจ จึงแนบลิงก์ไปหน้าแพ็คเกจให้ในข้อความ */
const UPGRADE_CODES = new Set([
  "DORM_LIMIT_REACHED",
  "ROOM_LIMIT_REACHED",
  "SUBSCRIPTION_REQUIRED",
  "SUBSCRIPTION_READ_ONLY",
  "OCR_NOT_IN_PLAN",
]);

/** ข้อความ error สำหรับ toast: ถ้าแก้ได้ด้วยการอัปเกรดจะมีลิงก์ "ดูแพ็คเกจ" ต่อท้าย */
export function apiErrorRender(code?: string): React.ReactNode {
  const message = showBackendError(code);

  if (!code || !UPGRADE_CODES.has(code)) return message;

  return (
    <span>
      {message}{" "}
      <Link
        href="/owner/billing"
        className="font-semibold text-blue-600 underline"
      >
        ดูแพ็คเกจ
      </Link>
    </span>
  );
}
