import { toast } from "react-toastify";
import { errorMessageMap } from "@/lib/errorMessage";

export function showBackendError(error: any) {
  const code = error?.response?.data?.message;

  const message = errorMessageMap[code] ?? "เกิดข้อผิดพลาดลองใหม่ภายหลัง";

  toast.error(message);
}
