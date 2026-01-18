import axios from "axios";
import FormData from "form-data";
import logger from "@/utils/logger";

interface SlipOkData {
  transRef: string;
  sendingBank: string;
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
    displayName: string;
    name: string;
  };
}

interface SlipOkResponse {
  success: boolean;
  data: SlipOkData;
  code?: number;
  message?: string;
}

export const slipOkService = {
  verifySlip: async (fileBuffer: Buffer, amount?: number) => {
    const branchId = process.env.SLIPOK_BRANCH_ID;
    const apiKey = process.env.SLIPOK_API_KEY;

    if (!branchId || !apiKey) {
      logger.error("Missing SlipOK Configuration");
      throw new Error("SLIPOK_CONFIG_MISSING");
    }

    const form = new FormData();

    form.append("files", fileBuffer, {
      filename: "slip.jpg",
    });

    if (amount) {
      form.append("amount", amount);
    }

    form.append("log", "true");

    try {
      const url = `https://api.slipok.com/api/line/apikey/${branchId}`;

      const response = await axios.post<SlipOkResponse>(url, form, {
        headers: {
          "x-authorization": apiKey,
          ...form.getHeaders(),
        },
      });

      if (!response.data.success) {
        if (response.data.code === 1013) {
          throw new Error("SLIP_AMOUNT_MISMATCH");
        }

        const logicError: any = new Error("INVALID_SLIP");

        logicError.response = {
          data: response.data,
        };

        throw logicError;
      }

      const data = response.data.data;

      return {
        success: true,
        refNo: data.transRef,
        bankCode: data.sendingBank,
        amount: data.paidLocalAmount || data.amount,
        senderName: data.sender?.displayName || data.sender?.name,
        paidAt: parseSlipOkDate(data.transDate, data.transTime),
        rawData: data,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw error;
      }

      throw error;
    }
  },
};

function parseSlipOkDate(dateStr: string, timeStr: string): Date {
  if (!dateStr || !timeStr) return new Date();

  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return new Date(year, month, day, hours || 0, minutes || 0, seconds || 0);
}
