export enum Status {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
}

export enum LandmarkTypeDto {
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

export interface LandmarkDto {
  id: string;
  name: string;
  slug: string;
  type: LandmarkTypeDto;
  latitude?: number;
  longitude?: number;
  mapUrl: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
