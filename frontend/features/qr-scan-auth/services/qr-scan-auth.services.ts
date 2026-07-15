import { axios } from "@/lib/api-client";

export const QrScanAuthService = {
  /**
   * ==========================================
   * ฝั่งจัดการโดยเจ้าของหอพัก (Owner Management)
   * ==========================================
   */

  // 1. สร้าง QR Code ใหม่ หรือ รีเซ็ต Token เดิม (Upsert)
  // - ถ้าไม่เคยมี: ให้สร้าง Token ใหม่
  // - ถ้ามีอยู่แล้ว: ให้สุ่ม Token ใหม่แทนที่ของเดิม (อันเก่าจะใช้งานไม่ได้ทันที)
  createOrRenewQr: async (roomId: string) => {
    const response = await axios.post(
      `/api/rooms/${roomId}/qr-auth`,
      {},
      { responseType: "blob" }, // สำคัญ: ต้องใช้ blob เพื่อรับไฟล์ PDF
    );
    return response.data;
  },

  // สร้าง QR Code หลายห้องพร้อมกัน (โหลดเป็น PDF)
  generateBulkPdf: async (roomIds: string[]) => {
    const response = await axios.post(
      `/api/qr-auth/bulk-pdf`,
      { roomIds },
      { responseType: "blob" },
    );
    return response.data;
  },

  // เปิด/ปิด สถานะ QR Code
  toggleStatus: async (roomId: string, isActive: boolean) => {
    const response = await axios.patch(`/api/rooms/${roomId}/qr-auth/status`, {
      isActive,
    });
    return response.data;
  },

  /**
   * ==========================================
   * ฝั่งผู้เช่าสแกนเพื่อเข้าสู่ระบบ (Tenant Authentication)
   * ==========================================
   */

  // 4. ตรวจสอบ Token จาก QR Code และล็อกอิน
  // - เมื่อมือถือสแกน QR ระบบจะได้ URL เช่น https://domain.com/scan?token=xxxx
  // - หน้าบ้านจะดึง token ส่งมาที่ API นี้เพื่อตรวจสอบสิทธิ์และสร้าง Session/JWT
  verifyAndLogin: async (token: string) => {
    const response = await axios.post(`/api/auth/qr-login`, {
      token,
    });
    return response.data; // ควร return Access Token และข้อมูลผู้ใช้กลับมา
  },
};
