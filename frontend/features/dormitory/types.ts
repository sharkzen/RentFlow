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
  lineId: string | null;
  lineType: "PERSONAL" | "OFFICIAL";
  facebook: string | null;
  latitude: number;
  longitude: number;
  mapUrl: string;
  status: DormitoryStatus;
  isPublished: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  settings: DormitorySettings;
  images: DormitoryImage[];
  owner: DormitoryOwner;
  contacts: DormitoryContact[];
}

export interface DormitoryContact {
  id: string;
  name: string | null;
  phone: string;
  order: number;
}

export type DormitoryStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "DRAFT"
  | "BANNED"
  | "SUSPENDED";

export interface DormitorySettings {
  id: string;
  dormitoryId: string;
  roomPrice: number;
  waterBillingType: "METERED" | "FLAT_RATE";
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

export type OwnerStatus = "APPROVED" | "PENDING" | "SUSPENDED";

export interface DormFormData {
  id: string;
  name: string;
  description: any;
  address: string;
  contacts?: {
    id?: string;
    name?: string;
    phone: string;
  }[];
  lineId?: string;
  lineType?: "PERSONAL" | "OFFICIAL";
  facebook?: string;
  mapUrl: string;
  roomPrice: number;
  waterBillingType: "METERED" | "FLAT_RATE";
  waterRate: number;
  electricRate: number;
  commonFee: number;
  lateFee: number;
  dueDay: number;
  dueMonthOffset: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  promptPayType?: string;
  promptPayValue?: string;
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

export type { PaginatedResponse as PaginationResponse } from "@/types";

export type DormSlugResponse = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  availability: {
    isAvailable: boolean;
    airAvailable: number;
    fanAvailable: number;
    totalAvailable: number;
  };
  description: {
    sections: (
      | {
          id: string;
          type: "text";
          order: number;
          value: string;
        }
      | {
          id: string;
          type: "list";
          order: number;
          items: string[];
        }
    )[];
  };
  address: string;
  contacts: {
    id: string;
    name: string | null;
    phone: string;
    order: number;
  }[];
  lineId: string | null;
  lineType: "PERSONAL" | "OFFICIAL";
  facebook: string | null;
  latitude: number;
  longitude: number;
  mapUrl: string;
  status: "ACTIVE" | "INACTIVE";
  isPublished: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  settings: {
    id: string;
    dormitoryId: string;
    roomPrice: number;
    waterBillingType: "METERED" | "FLAT_RATE";
    waterRate: number;
    electricRate: number;
    commonFee: number;
    lateFee: number;
    dueDay: number;
    dueMonthOffset: number;
  };
  images: {
    id: string;
    tenantId: string | null;
    ownerId: string | null;
    bucket: string;
    dormitoryId: string;
    roomId: string | null;
    paymentId: string | null;
    maintenanceId: string | null;
    category: "DORMITORY";
    objectKey: string;
    mimeType: string;
    size: number;
    order: number;
    isCover: boolean;
    createdAt: string;
    url: string;
  }[];
  owner: {
    id: string;
    userId: string;
    status: "APPROVED" | "PENDING" | "SUSPENDED";
    fullName: string;
    phone: string;
    lineId: string | null;
    facebook: string | null;
    deletedAt: string | null;
    createdAt: string;
  };
};
