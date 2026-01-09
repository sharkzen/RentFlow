export type MaintenanceStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface MaintenanceRoom {
  roomNumber: string;
  floor: number;
}

export interface MaintenanceTenant {
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface MaintenanceImage {
  id: string;
  url: string;
  objectKey: string;
}

export interface MaintenanceRequest {
  id: string;
  dormitoryId: string;
  roomId: string;
  tenantId: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  room: MaintenanceRoom;
  tenant: MaintenanceTenant;
  images: MaintenanceImage[];
}
