import axios from "axios";
import FormData from "form-data";
import logger from "@/utils/logger";
import { env } from "@/config/env";

interface SlipOkData {
  transRef: string;
  sendingBank: string;
  receivingBank?: string;
  amount: number;
  paidLocalAmount?: number;
  transDate: string;
  transTime: string;
  transTimestamp?: string;
  sender: {
    displayName: string;
    name: string;
    account?: {
      value: string;
    };
  };
  receiver: {
    displayName?: string;
    name?: string;
    proxy?: {
      type: string;
      value: string;
    };
    account?: {
      bank: string;
      value: string;
    };
  };
}

interface SlipOkResponse {
  success: boolean;
  data: SlipOkData;
  code?: number;
  message?: string;
}

const mapSlipData = (data: SlipOkData) => {
  return {
    success: true,
    refNo: data.transRef,
    bankCode: data.sendingBank,
    receivingBank: data.receivingBank || null,
    amount: data.paidLocalAmount || data.amount,
    senderName: data.sender?.displayName || data.sender?.name,
    paidAt: parseSlipOkDate(data.transDate, data.transTime),
    receiverAccount: data.receiver?.account?.value || null,
    receiverProxy: data.receiver?.proxy?.value || null,
    receiverName: data.receiver?.displayName || data.receiver?.name,
    rawData: data,
  };
};

export const slipOkService = {
  verifySlip: async (fileBuffer: Buffer, amount?: number) => {
    const branchId = env.SLIPOK_BRANCH_ID;
    const apiKey = env.SLIPOK_API_KEY;

    if (!branchId || !apiKey) {
      logger.error("Missing SlipOK Configuration");
      throw new Error("SLIPOK_CONFIG_MISSING");
    }

    const form = new FormData();

    form.append("files", fileBuffer, {
      filename: "slip.jpg",
      contentType: "image/jpeg",
    });

    if (amount) {
      form.append("amount", amount);
    }

    // ไม่ส่ง log: SlipOK ไม่เก็บสลิปและไม่เช็คบัญชีผู้รับ เราเทียบบัญชีและกันสลิปซ้ำเอง

    try {
      const url = `https://api.slipok.com/api/line/apikey/${branchId}`;

      const response = await axios.post<SlipOkResponse>(url, form, {
        headers: {
          "x-authorization": apiKey,
          ...form.getHeaders(),
        },
        timeout: SLIPOK_TIMEOUT_MS,
      });

      if (!response.data.success) {
        throw classifySlipOkError(response.data.code, response.data);
      }

      return mapSlipData(response.data.data);
    } catch (error: any) {
      if (!axios.isAxiosError(error)) {
        if (
          error instanceof Error &&
          (SLIP_REJECT_ERRORS.has(error.message) ||
            error.message === "SLIPOK_UNAVAILABLE")
        ) {
          throw error;
        }

        logger.error(`SlipOK unexpected error: ${error}`);
        throw new Error("SLIPOK_UNAVAILABLE");
      }

      const responseBody = error.response?.data;
      const statusCode = error.response?.status;

      if (responseBody?.code === 1014 && responseBody?.data?.success === true) {
        logger.warn(
          "SlipOK Code 1014: Receiver mismatch but slip is valid. Proceeding with data.",
        );

        return mapSlipData(responseBody.data);
      }

      logger.error(
        `SlipOK API Error [${statusCode ?? error.code}]: ${JSON.stringify(responseBody, null, 2)}`,
      );

      throw classifySlipOkError(responseBody?.code, responseBody);
    }
  },
};

const SLIPOK_TIMEOUT_MS = 20000;

// ความผิดที่เกิดจากสลิปเอง ผู้เช่าต้องแก้และส่งใหม่
const SLIP_REJECT_ERRORS = new Set([
  "SLIP_AMOUNT_MISMATCH",
  "SLIP_DUPLICATE_REF",
  "INVALID_SLIP",
]);

// รหัส 1005-1008, 1011: ไฟล์ไม่ใช่สลิป / ไม่มี QR / QR ไม่ถูกต้องหรือหมดอายุ
const INVALID_SLIP_CODES = new Set([1005, 1006, 1007, 1008, 1011]);

// ที่เหลือทั้งหมด (config, package, โควตา, ธนาคารขัดข้อง 1009, สลิปรอธนาคาร 1010,
// 5xx, timeout) เป็นปัญหาฝั่งระบบ ไม่ใช่ความผิดผู้เช่า จึงให้ไปรอเจ้าของหอตรวจ
function classifySlipOkError(code: number | undefined, body?: unknown): Error {
  if (code === 1013) return new Error("SLIP_AMOUNT_MISMATCH");
  if (code === 1012) return new Error("SLIP_DUPLICATE_REF");
  if (code !== undefined && INVALID_SLIP_CODES.has(code)) {
    return new Error("INVALID_SLIP");
  }

  logger.warn(
    `SlipOK unavailable, falling back to manual verification (code=${code}): ${JSON.stringify(body)}`,
  );

  return new Error("SLIPOK_UNAVAILABLE");
}

// เวลาในสลิปเป็นเวลาไทย (UTC+7) แปลงให้ถูกต้องไม่ว่าเซิร์ฟเวอร์จะตั้ง timezone ใด
function parseSlipOkDate(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr || !/^\d{8}$/.test(dateStr)) return null;

  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  const pad = (n: number | undefined) => String(n || 0).padStart(2, "0");

  const date = new Date(
    `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}+07:00`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}
