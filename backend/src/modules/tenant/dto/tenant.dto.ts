export type VerifiedPaymentData = {
  refNo: string | null;
  amount: number | null;
  bankCode: string | null;
  senderName: string | null;
  paidAt: Date | null;
};

export type SlipApiErrorResponse = {
  code: number;
  message: string;
  data?: {
    success: boolean;
    transRef: string;
    sendingBank: string;
    paidLocalAmount?: number;
    amount?: number;
    transTimestamp: string;
    sender?: {
      displayName?: string;
      name?: string;
    };
  };
};

export interface CreateMaintenanceParams {
  userId: string;
  title: string;
  description: string;
  files?: Array<{
    filename: string;
    mimetype: string;
    file: Buffer;
  }>;
}
