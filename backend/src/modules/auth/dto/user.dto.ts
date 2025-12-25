import { Role } from "@/types/role.type";

export interface UserDecodedDto {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}
