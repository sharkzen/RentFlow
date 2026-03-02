export enum EmailType {
  NEW_BILL = "NEW_BILL",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  REPAIR_REQUEST = "REPAIR_REQUEST",
  RESET_PASSWORD = "RESET_PASSWORD",
  OWNER_APPROVED = "OWNER_APPROVED",
  OWNER_REJECTED = "OWNER_REJECTED",
}

export interface EmailJobData {
  type: EmailType;
  to?: string;
  senderName?: string;
  replyTo?: string;
  data: any;
}
