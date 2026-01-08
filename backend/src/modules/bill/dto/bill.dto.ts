import { BillStatus } from "@prisma/client";

export interface CreateBillItemDto {
  roomId: string;
  waterUnit: number;
  electricUnit: number;
  commonFee?: number;
  otherFee?: number;
  note?: string;
}

export interface CreateBillDto {
  dormId: string;
  billingMonth: string;
  items: CreateBillItemDto[];
}

export interface GetBillsQueryDto {
  dormId: string;
  sub: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: BillStatus;
  month?: string;
}

export interface BillListItemDto {
  id: string;
  billingMonth: string;
  dueDate: string;
  roomId: string;
  roomNumber: string;
  tenantName: string | null;
  roomPrice: number;
  waterUnit: number;
  electricUnit: number;
  waterRate: number;
  electricRate: number;
  commonFee: number;
  lateFee: number;
  total: number;
  status: BillStatus;
  createdAt: string;
}

export interface BillListResponseDto {
  items: BillListItemDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UpdateBillStatusDto {
  billId: string;
  status: BillStatus;
}
