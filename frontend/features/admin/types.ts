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
  recentUsers: Array<{
    id: string;
    email: string;
    role: "ADMIN" | "OWNER" | "TENANT";
    status: string;
    createdAt: string;
  }>;
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

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Dormitory {
  id: string;
  name: string;
  address: string;
  status: "PENDING" | "ACTIVE" | "BANNED" | "INACTIVE";
  isPublished: boolean;
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
