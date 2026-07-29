export interface DormFormDataDto {
  id: string;
  name: string;
  description: any;
  address: string;
  contacts?: {
    name?: string;
    phone: string;
  }[];
  lineId?: string;
  lineType?: "PERSONAL" | "OFFICIAL";
  facebook?: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  roomPrice?: number;
  waterBillingType?: "METERED" | "FLAT_RATE";
  waterRate: number;
  electricRate: number;
  commonFee?: number;
  lateFee?: number;
  dueDay: number;
  dueMonthOffset?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  promptPayType?: string;
  promptPayValue?: string;
}

export interface GetDormsQueryDto {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  landmarkId?: string;
  page?: number;
}
