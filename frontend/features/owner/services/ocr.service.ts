const OCR_SERVER = process.env.NEXT_PUBLIC_OCR_SERVER_URL ?? "";

export interface MeterScanResult {
  success: boolean;
  value: number | null;
  message: string;
}

export const MeterOcrService = {
  async scanMeter(base64Image: string): Promise<MeterScanResult> {
    const blob = base64ToBlob(base64Image, "image/jpeg");
    const form = new FormData();
    form.append("file", blob, "meter.jpg");

    try {
      const res = await fetch(`${OCR_SERVER}/ocr/scan`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        return {
          success: false,
          value: null,
          message: "Server error",
        };
      }

      const data = await res.json();
      const rawValue = data.value;

      if (rawValue && rawValue.trim() !== "") {
        return {
          success: true,
          value: Number(rawValue),
          message: "อ่านสำเร็จ",
        };
      } else {
        return {
          success: false,
          value: null,
          message: "อ่านตัวเลขไม่ได้ กรุณาเล็งใหม่อีกครั้ง",
        };
      }
    } catch (error) {
      return {
        success: false,
        value: null,
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      };
    }
  },
};

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64.split(",")[1] ?? base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], {
    type: mimeType,
  });
}
