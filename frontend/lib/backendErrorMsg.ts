import { errorMessageMap } from "@/lib/errorMessage";

export function showBackendError(code?: string) {
  return errorMessageMap[code ?? ""] ?? "เกิดข้อผิดพลาดลองใหม่ภายหลัง";
}
