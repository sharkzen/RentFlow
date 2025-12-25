export enum Role {
  ADMIN = "ADMIN",
  OWNER = "OWNER",
  STAFF = "STAFF",
  TENANT = "TENANT",
}

export enum Status {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OwnerRegisterFormData {
  fullName: string;
  dormName: string;
  address: string;
  mapUrl: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  status: Status;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
