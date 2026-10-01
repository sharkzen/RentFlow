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
};

export function showBackendError(code?: string) {
  return errorMessageMap[code ?? ""] ?? "เกิดข้อผิดพลาดลองใหม่ภายหลัง";
}
