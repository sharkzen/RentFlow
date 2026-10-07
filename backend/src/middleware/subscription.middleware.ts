import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "@/lib/prisma";
import { assertManageAccess } from "@/lib/entitlements";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { Role } from "@/types/role.type";

/**
 * ตรวจสิทธิ์งานจัดการตามแพ็คเกจของเจ้าของหอ (ต้องวางหลัง authMiddleware)
 * แอดมินและผู้ใช้ role อื่นไม่ถูกตรวจ ส่วนที่ปิดบังคับโควต้าอยู่จะผ่านทั้งหมด
 */
export const requireManageAccess = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const user = request.user as UserDecodedDto | undefined;

  if (!user?.sub || user.role !== Role.OWNER) return;

  const owner = await prisma.ownerProfile.findUnique({
    where: { userId: user.sub },
    select: { id: true },
  });

  if (!owner) return;

  await assertManageAccess(owner.id, request.method);
};
