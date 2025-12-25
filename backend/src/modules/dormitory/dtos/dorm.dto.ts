export interface DormFormDataDto {
  id: string;
  name: string;
  description: any;
  address: string;
  latitude: number;
  longitude: number;
  mapUrl: string;

  roomPrice?: number;
  waterRate: number;
  electricRate: number;
  commonFee?: number;
  lateFee?: number;
  dueDay: number;
  dueMonthOffset?: number;
}
