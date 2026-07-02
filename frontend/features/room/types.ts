export enum RoomType {
  AIR = "AIR",
  FAN = "FAN",
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
  DISABLED = "DISABLED",
}

export interface CreateRoomItemDto {
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  description?: string;
}

export interface CreateBulkRoomsDto {
  dormitoryId: string;
  rooms: CreateRoomItemDto[];
}

export interface Rooms {
  id: string;
  floor: number;
  dormitoryId: string;
  roomNumber: string;
  basePrice: number;
  type: RoomType;
  status: RoomStatus;
  deletedAt: string | null;
  createdAt: string;
}

export interface EditRoomProps {
  room: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface EditFormData {
  roomNumber: string;
  floor: string | number;
  type: RoomType;
  basePrice: number;
  status: RoomStatus;
  description?: string;
  electricMeterDigits: number;
  waterMeterDigits?: number | string | null;
}

export interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}
