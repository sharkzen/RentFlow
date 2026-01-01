export interface DormDescription {
  sections: any[];
}
export interface Dormitory {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: DormDescription;
  address: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  status: DormitoryStatus;
  isPublished: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;

  settings: DormitorySettings;
  images: DormitoryImage[];
  owner: DormitoryOwner;
}

export type DormitoryStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export interface DormitorySettings {
  id: string;
  dormitoryId: string;
  roomPrice: number;
  waterRate: number;
  electricRate: number;
  commonFee: number;
  lateFee: number;
  dueDay: number;
  dueMonthOffset: number;
}

export interface DormitoryImage {
  id: string;
  tenantId: string | null;
  ownerId: string | null;
  bucket: string;
  dormitoryId: string;
  roomId: string | null;
  paymentId: string | null;
  maintenanceId: string | null;
  category: ImageCategory;
  objectKey: string;
  mimeType: string;
  size: number;
  order: number | null;
  isCover: boolean;
  createdAt: string;
  url?: string;
}

export type ImageCategory = "DORMITORY" | "ROOM";

export interface DormitoryOwner {
  id: string;
  userId: string;
  status: OwnerStatus;
  fullName: string;
  phone: string;
  deletedAt: string | null;
  createdAt: string;
}

export type OwnerStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface DormFormData {
  id: string;
  name: string;
  description: any;
  address: string;
  mapUrl: string;
  roomPrice: number;
  waterRate: number;
  electricRate: number;
  commonFee: number;
  lateFee: number;
  dueDay: number;
  dueMonthOffset: number;
}

export interface DormOverview {
  dormId: string;

  rooms: {
    total: number;
    occupied: number;
    available: number;
  };

  income: {
    thisMonth: number;
    unpaid: number;
  };

  bills: {
    pending: number;
    overdue: number;
  };

  maintenance: {
    open: number;
    inProgress: number;
  };
}

export interface PaginationResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
