export type Tenant = {
  id: string;
  userId: string;
  roomId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  idCard: string | null;
  tenantNameSnapshot: string | null;
  roomPriceSnapshot: number | null;
  moveInDate: string | null; // ISO string
  moveOutDate: string | null; // ISO string
  isActive: boolean;
  deletedAt: string | null; // ISO string
  notes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string; // ISO string
  room: {
    id: string;
    dormitoryId: string;
    roomNumber: string;
    basePrice: number;
    status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "DISABLED";
    deletedAt: string | null;
    createdAt: string; // ISO string
  };
  user: {
    id: string;
    email: string;
  };
};

export type TenantListResponse = Tenant[];

export interface GetTenantDormParams {
  dormId: string;
  page?: number;
  limit?: number;
  search?: string;
}
