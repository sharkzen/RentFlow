import { BillData, BillStatus } from "@/features/bill/components/tenant/types";

export type Tenant = {
  id: string;
  userId: string;
  roomId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  password: string | null;
  idCard: string | null;
  address: string | null;
  numberOfResidents: number;
  tenantNameSnapshot: string | null;
  roomPriceSnapshot: number | null;
  securityDeposit: number;
  advancePayment: number;
  entranceFee: number;
  contractStartDate: string | null;
  contractEndDate: string | null;
  moveInDate: string | null;
  moveOutDate: string | null;
  isActive: boolean;
  deletedAt: string | null;
  notes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  room: {
    id: string;
    dormitoryId: string;
    roomNumber: string;
    basePrice: number;
    status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "DISABLED";
    deletedAt: string | null;
    createdAt: string;
  } | null;
  user: {
    id: string;
    email: string;
    password: string;
    status: "ACTIVE" | "BANNED" | "PENDING" | "INACTIVE";
  };
};

export type TenantListResponse = Tenant[];

export interface GetTenantDormParams {
  dormId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface TenantDashboardResponse {
  tenant: {
    name: string;
    roomNumber: string;
    dormName: string;
  };
}

export interface TenantDashboardData {
  tenant: {
    id: string;
    name: string;
    roomNumber: string;
    dormName: string;
  };
  contactInfo: {
    name: string;
    phone: string | null;
    lineId: string | null;
    facebook: string | null;
  };
  bill: {
    id: string;
    status:
      | "PENDING"
      | "WAITING_FOR_VERIFICATION"
      | "PAID"
      | "OVERDUE"
      | "CANCELLED";
    amount: number;
    dueDate: string | Date;
    billingMonth: string | Date;
  } | null;
  utilities: {
    water: {
      used: number;
      currentUnit: number;
      prevUnit: number;
      imageUrl: string | null;
    };
    electric: {
      used: number;
      currentUnit: number;
      prevUnit: number;
      imageUrl: string | null;
    };
  } | null;
  maintenance: {
    open: number;
    inProgress: number;
    totalActive: number;
  };
}

export interface GetTenantDormParams {
  dormId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface BillsResponse {
  items: BillData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalPending: number;
  };
}

export interface GetMyBillsParams {
  page?: number;
  limit?: number;
  year?: string;
  status?: BillStatus | string;
  month?: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  images: {
    id: string;
    objectKey: string;
    url: string;
  }[];
}

export interface TenantContractDetail {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  idCard: string;
  roomPriceSnapshot: number;
  securityDeposit: number;
  advancePayment: number;
  contractStartDate: string;
  contractEndDate: string | null;
  moveInDate: string;
  isActive: boolean;
  user: {
    email: string;
    status: string;
  };
  room: {
    roomNumber: string;
    floor: number;
    type: "AIR" | "FAN";
    basePrice: number;
    dormitory: {
      name: string;
      address: string;
      settings: {
        waterRate: number;
        electricRate: number;
        commonFee: number;
        dueDay: number;
        dueMonthOffset: number;
      };
      paymentSetting: {
        bankName: string;
        bankAccount: string;
        bankHolder: string;
        promptPayValue: string;
      };
    };
  };
}
