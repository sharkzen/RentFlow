export type BillStatus =
  | "PENDING"
  | "WAITING_FOR_VERIFICATION"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";
export type PaymentStatus = "WAITING_VERIFY" | "VERIFIED" | "REJECTED";
export type BillItemType = "CHARGE" | "DISCOUNT";

export interface BillItem {
  id: string;
  billId?: string;
  name: string;
  amount: number;
  type: BillItemType;
  createdAt?: string;
}

export interface Bill {
  id: string;
  roomId: string;
  tenantId: string;
  tenantNameSnapshot: string;
  roomNumberSnapshot: string;
  roomPriceSnapshot: number;
  billingMonth: string;
  dueDate: string;
  prevWaterUnitSnapshot: number;
  currentWaterUnitSnapshot: number;
  waterUsedSnapshot: number;
  waterRateSnapshot: number;
  waterFeeSnapshot: number;
  prevElectricUnitSnapshot: number;
  currentElectricUnitSnapshot: number;
  electricUsedSnapshot: number;
  electricRateSnapshot: number;
  electricFeeSnapshot: number;
  commonFeeSnapshot: number;
  lateFeeSnapshot: number;
  total: number;
  note?: string | null;
  status: BillStatus;
  archived: boolean;
  createdAt: string;
  room?: BillRoom;
  tenant?: BillTenant;
  payment?: Payment | null;
  items?: BillItem[];
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
  advancePayment: number;
}

export interface Payment {
  id: string;
  billId: string;
  status: PaymentStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  slips: PaymentSlip[];
  updatedAt: string;
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
  status?: BillStatus | "ALL";
  month?: string;
}

export interface CreateBillItem {
  roomId: string;
  prevWater: number;
  currentWater: number;
  prevElectric: number;
  currentElectric: number;
  commonFee?: number;
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
