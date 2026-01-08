export type BillStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentStatus = "WAITING_VERIFY" | "VERIFIED" | "REJECTED";

export interface Bill {
  id: string;
  roomId: string;
  tenantId: string;
  tenantNameSnapshot: string;
  roomNumberSnapshot: string;
  roomPriceSnapshot: number;
  billingMonth: string;
  dueDate: string;
  waterUnitSnapshot: number;
  electricUnitSnapshot: number;
  waterRateSnapshot: number;
  electricRateSnapshot: number;
  commonFeeSnapshot: number;
  lateFeeSnapshot: number;
  total: number;
  status: BillStatus;
  archived: boolean;
  createdAt: string;
  room?: BillRoom;
  tenant?: BillTenant;
  payment?: Payment | null;
}

export interface BillRoom {
  id: string;
  dormitoryId: string;
  roomNumber: string;
  basePrice: number;
}

export interface BillTenant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface Payment {
  id: string;
  billId: string;
  status: PaymentStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  slips: PaymentSlip[];
  createdAt: string;
}

export interface PaymentSlip {
  id: string;
  objectKey: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface BillListResponse {
  items: Bill[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetBillsParams {
  dormId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: BillStatus;
  month?: string;
}

export interface CreateBillItem {
  roomId: string;
  waterUnit: number;
  electricUnit: number;
  commonFee?: number;
  otherFee?: number;
  note?: string;
}

export interface CreateBillPayload {
  dormId: string;
  billingMonth: string;
  items: CreateBillItem[];
}

export interface UpdateBillStatusPayload {
  billId: string;
  status: BillStatus;
}
