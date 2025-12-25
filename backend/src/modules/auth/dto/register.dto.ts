export interface OwnerRegisterDto {
  fullName: string; // ใช้สร้าง User + OwnerProfile
  email: string; // สำหรับ User.email
  password: string; // สำหรับ User.password
  phone: string; // สำหรับ OwnerProfile.phone

  dormName: string; // สำหรับ Dormitory.name
  address: string; // สำหรับ Dormitory.address
  mapUrl: string; // สำหรับ Dormitory.mapUrl
  latitude?: number; // optional, ดึงจาก mapUrl ถ้ามี
  longitude?: number; // optional, ดึงจาก mapUrl ถ้ามี
}

export interface AdminRegisterDto {
  email: string;
  password: string;
}
