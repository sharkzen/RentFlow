export const OcrSpaceService = {
  scanMeter: async (
    imageBase64: string,
  ): Promise<{
    success: boolean;
    value?: number;
    message?: string;
  }> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OCR_SPACE_KEY || "helloworld";
      const formData = new FormData();
      formData.append("base64Image", imageBase64);
      formData.append("language", "eng");
      formData.append("OCREngine", "2");
      formData.append("scale", "true");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",

        headers: {
          apikey: apiKey,
        },

        body: formData,
      });

      const data = await response.json();

      if (data.IsErroredOnProcessing) {
        console.error("❌ OCR.space API Error:", data.ErrorMessage);

        return {
          success: false,
          message: "เซิร์ฟเวอร์ OCR มีปัญหา กรุณาลองใหม่",
        };
      }

      const parsedText = data.ParsedResults?.[0]?.ParsedText || "";
      console.log("🔍 [OCR.space Raw Output]:", parsedText);
      const cleanedValue = parsedText.replace(/[^0-9]/g, "");
      console.log("🧹 [Cleaned Value]:", cleanedValue);

      if (cleanedValue && cleanedValue !== "0") {
        return {
          success: true,
          value: parseInt(cleanedValue, 10),
        };
      } else {
        return {
          success: false,
          message: "อ่านเลขไม่ออก กรุณาเล็งแค่ตัวเลขเน้นๆ แล้วถ่ายใหม่",
        };
      }
    } catch (error: any) {
      console.error("❌ OCR Exception:", error);

      return {
        success: false,
        message: `ระบบขัดข้อง: ${error.message || "เชื่อมต่อไม่สำเร็จ"}`,
      };
    }
  },
};
