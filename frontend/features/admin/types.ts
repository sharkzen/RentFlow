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
    lineId: string | null;
    facebook: string | null;
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
    lineId: string | null;
    facebook: string | null;
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

export type UserRoleType = "ADMIN" | "OWNER" | "TENANT";

export interface LockedUser {
  id: string;
  email: string;
  role: UserRoleType;
  lockedUntil: string;
  failedLoginAttempts: number;
  createdAt: string;
  ownerProfile: {
    fullName: string;
    phone: string | null;
  } | null;
  tenantProfiles: {
    firstName: string;
    lastName: string;
    phone: string | null;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRoleType;
  status: "PENDING" | "ACTIVE" | "BANNED" | "INACTIVE";
  createdAt: string;
  lockedUntil: string | null;
  ownerProfile: {
    id: string;
    fullName: string;
    phone: string | null;
    lineId: string | null;
    facebook: string | null;
    status: "PENDING" | "APPROVED" | "SUSPENDED";
    _count: {
      dormitories: number;
    };
  } | null;
  tenantProfiles: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isActive: boolean;
    room: {
      roomNumber: string;
      dormitory: {
        name: string;
      };
    } | null;
  }[];
}

export interface AdminTenantProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  idCard: string | null;
  address: string | null;
  numberOfResidents: number;
  isActive: boolean;
  moveInDate: string | null;
  moveOutDate: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  room: {
    roomNumber: string;
    dormitory: {
      id: string;
      name: string;
      slug: string;
    };
  } | null;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  role: UserRoleType;
  status: "PENDING" | "ACTIVE" | "BANNED" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  lockedUntil: string | null;
  failedLoginAttempts: number;
  ownerProfile: {
    id: string;
    fullName: string;
    phone: string | null;
    lineId: string | null;
    facebook: string | null;
    status: "PENDING" | "APPROVED" | "SUSPENDED";
    dormitories: {
      id: string;
      slug: string;
      name: string;
      address: string;
      status: string;
      isPublished: boolean;
      _count: {
        rooms: number;
      };
    }[];
  } | null;
  tenantProfiles: AdminTenantProfile[];
}

export const getUserDisplayName = (user: {
  ownerProfile?: { fullName: string } | null;
  tenantProfiles?: { firstName: string; lastName: string }[];
}): string => {
  if (user.ownerProfile?.fullName) return user.ownerProfile.fullName;

  const tenant = user.tenantProfiles?.[0];
  if (tenant) return `${tenant.firstName} ${tenant.lastName}`.trim();

  return "ยังไม่ระบุชื่อ";
};

export const getUserPhone = (user: {
  ownerProfile?: { phone: string | null } | null;
  tenantProfiles?: { phone: string | null }[];
}): string =>
  user.ownerProfile?.phone || user.tenantProfiles?.[0]?.phone || "-";

export enum LandmarkType {
  UNIVERSITY = "UNIVERSITY",
  SCHOOL = "SCHOOL",
  HOSPITAL = "HOSPITAL",
  SHOPPING_MALL = "SHOPPING_MALL",
  ARL = "ARL",
  OFFICE = "OFFICE",
  MARKET = "MARKET",
  RESTAURANT = "RESTAURANT",
  SUPERMARKET = "SUPERMARKET",
  TRANSPORT = "TRANSPORT",
  PARK = "PARK",
  GOVERNMENT = "GOVERNMENT",
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
  [LandmarkType.RESTAURANT]: "ร้านอาหาร / คาเฟ่",
  [LandmarkType.SUPERMARKET]: "ซูเปอร์มาร์เก็ต / ร้านสะดวกซื้อ",
  [LandmarkType.TRANSPORT]: "สถานีขนส่ง / รถไฟ",
  [LandmarkType.PARK]: "สวนสาธารณะ / ฟิตเนส",
  [LandmarkType.GOVERNMENT]: "หน่วยงานราชการ",
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
