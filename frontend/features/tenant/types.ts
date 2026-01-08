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
