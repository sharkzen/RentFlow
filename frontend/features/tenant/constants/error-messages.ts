export const getTenantErrorMessage = (
  code?: string,
  defaultMsg?: string,
): string => {
  switch (code) {
    case "MISSING_REQUIRED_FIELDS":
      return "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน";
    case "INVALID_EMAIL_FORMAT":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "EMAIL_ALREADY_EXISTS":
      return "อีเมลนี้มีผู้ใช้งานแล้ว กรุณาใช้อีเมลอื่น";
    case "ROOM_NOT_AVAILABLE":
    case "ROOM_OCCUPIED":
      return "ห้องพักนี้ไม่ว่าง หรือมีผู้เช่าอยู่แล้วในขณะนี้";
    case "DORM_NOT_OWNED":
    case "OWNER_PROFILE_NOT_FOUND":
      return "คุณไม่มีสิทธิ์จัดการข้อมูลในหอพักนี้";
    case "USER_CREATION_FAILED":
      return "ไม่สามารถสร้างบัญชีผู้ใช้งานได้";
    case "INTERNAL_SERVER_ERROR":
      return "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง";
    default:
      return defaultMsg || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
  }
};
