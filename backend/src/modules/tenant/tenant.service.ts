import prisma from "@/lib/prisma";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { hashPassword, verifyPassword } from "@/modules/auth/lib/password";

import {
  RoomStatus,
  UserRole,
  Status,
  BillStatus,
  MaintenanceStatus,
  PaymentStatus,
  FileCategory,
} from "@prisma/client";

import puppeteer from "puppeteer";
import {
  formatDate,
  formatLongDate,
  formatMoney,
  formatThaiDateTime,
  matchAccount,
} from "./lib/tenant.lib";
import path from "path";
import fs from "fs";
import { slipOkService } from "@/services/slipok.service";
import { uuidv4 } from "zod";
import { deleteFile, generateSignedUrl, uploadFile } from "@/services/r2Client";
import { env } from "@/config/env";
import logger from "@/utils/logger";
import {
  CreateMaintenanceParams,
  SlipApiErrorResponse,
  VerifiedPaymentData,
} from "./dto/tenant.dto";
import { emailQueue } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import { randomUUID } from "crypto";
import { createActivityLog } from "@/services/activity-log.service";

interface GetTenantDormParams {
  dormId: string;
  sub: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface GetMaintenanceQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

interface GetBillsParams {
  userId: string;
  page?: number;
  limit?: number;
  month?: string;
  year?: string;
  status?: string;
}

interface ProcessSlipParams {
  userId: string;
  billId: string;
  refNo?: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
}

interface GetMaintenanceParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

interface UpdateMaintenanceData {
  title?: string;
  description?: string;
  images?: any[];
  deletedImageIds?: string | string[];
}

const diffInDays = (date1: Date, date2: Date) => {
  const diffTime = date1.getTime() - date2.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const formatThaiDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions,
) => {
  return new Intl.DateTimeFormat("th-TH", {
    ...options,
    year: "numeric",
  }).format(new Date(date));
};

export const tenantService = {
  getTenantDorm: async ({
    dormId,
    sub,
    page = 1,
    limit = 10,
    search,
    status = "active",
  }: GetTenantDormParams) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },

      select: {
        id: true,
      },
    });

    if (!owner) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * limit;

    const where: any = {
      room: {
        dormitory: {
          id: dormId,
          ownerId: owner.id,
        },
      },

      deletedAt: null,
    };

    if (status === "active") {
      where.isActive = true;
    } else if (status === "moved_out") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          idCard: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          room: {
            roomNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.tenantProfile.findMany({
        where,
        skip,
        take: limit,

        orderBy: search
          ? undefined
          : {
              room: {
                roomNumber: "asc",
              },
            },

        include: {
          room: true,

          user: {
            select: {
              id: true,
              email: true,
              status: true,
            },
          },
        },
      }),
      prisma.tenantProfile.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  createTenant: async (userId: string, data: any) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const room = await prisma.room.findUnique({
      where: {
        id: data.roomId,
      },

      include: {
        dormitory: true,
      },
    });

    if (!room) throw new Error("ROOM_NOT_FOUND");

    if (room.dormitory.ownerId !== owner.id) throw new Error("DORM_NOT_OWNED");

    if (room.status !== RoomStatus.AVAILABLE)
      throw new Error("ROOM_NOT_AVAILABLE");

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) throw new Error("EMAIL_ALREADY_EXISTS");

    const rawPassword = data.password || data.phone || "12345678";
    const hashedPassword = await hashPassword(rawPassword);

    return await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: UserRole.TENANT,
          status: Status.ACTIVE,
        },
      });

      const newTenant = await tx.tenantProfile.create({
        data: {
          userId: newUser.id,
          roomId: data.roomId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          idCard: data.idCard,
          email: data.email,
          address: data.address,
          numberOfResidents: Number(data.numberOfResidents) || 1,
          tenantNameSnapshot: `${data.firstName} ${data.lastName}`,
          moveInDate: data.moveInDate ? new Date(data.moveInDate) : new Date(),
          contractStartDate: data.contractStartDate
            ? new Date(data.contractStartDate)
            : new Date(),
          contractEndDate: data.contractEndDate
            ? new Date(data.contractEndDate)
            : null,
          securityDeposit: Number(data.securityDeposit) || 0,
          advancePayment: Number(data.advancePayment) || 0,
          entranceFee: Number(data.entranceFee) || 0,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          notes: data.notes,
        },
      });

      await tx.room.update({
        where: {
          id: data.roomId,
        },

        data: {
          status: RoomStatus.OCCUPIED,
        },
      });

      await createActivityLog({
        userId: userId,
        action: "CREATE_TENANT",
        entityType: "TenantProfile",
        entityId: newTenant.id,

        metadata: {
          roomId: data.roomId,
          tenantName: `${data.firstName} ${data.lastName}`,
        },
      });

      return newTenant;
    });
  },

  getTenantById: async (sub: string, tenantId: string) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const tenant = await prisma.tenantProfile.findUnique({
      where: {
        id: tenantId,
      },

      include: {
        user: {
          select: {
            email: true,
            status: true,
          },
        },

        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    return tenant;
  },

  updateTenant: async (sub: string, tenantId: string, data: any) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const tenant = await prisma.tenantProfile.findUnique({
      where: {
        id: tenantId,
      },

      include: {
        user: true,

        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (!tenant.isActive) {
      throw new Error("TENANT_ALREADY_MOVED_OUT");
    }

    const userUpdatePayload: any = {};

    if (data.email && data.email !== tenant.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (duplicateUser) throw new Error("EMAIL_ALREADY_EXISTS");

      userUpdatePayload.email = data.email;
    }

    if (data.password && data.password.trim() !== "") {
      const hashedPassword = await hashPassword(data.password);
      userUpdatePayload.password = hashedPassword;
    }

    if (data.isActive !== undefined) {
      userUpdatePayload.status = data.isActive ? "ACTIVE" : "BANNED";
    }

    const tenantUpdatePayload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      idCard: data.idCard,
      address: data.address,
      email: data.email || undefined,
      securityDeposit:
        data.securityDeposit !== undefined
          ? Number(data.securityDeposit)
          : undefined,
      advancePayment:
        data.advancePayment !== undefined
          ? Number(data.advancePayment)
          : undefined,
      entranceFee:
        data.entranceFee !== undefined ? Number(data.entranceFee) : undefined,
      numberOfResidents:
        data.numberOfResidents !== undefined
          ? Number(data.numberOfResidents)
          : undefined,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      notes: data.notes,
    };

    if (data.moveInDate)
      tenantUpdatePayload.moveInDate = new Date(data.moveInDate);

    if (data.contractStartDate)
      tenantUpdatePayload.contractStartDate = new Date(data.contractStartDate);

    if (data.contractEndDate)
      tenantUpdatePayload.contractEndDate = new Date(data.contractEndDate);

    Object.keys(tenantUpdatePayload).forEach(
      (key) =>
        tenantUpdatePayload[key] === undefined &&
        delete tenantUpdatePayload[key],
    );

    return await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdatePayload).length > 0) {
        await tx.user.update({
          where: {
            id: tenant.userId,
          },

          data: userUpdatePayload,
        });
      }

      const updatedTenant = await tx.tenantProfile.update({
        where: {
          id: tenantId,
        },

        data: tenantUpdatePayload,
      });

      await createActivityLog({
        userId: sub,
        action: "UPDATE_TENANT",
        entityType: "TenantProfile",
        entityId: tenantId,

        metadata: {
          changedData: Object.keys(tenantUpdatePayload),
        },
      });

      return updatedTenant;
    });
  },

  moveOut: async (sub: string, tenantId: string, moveOutDateStr?: string) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const tenant = await prisma.tenantProfile.findUnique({
      where: {
        id: tenantId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        bills: {
          where: {
            status: {
              in: ["PENDING", "OVERDUE", "WAITING_FOR_VERIFICATION"],
            },
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id)
      throw new Error("FORBIDDEN_ACCESS");

    if (!tenant.isActive && tenant.moveOutDate)
      throw new Error("ALREADY_MOVED_OUT");

    if (tenant.bills.length > 0) throw new Error("OUTSTANDING_BILLS_EXIST");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = moveOutDateStr ? new Date(moveOutDateStr) : new Date();
    selectedDate.setHours(0, 0, 0, 0);
    const isFutureDate = selectedDate.getTime() > today.getTime();

    return await prisma.$transaction(async (tx) => {
      if (isFutureDate) {
        const updatedTenant = await tx.tenantProfile.update({
          where: {
            id: tenantId,
          },

          data: {
            moveOutDate: selectedDate,
          },
        });

        await createActivityLog({
          userId: sub,
          action: "SCHEDULE_MOVE_OUT",
          entityType: "TenantProfile",
          entityId: tenantId,

          metadata: {
            roomId: tenant.roomId,
            scheduledDate: selectedDate,
          },
        });

        return {
          status: "SCHEDULED",
          data: updatedTenant,
        };
      }

      const updatedTenant = await tx.tenantProfile.update({
        where: {
          id: tenantId,
        },

        data: {
          moveOutDate: selectedDate,
          isActive: false,
        },
      });

      if (tenant.roomId) {
        await tx.room.update({
          where: {
            id: tenant.roomId,
          },

          data: {
            status: "AVAILABLE",
          },
        });
      }

      await tx.user.update({
        where: {
          id: tenant.userId,
        },

        data: {
          status: "INACTIVE",
        },
      });

      await createActivityLog({
        userId: sub,
        action: "MOVE_OUT_TENANT",
        entityType: "TenantProfile",
        entityId: tenantId,

        metadata: {
          roomId: tenant.roomId,
        },
      });

      return {
        status: "COMPLETED",
        data: updatedTenant,
      };
    });
  },

  cancelMoveOut: async (sub: string, tenantId: string) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const tenant = await prisma.tenantProfile.findUnique({
      where: {
        id: tenantId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (!tenant.isActive) {
      throw new Error("ALREADY_MOVED_OUT");
    }

    if (!tenant.moveOutDate) {
      throw new Error("NOT_SCHEDULED_FOR_MOVE_OUT");
    }

    return await prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.tenantProfile.update({
        where: {
          id: tenantId,
        },

        data: {
          moveOutDate: null,
        },
      });

      await createActivityLog({
        userId: sub,
        action: "CANCEL_SCHEDULED_MOVE_OUT",
        entityType: "TenantProfile",
        entityId: tenantId,

        metadata: {
          roomId: tenant.roomId,
        },
      });

      return {
        status: "CANCELED",
        data: updatedTenant,
      };
    });
  },

  getDashboardStats: async (userId: string) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId,
        isActive: true,
        deletedAt: null,
      },

      include: {
        room: {
          include: {
            dormitory: {
              include: {
                settings: true,

                owner: {
                  select: {
                    fullName: true,
                    phone: true,
                    lineId: true,
                    facebook: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tenant || !tenant.room) throw new Error("TENANT_NOT_FOUND_OR_NO_ROOM");

    let latestBill = await prisma.bill.findFirst({
      where: {
        tenantId: tenant.id,
        roomId: tenant.room.id,

        status: {
          not: BillStatus.CANCELLED,
        },
      },

      orderBy: [
        {
          billingMonth: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    if (
      latestBill &&
      latestBill.status !== "PAID" &&
      latestBill.status !== "CANCELLED"
    ) {
      const today = new Date();
      const dueDate = new Date(latestBill.dueDate);

      if (today > dueDate) {
        const dailyRate = tenant.room.dormitory.settings?.lateFee || 0;
        const startDate = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate(),
        );
        const endDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const daysLate = Math.floor(
          (endDate.getTime() - startDate.getTime()) / 86400000,
        );
        const calculatedLateFee = daysLate * dailyRate;

        if (calculatedLateFee > latestBill.lateFeeSnapshot) {
          const feeDifference = calculatedLateFee - latestBill.lateFeeSnapshot;

          latestBill = await prisma.bill.update({
            where: {
              id: latestBill.id,
            },

            data: {
              lateFeeSnapshot: calculatedLateFee,

              total: {
                increment: feeDifference,
              },

              status: "OVERDUE",
            },
          });
        }
      }
    }

    const maintenanceStats = await prisma.maintenanceRequest.groupBy({
      by: ["status"],

      where: {
        tenantId: tenant.id,

        status: {
          in: [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS],
        },
      },

      _count: true,
    });

    const openMaint =
      maintenanceStats.find((m) => m.status === MaintenanceStatus.OPEN)
        ?._count || 0;
    const progressMaint =
      maintenanceStats.find((m) => m.status === MaintenanceStatus.IN_PROGRESS)
        ?._count || 0;

    return {
      tenant: {
        id: tenant.id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        roomNumber: tenant.room.roomNumber,
        dormName: tenant.room.dormitory.name,
      },

      contactInfo: {
        name: tenant.room.dormitory.owner.fullName,
        phone: tenant.room.dormitory.owner.phone,
        lineId: tenant.room.dormitory.owner.lineId,
        facebook: tenant.room.dormitory.owner.facebook,
      },

      bill: latestBill
        ? {
            id: latestBill.id,
            status: latestBill.status,
            amount: latestBill.total,
            dueDate: latestBill.dueDate,
            billingMonth: latestBill.billingMonth,
          }
        : null,

      utilities: latestBill
        ? {
            water: {
              used: latestBill.waterUsedSnapshot,
              currentUnit: latestBill.currentWaterUnitSnapshot,
              prevUnit: latestBill.prevWaterUnitSnapshot,
            },

            electric: {
              used: latestBill.electricUsedSnapshot,
              currentUnit: latestBill.currentElectricUnitSnapshot,
              prevUnit: latestBill.prevElectricUnitSnapshot,
            },
          }
        : null,

      maintenance: {
        open: openMaint,
        inProgress: progressMaint,
        totalActive: Number(openMaint) + Number(progressMaint),
      },
    };
  },

  getBills: async ({
    userId,
    page = 1,
    limit = 10,
    year,
    status,
    month,
  }: GetBillsParams) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!tenant) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,

        summary: {
          totalPending: 0,
        },
      };
    }

    const where: any = {
      tenantId: tenant.id,
    };

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (month && month !== "ALL") {
      const yearNum =
        year && year !== "ALL" ? Number(year) : new Date().getFullYear();
      const monthIndex = Number(month) - 1;
      startDate = new Date(yearNum, monthIndex, 1);
      endDate = new Date(yearNum, monthIndex + 1, 1);
    } else if (year && year !== "ALL") {
      const yearNum = Number(year);
      startDate = new Date(yearNum, 0, 1);
      endDate = new Date(yearNum + 1, 0, 1);
    }

    if (startDate && endDate) {
      where.billingMonth = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [items, total, totalPendingAgg] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          billingMonth: "desc",
        },

        include: {
          payment: true,
        },
      }),
      prisma.bill.count({
        where,
      }),
      prisma.bill.aggregate({
        where: {
          tenantId: tenant.id,

          status: {
            in: ["PENDING", "OVERDUE"],
          },
        },

        _sum: {
          total: true,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),

      summary: {
        totalPending: totalPendingAgg._sum.total || 0,
      },
    };
  },

  getBillById: async (userId: string, billId: string) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: {
              include: {
                paymentSetting: true,
                settings: true,

                owner: {
                  select: {
                    phone: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },

        payment: {
          include: {
            slips: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },

        tenant: true,
        items: true,
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    if (bill.tenant.userId !== userId) throw new Error("FORBIDDEN_ACCESS");

    const today = new Date();
    const dueDate = new Date(bill.dueDate);

    if (
      bill.status !== "PAID" &&
      bill.status !== "CANCELLED" &&
      today > dueDate
    ) {
      const dailyRate = bill.room.dormitory.settings?.lateFee || 0;
      const startDate = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
      );
      const endDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const daysLate = Math.floor(
        (endDate.getTime() - startDate.getTime()) / 86400000,
      );
      const calculatedLateFee = daysLate * dailyRate;

      if (calculatedLateFee > bill.lateFeeSnapshot) {
        const feeDifference = calculatedLateFee - bill.lateFeeSnapshot;

        const updated = await prisma.bill.update({
          where: {
            id: billId,
          },

          data: {
            lateFeeSnapshot: calculatedLateFee,

            total: {
              increment: feeDifference,
            },

            status: "OVERDUE",
          },
        });

        bill.lateFeeSnapshot = updated.lateFeeSnapshot;
        bill.total = updated.total;
        bill.status = updated.status;
      }
    }

    if (bill.payment && bill.payment.slips.length > 0) {
      const slipsWithUrls = await Promise.all(
        bill.payment.slips.map(async (slip) => ({
          ...slip,
          url: await generateSignedUrl(slip.objectKey),
        })),
      );

      (bill.payment as any).slips = slipsWithUrls;
    }

    return bill;
  },

  generateBillPdf: async (userId: string, billId: string) => {
    const bill = await tenantService.getBillById(userId, billId);

    if (!bill) throw new Error("BILL_NOT_FOUND");

    const today = new Date();
    const dueDate = new Date(bill.dueDate);
    let finalDaysLate = 0;

    if (bill.status === "OVERDUE") {
      const startDatePdf = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
      );
      const endDatePdf = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const daysLate = Math.floor(
        (endDatePdf.getTime() - startDatePdf.getTime()) / 86400000,
      );
      finalDaysLate = daysLate > 0 ? daysLate : 0;
    }

    const formatThaiDate = (
      date: Date | string,
      options: Intl.DateTimeFormatOptions,
    ) => {
      return new Intl.DateTimeFormat("th-TH", {
        ...options,
        year: "numeric",
      }).format(new Date(date));
    };

    const formatMoney = (amount: number) => {
      return amount.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
      });
    };

    const getBase64Image = (fileName: string) => {
      try {
        const filePath = path.join(process.cwd(), "public", "images", fileName);
        const image = fs.readFileSync(filePath);
        return `data:image/png;base64,${image.toString("base64")}`;
      } catch (e) {
        return "";
      }
    };

    const paidStamp = getBase64Image("Paid.png");
    const cancelStamp = getBase64Image("Cancel.png");
    const items = (bill as any).items || [];
    const chargeItems = items.filter((item: any) => item.type === "CHARGE");
    const discountItems = items.filter((item: any) => item.type === "DISCOUNT");

    const chargeItemsHtml = chargeItems
      .map(
        (item: any) => `
      <tr>
        <td class="font-bold text-slate-900">${item.name}</td>
        <td class="text-center">-</td>
        <td class="text-right">-</td>
        <td class="text-right font-bold text-slate-900">${formatMoney(item.amount)}</td>
      </tr>
    `,
      )
      .join("");

    const discountItemsHtml = discountItems
      .map(
        (item: any) => `
      <tr>
        <td>
          <div class="font-bold" style="color: #dc2626;">
            ${item.name} <span style="font-size: 10px; color: #ef4444; margin-left: 4px;">(ส่วนลด/หักลบ)</span>
          </div>
        </td>
        <td class="text-center">-</td>
        <td class="text-right">-</td>
        <td class="text-right font-bold" style="color: #dc2626;">-${formatMoney(item.amount)}</td>
      </tr>
    `,
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Sarabun', sans-serif;
            margin: 0;
            padding: 0;
            background-color: white;
            color: #1e293b;
            -webkit-print-color-adjust: exact; 
          }
          .container {
            width: 210mm;
            height: 296mm; 
            padding: 15mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding: 20px 0;
          }
          .header-left h1 { font-size: 24px; margin: 0; color: #0f172a; line-height: 1.2; }
          .header-left p { font-size: 14px; color: #475569; margin: 8px 0 0; line-height: 1.5; }
          .header-right { text-align: right; }
          .title { font-size: 24px; font-weight: 800; margin: 0; color: #0f172a; }
          .subtitle { font-size: 18px; font-weight: 700; color: #334155; text-transform: uppercase; }
          .info-text { font-size: 14px; color: #64748b; margin-top: 12px; }
          .info-val { font-weight: 700; color: #0f172a; }

          .tenant-section { display: flex; justify-content: space-between; margin-top: 32px; gap: 48px; }
          .section-title {
            font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;
            border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;
          }
          .tenant-name { font-size: 20px; font-weight: 700; }
          .room-label { font-size: 14px; color: #475569; margin-top: 8px; }
          .room-val { font-size: 18px; font-weight: 700; color: #0f172a; }

          .table-container { flex: 1; margin-top: 32px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th {
            background-color: #f1f5f9;
            padding: 16px 12px; text-align: left; font-weight: 700;
            border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a;
          }
          td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .unit-detail { font-size: 12px; color: #64748b; margin-top: 4px; }

          .footer { margin-top: 24px; border-top: 2px solid #0f172a; padding-top: 16px; }
          .total-row { display: flex; justify-content: flex-end; align-items: center; gap: 48px; margin-top: 16px; }
          .total-label { font-size: 18px; font-weight: 500; color: #475569; }
          .total-amount { font-size: 36px; font-weight: 900; color: #0f172a; }

          .signature-section {
            margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end;
            border-top: 1px solid #f1f5f9; padding-top: 40px;
          }
          .note { width: 60%; font-size: 14px; color: #64748b; line-height: 1.6; }
          .note-title { font-weight: 700; color: #334155; font-style: italic; }
          
          .signature-box { text-align: center; position: relative; width: 200px; }
          .sig-line { border-bottom: 1px dotted #94a3b8; height: 64px; margin-bottom: 8px; }
          .sig-text { font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; }
          .sig-sub { font-size: 10px; color: #94a3b8; }

          .stamp {
            position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);
            z-index: 10; pointer-events: none;
          }
          .stamp-paid { width: 100px; opacity: 0.8; }
          .stamp-cancel { width: 200px; transform: translate(-50%, -50%) rotate(-13deg); opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-left">
              <h1>${bill.room.dormitory.name}</h1>
              <p>${bill.room.dormitory.address}<br>โทร: ${bill.room.dormitory.owner?.phone || "-"}</p>
            </div>
            <div class="header-right">
              <div class="title">${bill.status === "PAID" ? "ใบเสร็จรับเงิน" : "ใบแจ้งหนี้"}</div>
              <div class="subtitle">${bill.status === "PAID" ? "(Receipt)" : "(Invoice)"}</div>
              <div class="info-text text-right">เลขที่: <span class="info-val">#${bill.id.slice(0, 10).toUpperCase()}</span></div>
              <div class="info-text text-right">วันที่: <span class="info-val">${formatThaiDate(
                new Date(),
                {
                  day: "numeric",
                  month: "long",
                },
              )}</span></div>
            </div>
          </div>

          <div class="tenant-section">
            <div style="flex: 1;">
              <div class="section-title">ผู้เช่า (Bill To)</div>
              <div class="tenant-name">${bill.tenantNameSnapshot}</div>
              <div class="room-label">ห้องเลขที่: <span class="room-val">${bill.roomNumberSnapshot}</span></div>
            </div>
            <div class="text-right" style="min-width: 200px;">
              <div class="section-title">รายละเอียด (Reference)</div>
              <div class="info-text" style="color:#334155;">รอบบิลเดือน: <span class="font-bold">
                ${formatThaiDate(bill.billingMonth, {
                  month: "long",
                })}
              </span></div>
              <div class="info-text font-bold" style="color: #dc2626; margin-top: 4px;">กำหนดชำระ: ${formatThaiDate(
                bill.dueDate,
                {
                  day: "numeric",
                  month: "short",
                },
              )}</div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 45%;">รายการ (Description)</th>
                  <th class="text-center">หน่วย (Units)</th>
                  <th class="text-right">ราคา/หน่วย</th>
                  <th class="text-right">จำนวนเงิน (Amount)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-bold">ค่าเช่าห้องพัก</td>
                  <td class="text-center">-</td>
                  <td class="text-right">-</td>
                  <td class="text-right font-bold">${formatMoney(bill.roomPriceSnapshot)}</td>
                </tr>
                <tr>
                  <td>
                    <div class="font-bold">ค่าน้ำประปา</div>
                    <div class="unit-detail">(มิเตอร์: ${bill.prevWaterUnitSnapshot} - ${bill.currentWaterUnitSnapshot})</div>
                  </td>
                  <td class="text-center">${bill.waterUsedSnapshot}</td>
                  <td class="text-right">${formatMoney(bill.waterRateSnapshot)}</td>
                  <td class="text-right font-bold">${formatMoney(bill.waterFeeSnapshot)}</td>
                </tr>
                <tr>
                  <td>
                    <div class="font-bold">ค่าไฟฟ้า</div>
                    <div class="unit-detail">(มิเตอร์: ${bill.prevElectricUnitSnapshot} - ${bill.currentElectricUnitSnapshot})</div>
                  </td>
                  <td class="text-center">${bill.electricUsedSnapshot}</td>
                  <td class="text-right">${formatMoney(bill.electricRateSnapshot)}</td>
                  <td class="text-right font-bold">${formatMoney(bill.electricFeeSnapshot)}</td>
                </tr>
                ${
                  bill.commonFeeSnapshot > 0
                    ? `
                <tr>
                  <td class="font-bold">ค่าส่วนกลาง</td>
                  <td class="text-center">-</td>
                  <td class="text-right">-</td>
                  <td class="text-right font-bold">${formatMoney(bill.commonFeeSnapshot)}</td>
                </tr>`
                    : ""
                }
                
                ${
                  bill.status === "OVERDUE" && bill.lateFeeSnapshot > 0
                    ? `
                <tr>
                  <td>
                    <div class="font-bold" style="color: #dc2626;">ค่าปรับล่าช้า</div>
                    ${finalDaysLate > 0 ? `<div class="unit-detail">(ค้างชำระ ${finalDaysLate} วัน)</div>` : ""}
                  </td>
                  <td class="text-center">-</td>
                  <td class="text-right">-</td>
                  <td class="text-right font-bold" style="color: #dc2626;">${formatMoney(bill.lateFeeSnapshot)}</td>
                </tr>`
                    : ""
                }
                
                ${chargeItemsHtml}
                ${discountItemsHtml}

              </tbody>
            </table>
          </div>

          <div class="footer">
            <div class="total-row">
              <div class="total-label">ยอดรวมสุทธิ (Total)</div>
              <div class="total-amount">฿${formatMoney(bill.total)}</div>
            </div>
            <div class="text-right" style="font-size: 12px; color: #64748b; font-style: italic; margin-top: 4px;">* ราคานี้รวมภาษีมูลค่าเพิ่มแล้ว (หากมี)</div>

            <div class="signature-section">
              <div class="note">
                <span class="note-title">หมายเหตุ:</span><br>
                ${bill.status !== "PAID" ? "กรุณาตรวจสอบรายการและชำระเงินตามกำหนดเวลาที่ระบุไว้ข้างต้น (ค่าปรับคำนวณรายวัน)" : "ขอบคุณที่ใช้บริการ เอกสารฉบับนี้ถือเป็นหลักฐานการรับเงินที่สมบูรณ์"}
              </div>
              <div class="signature-box">
                <div class="sig-line">
                  ${bill.status === "PAID" && paidStamp ? `<img src="${paidStamp}" class="stamp stamp-paid">` : ""}
                  ${bill.status === "CANCELLED" && cancelStamp ? `<img src="${cancelStamp}" class="stamp stamp-cancel">` : ""}
                </div>
                <div class="sig-text">ผู้ออกเอกสาร / ผู้รับเงิน</div>
                <div class="sig-sub">(Authorized Signature)</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `.trim();

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,

      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    await browser.close();
    return pdfBuffer;
  },

  generatePromptPayQR: async (userId: string, billId: string) => {
    const bill = await tenantService.getBillById(userId, billId);
    const paymentSetting = bill.room.dormitory.paymentSetting;

    if (
      !paymentSetting ||
      !paymentSetting.isActive ||
      !paymentSetting.promptPayValue
    ) {
      throw new Error("PROMPTPAY_NOT_CONFIGURED");
    }

    const amount = bill.total;

    const payload = generatePayload(paymentSetting.promptPayValue, {
      amount,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(payload);

    return {
      result: qrCodeDataUrl,
      total: amount,
      refNo: bill.id,
      promptPayName: paymentSetting.bankHolder || "Dormitory Account",
    };
  },

  processPaymentSlip: async ({
    userId,
    billId,
    refNo,
    fileBuffer,
    mimeType,
  }: any) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        tenant: true,

        room: {
          include: {
            dormitory: {
              include: {
                paymentSetting: true,

                owner: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    if (bill.tenant.userId !== userId) throw new Error("FORBIDDEN_ACCESS");

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (mimeType && !allowedMimeTypes.includes(mimeType)) {
      throw new Error("INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED");
    }

    if (refNo) {
      const existingPayment = await prisma.payment.findUnique({
        where: {
          transferRef: refNo,
        },
      });

      if (existingPayment && existingPayment.billId !== billId) {
        throw new Error("SLIP_DUPLICATE_REF");
      }
    }

    let verifiedData: any = null;

    try {
      verifiedData = await slipOkService.verifySlip(fileBuffer, bill.total);
    } catch (error: any) {
      throw error;
    }

    if (verifiedData?.refNo) {
      const duplicateSlip = await prisma.payment.findUnique({
        where: {
          transferRef: verifiedData.refNo,
        },
      });

      if (duplicateSlip && duplicateSlip.billId !== billId) {
        throw new Error("SLIP_DUPLICATE_REF");
      }
    }

    let paymentStatus: PaymentStatus = "WAITING_VERIFY" as PaymentStatus;
    let billStatus: BillStatus = "WAITING_FOR_VERIFICATION" as BillStatus;
    let isAutoVerified = false;

    if (verifiedData) {
      const isAmountMatch = Math.abs(verifiedData.amount - bill.total) < 1.0;
      let isReceiverMatch = false;
      const dormSetting = bill.room.dormitory.paymentSetting;
      const targetBank = dormSetting?.bankAccount;
      const targetPromptPay = dormSetting?.promptPayValue;
      const slipReceiverAcc = verifiedData.receiverAccount;
      const slipReceiverProxy = verifiedData.receiverProxy;

      if (slipReceiverAcc && targetBank) {
        if (matchAccount(targetBank, slipReceiverAcc)) {
          isReceiverMatch = true;
        }
      }

      if (!isReceiverMatch && slipReceiverProxy && targetPromptPay) {
        if (matchAccount(targetPromptPay, slipReceiverProxy)) {
          isReceiverMatch = true;
        }
      }

      if (!targetBank && !targetPromptPay) {
        logger.warn(
          `Dormitory ID ${bill.room.dormitoryId} missing bank details.`,
        );
        isReceiverMatch = false;
      }

      if (isAmountMatch) {
        if (isReceiverMatch) {
          paymentStatus = PaymentStatus.VERIFIED;
          billStatus = BillStatus.PAID;
          isAutoVerified = true;
        } else {
          logger.warn(`Suspicious Slip (Receiver Mismatch): BillId=${billId}`);
        }
      } else {
        logger.warn(
          `Amount Mismatch: Bill=${bill.total}, Slip=${verifiedData.amount}`,
        );
      }
    }

    const oldPayment = await prisma.payment.findUnique({
      where: {
        billId,
      },

      include: {
        slips: true,
      },
    });

    const year = new Date().getFullYear();

    const mimeToExtension: {
      [key: string]: string;
    } = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = mimeToExtension[mimeType] || "jpg";
    const objectKey = `slips/${bill.roomId}/${year}/${uuidv4()}.${extension}`;
    await uploadFile(fileBuffer, objectKey, mimeType);

    const transactionResult = await prisma.$transaction(async (tx) => {
      if (oldPayment) {
        await tx.file.deleteMany({
          where: {
            paymentId: oldPayment.id,
            category: "PAYMENT_SLIP",
          },
        });
      }

      const finalPaidAt = verifiedData?.paidAt || new Date();

      const payment = await tx.payment.upsert({
        where: {
          billId,
        },

        create: {
          billId,
          paymentMethod: "TRANSFER",
          status: paymentStatus,
          transferRef: verifiedData?.refNo || null,
          transferAmount: verifiedData?.amount || null,
          transferBank: verifiedData?.bankCode || null,
          senderName: verifiedData?.senderName || null,
          paidAt: finalPaidAt,
          verifiedBy: isAutoVerified ? "SYSTEM_AUTO" : null,
          verifiedAt: isAutoVerified ? new Date() : null,
        },

        update: {
          paymentMethod: "TRANSFER",
          status: paymentStatus,
          transferRef: verifiedData?.refNo || null,
          transferAmount: verifiedData?.amount ?? undefined,
          transferBank: verifiedData?.bankCode || null,
          senderName: verifiedData?.senderName || null,
          paidAt: finalPaidAt,
          verifiedBy: isAutoVerified ? "SYSTEM_AUTO" : null,
          verifiedAt: isAutoVerified ? new Date() : null,
        },
      });

      await tx.file.create({
        data: {
          bucket: process.env.BUCKET_NAME || "default-bucket",
          objectKey: objectKey,
          mimeType: mimeType,
          size: fileBuffer.length,
          category: "PAYMENT_SLIP",
          paymentId: payment.id,
          tenantId: bill.tenantId,
          dormitoryId: bill.room.dormitoryId,
          roomId: bill.roomId,
        },
      });

      await tx.bill.update({
        where: {
          id: billId,
        },

        data: {
          status: billStatus,
        },
      });

      return {
        success: true,
        status: paymentStatus,
        message: isAutoVerified
          ? "ตรวจสอบสลิปเรียบร้อย"
          : "บันทึกสลิปเรียบร้อย (รอตรวจสอบ)",

        data: {
          paidAt: finalPaidAt,
          amount: payment.transferAmount,
          refNo: payment.transferRef,
          sender: payment.senderName,
          bank: payment.transferBank,
          isAutoVerified: isAutoVerified,
        },
      };
    });

    await createActivityLog({
      userId: userId,
      action: "SUBMIT_PAYMENT_SLIP",
      entityType: "Bill",
      entityId: billId,

      metadata: {
        amount: transactionResult.data.amount,
        isAutoVerified: transactionResult.data.isAutoVerified,
      },
    });

    try {
      const ownerEmail = bill.room.dormitory.owner?.user?.email;
      const dormName = bill.room.dormitory.name;

      if (ownerEmail) {
        await emailQueue.add({
          type: EmailType.PAYMENT_RECEIVED,
          to: ownerEmail,
          senderName: "RentFlow Notification",

          data: {
            dormName: dormName,
            roomNumber: bill.room.roomNumber,
            tenantName: `${bill.tenant.firstName} ${bill.tenant.lastName}`,
            amount: transactionResult.data.amount,
            paidDate: formatThaiDateTime(transactionResult.data.paidAt),
            bankName: transactionResult.data.bank,
            refNo: transactionResult.data.refNo,
            isAutoVerified: isAutoVerified,
            link: `${process.env.FRONTEND_URL}/owner/bills`,
          },
        });
      }
    } catch (emailError) {
      logger.error(`⚠️ Failed to queue owner email: ${emailError}`);
    }

    return transactionResult;
  },

  createMaintenance: async ({
    userId,
    title,
    description,
    files,
  }: CreateMaintenanceParams) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },

      include: {
        room: true,
      },
    });

    if (!tenant || !tenant.roomId || !tenant.room) {
      throw new Error("TENANT_OR_ROOM_NOT_FOUND");
    }

    const validFiles = files ? files.slice(0, 2) : [];
    const fileCreateData = [];

    for (const f of validFiles) {
      const ext = f.filename.split(".").pop();
      const objectKey = `maintenance/${tenant.room.dormitoryId}/${randomUUID()}.${ext}`;
      await uploadFile(f.file, objectKey, f.mimetype);

      fileCreateData.push({
        bucket: process.env.S3_BUCKET || "default-bucket",
        category: FileCategory.MAINTENANCE,
        objectKey: objectKey,
        mimeType: f.mimetype,
        size: f.file.length,
        isCover: false,
      });
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        title,
        description,
        status: MaintenanceStatus.OPEN,

        dormitory: {
          connect: {
            id: tenant.room.dormitoryId,
          },
        },

        room: {
          connect: {
            id: tenant.roomId,
          },
        },

        tenant: {
          connect: {
            id: tenant.id,
          },
        },

        images: {
          create: fileCreateData,
        },
      },

      include: {
        images: true,
      },
    });

    await createActivityLog({
      userId: userId,
      action: "CREATE_MAINTENANCE",
      entityType: "MaintenanceRequest",
      entityId: request.id,

      metadata: {
        title,
      },
    });

    return request;
  },

  getMyMaintenances: async (userId: string, params: GetMaintenanceParams) => {
    const { page, limit, status, search } = params;

    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId,
      },
    });

    if (!tenant)
      return {
        data: [],

        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };

    const whereCondition: any = {
      tenantId: tenant.id,
    };

    if (status && status !== "ALL") {
      whereCondition.status = status;
    }

    if (search) {
      whereCondition.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.maintenanceRequest.count({
        where: whereCondition,
      }),
      prisma.maintenanceRequest.findMany({
        where: whereCondition,
        skip: (page - 1) * limit,
        take: limit,

        include: {
          images: true,

          room: {
            select: {
              roomNumber: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const dataWithUrls = await Promise.all(
      requests.map(async (request) => {
        const imagesWithUrls = await Promise.all(
          request.images.map(async (image) => ({
            ...image,
            url: await generateSignedUrl(image.objectKey),
          })),
        );

        return {
          ...request,
          images: imagesWithUrls,
        };
      }),
    );

    return {
      data: dataWithUrls,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  updateMaintenance: async (
    userId: string,
    requestId: string,
    data: UpdateMaintenanceData,
  ) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId,
      },
    });

    if (!tenant) throw new Error("Tenant not found");

    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        tenantId: tenant.id,
      },

      include: {
        images: true,
      },
    });

    if (!maintenanceRequest) {
      throw new Error("Maintenance request not found or not authorized");
    }

    if (maintenanceRequest.status !== "OPEN") {
      throw new Error("Cannot edit request that is not OPEN");
    }

    if (data.deletedImageIds) {
      const idsToDelete = Array.isArray(data.deletedImageIds)
        ? data.deletedImageIds
        : [data.deletedImageIds];

      const imagesToDelete = await prisma.file.findMany({
        where: {
          id: {
            in: idsToDelete,
          },

          maintenanceId: requestId,
        },
      });

      for (const img of imagesToDelete) {
        try {
          if (img.objectKey) {
            await deleteFile(img.objectKey);
          }

          await prisma.file.delete({
            where: {
              id: img.id,
            },
          });
        } catch (err) {
          console.error(`Failed to delete image ${img.id}:`, err);
        }
      }
    }

    if (data.images) {
      const newFiles = Array.isArray(data.images) ? data.images : [data.images];

      for (const file of newFiles) {
        if (!file.filename) continue;

        const fileBuffer = await file.toBuffer();
        const ext = file.filename.split(".").pop();
        const fileName = `${uuidv4()}.${ext}`;
        const objectKey = `maintenance/${maintenanceRequest.dormitoryId}/${fileName}`;
        await uploadFile(fileBuffer, objectKey, file.mimetype);

        await prisma.file.create({
          data: {
            bucket: process.env.S3_BUCKET || "rentflow",
            objectKey: objectKey,
            mimeType: file.mimetype,
            size: file.file.bytesRead || 0,
            category: FileCategory.MAINTENANCE,
            maintenanceId: requestId,
            dormitoryId: maintenanceRequest.dormitoryId,
            tenantId: tenant.id,
          },
        });
      }
    }

    const updatedRequest = await prisma.maintenanceRequest.update({
      where: {
        id: requestId,
      },

      data: {
        title: data.title,
        description: data.description,
      },

      include: {
        images: true,
      },
    });

    await createActivityLog({
      userId: userId,
      action: "UPDATE_MAINTENANCE",
      entityType: "MaintenanceRequest",
      entityId: requestId,

      metadata: {
        title: data.title,
      },
    });

    return updatedRequest;
  },

  cancelMaintenance: async (userId: string, requestId: string) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId,
      },
    });

    if (!tenant) throw new Error("Tenant not found");

    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        tenantId: tenant.id,
      },
    });

    if (!maintenanceRequest) {
      throw new Error("Maintenance request not found or not authorized");
    }

    if (maintenanceRequest.status !== "OPEN") {
      throw new Error("Cannot cancel request that is not OPEN");
    }

    const attachedFiles = await prisma.file.findMany({
      where: {
        maintenanceId: requestId,
      },
    });

    await Promise.all(
      attachedFiles.map(async (file) => {
        if (file.objectKey) {
          try {
            await deleteFile(file.objectKey);
          } catch (err) {
            console.error(
              `Failed to delete file from S3: ${file.objectKey}`,
              err,
            );
          }
        }
      }),
    );

    await prisma.$transaction([
      prisma.file.deleteMany({
        where: {
          maintenanceId: requestId,
        },
      }),
      prisma.maintenanceRequest.delete({
        where: {
          id: requestId,
        },
      }),
    ]);

    await createActivityLog({
      userId: userId,
      action: "CANCEL_MAINTENANCE",
      entityType: "MaintenanceRequest",
      entityId: requestId,
    });

    return {
      message: "Maintenance request cancelled successfully",
    };
  },

  getTenantContractDetail: async (userId: string) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId: userId,
        isActive: true,
        deletedAt: null,
      },

      include: {
        user: {
          select: {
            email: true,
            status: true,
          },
        },

        room: {
          include: {
            dormitory: {
              include: {
                settings: true,
                paymentSetting: true,
              },
            },
          },
        },

        bills: {
          take: 1,

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    return tenant;
  },

  async createNewContractForExistingUser(ownerSub: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      const owner = await tx.ownerProfile.findUnique({
        where: {
          userId: ownerSub,
        },
      });

      if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

      const room = await tx.room.findUnique({
        where: {
          id: data.roomId,
        },

        include: {
          dormitory: true,
        },
      });

      if (!room || room.status !== "AVAILABLE")
        throw new Error("ROOM_NOT_AVAILABLE");

      if (room.dormitory.ownerId !== owner.id)
        throw new Error("FORBIDDEN_ACCESS");

      await tx.user.update({
        where: {
          id: data.userId,
        },

        data: {
          status: "ACTIVE",
        },
      });

      const newProfile = await tx.tenantProfile.create({
        data: {
          userId: data.userId,
          roomId: data.roomId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          idCard: data.idCard,
          address: data.address,
          securityDeposit: Number(data.securityDeposit),
          advancePayment: Number(data.advancePayment),
          entranceFee: Number(data.entranceFee),
          contractStartDate: new Date(data.contractStartDate),
          contractEndDate: new Date(data.contractEndDate),
          moveInDate: new Date(data.moveInDate),
          numberOfResidents: Number(data.numberOfResidents),
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          notes: data.notes,
          isActive: true,
        },
      });

      await tx.room.update({
        where: {
          id: data.roomId,
        },

        data: {
          status: "OCCUPIED",
        },
      });

      return newProfile;
    });
  },
};
