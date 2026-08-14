export type { PaginatedResponse } from "@/types";

export interface RecentUser {
  id: string;
  email: string;
  role: "ADMIN" | "OWNER" | "TENANT";
  status: string;
  createdAt: string;
}

export interface DashboardData {
  overview: {
    totalUsers: number;
    totalOwners: number;
    totalTenants: number;
    totalDormitories: number;
    totalRooms: number;
  };
  actionRequired: {
    pendingOwners: number;
    pendingDormitories: number;
    openMaintenance: number;
  };
  storage: {
    database: {
      displayValue: string;
      aiAdvice: string;
      shouldOptimize: boolean;
    };
    r2: {
      displayValue: string;
      totalFiles: number;
    };
  };
  recentUsers: RecentUser[];
}

export interface OwnerApproval {
  id: string;
  fullName: string;
  phone: string | null;
  lineId: string | null;
  facebook: string | null;
  status: string;
  createdAt: string;
  user: {
    email: string;
    createdAt: string;
    status: string;
  };
  dormitories: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    images: {
      objectKey: string;
    }[];
  }[];
}

export interface Dormitory {
  id: string;
  name: string;
  address: string;
  status: "PENDING" | "ACTIVE" | "BANNED" | "INACTIVE";
  isPublished: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
  latitude: number;
  longitude: number;
  mapUrl: string;
  createdAt: string;
  owner: {
    fullName: string;
    phone: string | null;
    user: {
      email: string;
    };
  };
  images: {
    id: string;
    objectKey: string;
    isCover: boolean;
    url?: string | null;
  }[];
  _count: {
    rooms: number;
  };
  description?: any;
  settings?: any;
}

export interface OwnerUser {
  id: string;
  email: string;
  status: "PENDING" | "ACTIVE" | "BANNED" | "INACTIVE";
  createdAt: string;
  ownerProfile: {
    id: string;
    fullName: string;
    phone: string | null;
    status: "PENDING" | "APPROVED" | "SUSPENDED";
    _count: {
      dormitories: number;
    };
    dormitories?: Array<{
      id: string;
      slug: string;
      name: string;
      status: string;
      isPublished: boolean;
      _count: {
        rooms: number;
      };
    }>;
  } | null;
}

export interface LockedUser {
  id: string;
  email: string;
  role: string;
  lockedUntil: string;
  failedLoginAttempts: number;
  createdAt: string;
}

export enum LandmarkType {
  UNIVERSITY = "UNIVERSITY",
  SCHOOL = "SCHOOL",
  HOSPITAL = "HOSPITAL",
  SHOPPING_MALL = "SHOPPING_MALL",
  ARL = "ARL",
  OFFICE = "OFFICE",
  MARKET = "MARKET",
  OTHER = "OTHER",
}

export const LandmarkTypeLabel: Record<LandmarkType, string> = {
  [LandmarkType.UNIVERSITY]: "มหาวิทยาลัย",
  [LandmarkType.SCHOOL]: "โรงเรียน",
  [LandmarkType.HOSPITAL]: "โรงพยาบาล",
  [LandmarkType.SHOPPING_MALL]: "ห้างสรรพสินค้า",
  [LandmarkType.ARL]: "รถไฟฟ้า",
  [LandmarkType.OFFICE]: "สำนักงาน",
  [LandmarkType.MARKET]: "ตลาด",
  [LandmarkType.OTHER]: "อื่นๆ",
};

export interface Landmark {
  id: string;
  name: string;
  slug: string;
  type: LandmarkType;
  latitude: number;
  longitude: number;
  mapUrl: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateLandmarkPayload {
  name: string;
  type: LandmarkType;
  mapUrl: string;
}
