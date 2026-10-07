export const errorMessageMap: Record<string, string> = {
  INTERNAL_SERVER_ERROR: "เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง",
  DATA_ARE_NOT_VALID: "ข้อมูลไม่ครบหรือไม่ถูกต้อง",
  EMAIL_ALREADY_EXISTS: "อีเมลนี้ถูกใช้งานแล้ว",
  INVALID_MAP_URL: "ลิงก์ Google Map ไม่ถูกต้อง",
  MAP_LINK_UNRESOLVED:
    "ไม่สามารถอ่านพิกัดจากลิงก์/ข้อความที่กรอกได้ กรุณาปักหมุดใหม่แล้วคัดลอกลิงก์จากแถบ URL หรือกรอกพิกัด (ละติจูด, ลองจิจูด) แทน",
  INVALID_EMAIL_OR_PASSWORD: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  INVALID_CURRENT_PASSWORD: "รหัสผ่านเดิมไม่ถูกต้อง",
  INVALID_NEW_PASSWORD:
    "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัว เป็นตัวอักษรอังกฤษและตัวเลขเท่านั้น",
  NEW_PASSWORD_SAME_AS_CURRENT: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
  UNAUTHORIZED: "ไม่สามารถเข้าถึงข้อมูลได้ กรุณาลองใหม่ภายหลัง",
  FORBIDDEN: "ไม่สามารถเข้าถึงข้อมูลได้ กรุณาลองใหม่ภายหลัง",
  INVALID_TOKEN: "ไม่สามารถเข้าถึงข้อมูลได้ กรุณาลองใหม่ภายหลัง",
  CREATE_FAILED: "ไม่สามารถสร้างข้อมูลได้ กรุณาลองใหม่ภายหลัง",
  UPDATE_FAILED: "ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่ภายหลัง",
  DELETE_FAILED: "ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่ภายหลัง",
  UPLOAD_FAILED: "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่ภายหลัง",
  REORDER_FAILED: "ไม่สามารถเรียงลำดับรูปภาพได้ กรุณาลองใหม่ภายหลัง",
  FAILED_TO_FETCH_IMAGES: "ไม่สามารถดึงข้อมูลรูปภาพได้ กรุณาลองใหม่ภายหลัง",
  UPDATE_STATUS_FAILED:
    "ไม่สามารถเปลี่ยนสถานะการเผยแพร่ได้ กรุณาลองใหม่ภายหลัง",
  DORM_ID_REQUIRED: "ไม่พบรหัสหอพัก",
  INVALID_DORM_ID: "รหัสหอพักไม่ถูกต้อง",
  INVALID_PAYLOAD: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
  DORM_NOT_FOUND: "ไม่พบข้อมูลหอพัก",
  NOT_FOUND: "ไม่พบข้อมูลที่ร้องขอ",
  TENANTS_NOT_FOUND: "ไม่พบข้อมูลผู้เช่า",
  NAME_REQUIRED: "กรุณากรอกชื่อหอพัก",
  CREATE_SUCCESS: "สร้างห้องพักสำเร็จ",
  CREATE_PARTIAL_SUCCESS: "บางห้องถูกสร้างไม่สำเร็จ",
  DUPLICATE_ROOMS: "มีห้องซ้ำในระบบ",
  DUPLICATE_ROOM_NUMBER: "เลขห้องนี้มีอยู่ในระบบแล้ว กรุณาใช้เลขอื่น",
  ROOM_NOT_FOUND: "ไม่พบข้อมูลห้องพัก",
  CANNOT_CHANGE_STATUS_OCCUPIED:
    "ห้องมีผู้เช่าอยู่ ไม่สามารถเปลี่ยนสถานะได้ กรุณาแจ้งย้ายออกก่อน",
  CANNOT_SET_STATUS_TO_OCCUPIED_MANUALLY:
    "ไม่สามารถตั้งสถานะมีผู้เช่าโดยตรงได้ กรุณาไปที่เมนูจัดการผู้เช่า",
  CANNOT_DELETE_PAID_BILL:
    "ไม่สามารถลบบิลที่ชำระเงินแล้วได้ เพื่อรักษาประวัติการเงิน",
  DORM_NOT_READY_FOR_PUBLISH:
    "ยังเผยแพร่ไม่ได้ กรุณากรอกเบอร์ติดต่ออย่างน้อย 1 เบอร์, Line หรือ Facebook อย่างน้อย 1 ช่องทาง และเพิ่มรูปภาพหอพักอย่างน้อย 1 รูป",

  // แพ็คเกจ / การชำระเงิน
  VALIDATION_ERROR: "ข้อมูลไม่ครบหรือไม่ถูกต้อง",
  RATE_LIMIT_EXCEEDED: "ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
  TOO_MANY_REQUESTS: "ส่งสลิปถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
  SUBSCRIPTION_READ_ONLY:
    "แพ็คเกจหมดอายุ ใช้งานได้แบบอ่านอย่างเดียว กรุณาต่ออายุเพื่อเพิ่มหอหรือห้อง",
  DORM_LIMIT_REACHED:
    "สร้างหอพักครบตามแพ็คเกจแล้ว กรุณาอัปเกรดแพ็คเกจเพื่อเพิ่มหอ",
  ROOM_LIMIT_REACHED:
    "จำนวนห้องเกินโควต้าแพ็คเกจ กรุณาอัปเกรดแพ็คเกจเพื่อเพิ่มห้อง",
  SUBSCRIPTION_REQUIRED:
    "ฟีเจอร์นี้ต้องใช้แพ็คเกจ กรุณารับทดลองใช้ฟรีหรือเลือกแพ็คเกจ",
  OCR_NOT_IN_PLAN:
    "แพ็คเกจของคุณไม่รวมการสแกนมิเตอร์ด้วย OCR กรุณาอัปเกรดแพ็คเกจ",
  OWNER_NOT_APPROVED: "บัญชีต้องได้รับการอนุมัติก่อนจึงจะซื้อแพ็คเกจได้",
  PLAN_NOT_AVAILABLE: "แพ็คเกจนี้ไม่เปิดขายแล้ว",
  PLAN_NOT_FOUND: "ไม่พบแพ็คเกจ",
  COUPON_INVALID: "คูปองไม่ถูกต้อง หมดอายุ หรือใช้ครบสิทธิ์แล้ว",
  COUPON_CODE_EXISTS: "รหัสคูปองนี้มีอยู่แล้ว",
  COUPON_NOT_FOUND: "ไม่พบคูปอง",
  DORM_NOT_PROMOTABLE: "โปรโมทได้เฉพาะหอพักที่อนุมัติแล้วและเผยแพร่อยู่",
  PROMOTION_ALREADY_ACTIVE: "หอนี้กำลังโปรโมทอยู่ ซื้อใหม่ได้เมื่อหมดเวลา",
  PROMOTION_IN_REVIEW: "หอนี้มีคำสั่งซื้อที่รอแอดมินตรวจสอบอยู่",
  PROMOTION_SLOTS_FULL: "ช่องโปรโมทเต็มแล้ว กรุณารอจนกว่าจะมีหอหมดเวลา",
  PROMOTION_HOLD_EXPIRED:
    "หมดเวลาจองช่องและช่องเต็มแล้ว กรุณาติดต่อผู้ดูแลหากโอนเงินไปแล้ว",
  ORDER_NOT_FOUND: "ไม่พบคำสั่งซื้อ",
  ORDER_NOT_PAYABLE: "คำสั่งซื้อนี้ชำระหรือหมดอายุไปแล้ว",
  ORDER_NOT_IN_REVIEW: "คำสั่งซื้อนี้ไม่ได้อยู่ระหว่างรอตรวจสอบ",
  PAYMENT_NOT_CONFIGURED:
    "ระบบยังไม่ได้ตั้งค่าบัญชีรับเงิน กรุณาติดต่อผู้ดูแล",
  SLIP_AMOUNT_MISMATCH: "ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ",
  SLIP_DUPLICATE_REF: "สลิปนี้เคยถูกใช้ไปแล้ว",
  INVALID_SLIP: "ไฟล์ที่ส่งไม่ใช่สลิปโอนเงินที่ถูกต้อง",
  INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP",
  FILE_REQUIRED: "กรุณาอัปโหลดรูปภาพสลิป",
  TRIAL_NOT_AVAILABLE: "ขณะนี้ไม่มีสิทธิ์ทดลองใช้ฟรี",
  TRIAL_ALREADY_USED: "คุณใช้สิทธิ์ทดลองไปแล้ว",
  FREE_PLAN_EXISTS: "มีแพ็คเกจฟรีอยู่แล้ว แก้ไขตัวเดิมแทน",
  FREE_PLAN_REQUIRED: "ต้องมีแพ็คเกจฟรีอย่างน้อย 1 ตัว",
  INVALID_TRIAL_PLAN:
    "แพ็คเกจทดลองต้องเป็นแพ็คเกจที่มีอยู่และไม่ใช่แพ็คฟรี",
};

/** ดึงข้อความไทยจาก error ของ axios (backend ส่ง { message: CODE }) */
export function getApiErrorMessage(error: unknown, fallback?: string) {
  const code = (error as any)?.response?.data?.message as string | undefined;
  return errorMessageMap[code ?? ""] ?? fallback ?? showBackendError(code);
}

export function showBackendError(code?: string) {
  return errorMessageMap[code ?? ""] ?? "เกิดข้อผิดพลาดลองใหม่ภายหลัง";
}
