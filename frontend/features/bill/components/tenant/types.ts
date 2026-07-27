export type PaymentMethod = "CASH" | "TRANSFER";
export type PaymentStatus = "WAITING_VERIFY" | "VERIFIED" | "REJECTED";
export type BillStatus =
  | "PENDING"
  | "WAITING_FOR_VERIFICATION"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface BillData {
  id: string;
  roomNumberSnapshot: string;
  billingMonth: string | Date;
  dueDate: string | Date;
  total: number;
  status: BillStatus;
  tenantNameSnapshot?: string;
  payment?: {
    id: string;
    status: string;
  };
}

export interface BillFilterState {
  year: string;
  status: BillStatus | "ALL";
  month: string;
}

export type RoomType = "FAN" | "AIR";
export type RoomStatus = "VACANT" | "OCCUPIED" | "MAINTENANCE";

export interface IDormitoryDescription {
  sections: {
    id: string;
    type: string;
    order: number;
    value: string;
  }[];
}

export interface IPaymentSetting {
  id: string;
  dormitoryId: string;
  promptPayType: "PHONE" | "ID_CARD";
  promptPayValue: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  isActive: boolean;
}

export interface IOwner {
  phone: string;
  fullName: string;
}

export interface IDormitory {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: IDormitoryDescription;
  address: string;
  contacts: { id: string; name: string | null; phone: string; order: number }[];
  lineId: string | null;
  facebook: string | null;
  latitude: number;
  longitude: number;
  mapUrl: string;
  status: string;
  isPublished: boolean;
  paymentSetting: IPaymentSetting;
  owner: IOwner;
  createdAt: string;
  updatedAt: string;
}

export interface IRoom {
  id: string;
  dormitoryId: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  description: string;
  basePrice: number;
  status: RoomStatus;
  dormitory: IDormitory;
}

export interface ITenantSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  idCard: string;
  roomNumberSnapshot: string;
  tenantNameSnapshot: string;
  roomPriceSnapshot: number;
  contractStartDate: string;
  contractEndDate: string;
}

export interface IBillDetail {
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
  note: string | null;
  status: BillStatus;
  archived: boolean;
  createdAt: string;
  room: IRoom;
  tenant: ITenantSnapshot;
  payment: {
    id: string;
    billId: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    senderName: string | null;
    transferRef: string | null;
    transferBank: string | null;
    transferAmount: number | null;
    slips: [
      {
        id: string;
        objectKey: string;
        url: string;
      },
    ];
    paidAt: string;
    verifiedAt: string | null;
    verifiedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  items?: Array<{
    id: string;
    name: string;
    amount: number;
    type: "CHARGE" | "DISCOUNT";
  }>;
  meterImages: {
    water: {
      current: string | null;
      previous: string | null;
    };
    electric: {
      current: string | null;
      previous: string | null;
    };
  };
}

export interface QrGenerateResponse {
  result: string;
  total: number;
  refNo: string;
  promptPayName: string;
}
