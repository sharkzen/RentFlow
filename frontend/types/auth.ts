// 1. จำลอง Enum จาก Prisma Schema
export type UserRole = "ADMIN" | "OWNER" | "TENANT";
export type Status = "PENDING" | "ACTIVE" | "BANNED" | "INACTIVE";
export type OwnerStatus = "PENDING" | "APPROVED" | "SUSPENDED";

// 2. Type สำหรับ OwnerProfile
export interface OwnerProfileType {
  id: string;
  userId: string;
  status: OwnerStatus;
  fullName: string;
  lineId: string | null;
  phone: string | null;
  facebook: string | null;
  createdAt: string;
  deletedAt: string | null;
}

// 3. Type สำหรับ TenantProfile (เขียนโครงสร้างคร่าวๆ ไว้ตาม Schema)
export interface TenantProfileType {
  id: string;
  userId: string;
  roomId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  // ... สามารถเพิ่มฟิลด์อื่นตาม Prisma Schema ได้ถ้าหน้าบ้านจำเป็นต้องใช้
}

// 4. Type หลักสำหรับ User ที่ล็อกอิน (ตรงกับ Log ที่คุณได้)
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: Status;

  // ฟิลด์นี้ได้มาจากการที่คุณ Custom เพิ่มใน Controller Backend
  fullName: string;

  // Relations
  ownerProfile: OwnerProfileType | null;
  tenantProfiles: TenantProfileType[]; // ถ้าเป็น Owner ฟิลด์นี้จะเป็น Array ว่าง (ตาม Log)

  // Timestamps (ผ่าน API จะเป็น ISO String)
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
