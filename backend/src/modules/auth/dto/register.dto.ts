export interface OwnerRegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dormName: string;
  address: string;
  mapUrl: string;
  latitude?: number;
  longitude?: number;
}

export interface AdminRegisterDto {
  email: string;
  password: string;
}
