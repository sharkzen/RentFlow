export enum EmailType {
  NEW_BILL = "NEW_BILL",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  REPAIR_REQUEST = "REPAIR_REQUEST",
  RESET_PASSWORD = "RESET_PASSWORD",
}

export interface EmailJobData {
  type: EmailType;
  to?: string;
  senderName?: string;
  replyTo?: string;
  data: any;
}
