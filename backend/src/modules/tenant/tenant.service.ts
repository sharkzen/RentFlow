import prisma from "@/lib/prisma";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { hashPassword } from "@/modules/auth/lib/password";
import { encrypt, decrypt } from "@/utils/encryption";
import {
  BillStatus,
  MaintenanceStatus,
  PaymentStatus,
  FileCategory,
} from "@prisma/client";

import {
  buildBillHtmlTemplate,
  createPdfFromHtml,
  formatThaiDateTime,
  getCachedStamps,
  matchAccount,
} from "./lib/tenant.lib";

import { slipOkService } from "@/services/slipok.service";
import { uuidv4 } from "zod";
import { deleteFile, generateSignedUrl, uploadFile } from "@/services/r2Client";
import logger from "@/utils/logger";

import {
  CreateMaintenanceParams,
  GetBillsParams,
  GetMaintenanceParams,
  GetTenantDormParams,
  UpdateMaintenanceData,
} from "./dto/tenant.dto";

import { emailQueue } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import { randomUUID } from "crypto";
import { createActivityLog } from "@/services/activity-log.service";

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

    const [rawItems, total] = await Promise.all([
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

    const items = rawItems.map((item) => ({
      ...item,
      phone: decrypt(item.phone),
      idCard: decrypt(item.idCard),
    }));

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

    if (room.status !== "AVAILABLE") throw new Error("ROOM_NOT_AVAILABLE");

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) throw new Error("EMAIL_ALREADY_EXISTS");

    const rawPassword = data.password || data.phone;
    const hashedPassword = await hashPassword(rawPassword);

    const newTenant = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: "TENANT",
          status: "ACTIVE",
        },
      });

      const createdTenant = await tx.tenantProfile.create({
        data: {
          userId: newUser.id,
          roomId: data.roomId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
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
          notes: data.notes,
          phone: encrypt(data.phone),
          idCard: encrypt(data.idCard),
          address: encrypt(data.address),
          emergencyContactName: encrypt(data.emergencyContactName),
          emergencyContactPhone: encrypt(data.emergencyContactPhone),
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

      await createActivityLog({
        userId: userId,
        action: "CREATE_TENANT",
        entityType: "TenantProfile",
        entityId: createdTenant.id,

        metadata: {
          roomId: data.roomId,
          tenantName: `${data.firstName} ${data.lastName}`,
        },
      });

      return createdTenant;
    });

    return {
      ...newTenant,
      phone: decrypt(newTenant.phone),
      idCard: decrypt(newTenant.idCard),
      address: decrypt(newTenant.address),
      emergencyContactName: decrypt(newTenant.emergencyContactName),
      emergencyContactPhone: decrypt(newTenant.emergencyContactPhone),
    };
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

    const decryptedTenant = {
      ...tenant,
      phone: decrypt(tenant.phone),
      idCard: decrypt(tenant.idCard),
      address: decrypt(tenant.address),
      emergencyContactName: decrypt(tenant.emergencyContactName),
      emergencyContactPhone: decrypt(tenant.emergencyContactPhone),
    };

    return decryptedTenant;
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
      email: data.email || undefined,
      phone: data.phone !== undefined ? encrypt(data.phone) : undefined,
      idCard: data.idCard !== undefined ? encrypt(data.idCard) : undefined,
      address: data.address !== undefined ? encrypt(data.address) : undefined,
      emergencyContactName:
        data.emergencyContactName !== undefined
          ? encrypt(data.emergencyContactName)
          : undefined,
      emergencyContactPhone:
        data.emergencyContactPhone !== undefined
          ? encrypt(data.emergencyContactPhone)
          : undefined,
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

    const updatedTenant = await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdatePayload).length > 0) {
        await tx.user.update({
          where: {
            id: tenant.userId,
          },

          data: userUpdatePayload,
        });
      }

      const txUpdatedTenant = await tx.tenantProfile.update({
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

      return txUpdatedTenant;
    });

    return {
      ...updatedTenant,
      phone: decrypt(updatedTenant.phone),
      idCard: decrypt(updatedTenant.idCard),
      address: decrypt(updatedTenant.address),
      emergencyContactName: decrypt(updatedTenant.emergencyContactName),
      emergencyContactPhone: decrypt(updatedTenant.emergencyContactPhone),
    };
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
    let waterImageUrl = null;
    let electricImageUrl = null;

    if (latestBill) {
      const urls = await Promise.all([
        latestBill.waterImageKey
          ? generateSignedUrl(latestBill.waterImageKey, 3600)
          : null,
        latestBill.electricImageKey
          ? generateSignedUrl(latestBill.electricImageKey, 3600)
          : null,
      ]);

      waterImageUrl = urls[0];
      electricImageUrl = urls[1];
    }

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
              imageUrl: waterImageUrl,
            },

            electric: {
              used: latestBill.electricUsedSnapshot,
              currentUnit: latestBill.currentElectricUnitSnapshot,
              prevUnit: latestBill.prevElectricUnitSnapshot,
              imageUrl: electricImageUrl,
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
    const today = new Date();

    const [rawItems, total] = await Promise.all([
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
    ]);

    let items = rawItems.map((bill) => {
      let currentStatus = bill.status;
      let currentTotal = bill.total;

      if (bill.status === "PENDING" && today > new Date(bill.dueDate)) {
        currentStatus = "OVERDUE" as any;
        currentTotal = bill.total + (bill.lateFeeSnapshot || 0);
      }

      return {
        ...bill,
        status: currentStatus,
        total: currentTotal,
      };
    });

    items.sort((a, b) => {
      const priority: Record<string, number> = {
        OVERDUE: 1,
        WAITING_FOR_VERIFICATION: 2,
        PENDING: 3,
        PAID: 4,
        CANCELLED: 5,
      };

      const scoreA = priority[a.status] || 99;
      const scoreB = priority[b.status] || 99;

      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }

      return (
        new Date(b.billingMonth).getTime() - new Date(a.billingMonth).getTime()
      );
    });

    const allPendingBills = await prisma.bill.findMany({
      where: {
        tenantId: tenant.id,

        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
    });

    const totalPending = allPendingBills.reduce((sum, bill) => {
      let billAmount = bill.total;

      if (bill.status === "PENDING" && today > new Date(bill.dueDate)) {
        billAmount += bill.lateFeeSnapshot || 0;
      }

      return sum + billAmount;
    }, 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),

      summary: {
        totalPending: totalPending,
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

    const previousBill = await prisma.bill.findFirst({
      where: {
        roomId: bill.roomId,

        billingMonth: {
          lt: bill.billingMonth,
        },

        status: {
          not: "CANCELLED",
        },
      },

      orderBy: {
        billingMonth: "desc",
      },

      select: {
        waterImageKey: true,
        electricImageKey: true,
      },
    });

    const [currWater, currElectric, prevWater, prevElectric] =
      await Promise.all([
        bill.waterImageKey ? generateSignedUrl(bill.waterImageKey, 3600) : null,
        bill.electricImageKey
          ? generateSignedUrl(bill.electricImageKey, 3600)
          : null,
        previousBill?.waterImageKey
          ? generateSignedUrl(previousBill.waterImageKey, 3600)
          : null,
        previousBill?.electricImageKey
          ? generateSignedUrl(previousBill.electricImageKey, 3600)
          : null,
      ]);

    return {
      ...bill,

      meterImages: {
        water: {
          current: currWater,
          previous: prevWater,
        },

        electric: {
          current: currElectric,
          previous: prevElectric,
        },
      },
    };
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

    const formatThaiDate = (date: any, options: any) =>
      new Intl.DateTimeFormat("th-TH", {
        ...options,
        year: "numeric",
      }).format(new Date(date));

    const formatMoney = (amount: number) =>
      amount.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
      });

    const stamps = await getCachedStamps();
    const htmlContent = buildBillHtmlTemplate(
      bill,
      finalDaysLate,
      formatMoney,
      formatThaiDate,
      stamps,
    );
    const pdfBuffer = await createPdfFromHtml(htmlContent);
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
      promptPayName: paymentSetting.bankHolder || "ไม่ระบุ",
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
        userId,
        isActive: true,
      },

      include: {
        room: {
          include: {
            dormitory: {
              include: {
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

    const ownerEmail = tenant?.room?.dormitory?.owner?.user?.email;

    if (ownerEmail) {
      const emailData = {
        type: EmailType.MAINTENANCE_CREATED,
        to: ownerEmail,
        senderName: tenant.room.dormitory.name,

        data: {
          dormName: tenant.room.dormitory.name,
          roomNumber: tenant.room.roomNumber,
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          title: title,
          description: description || "-",
          link: `${process.env.FRONTEND_URL}/owner/maintenance/${request.id}`,
          hasImages: request.images.length > 0,
        },
      };

      try {
        await emailQueue.add(emailData);
      } catch (err) {
        console.error("Failed to queue email:", err);
      }
    }

    await createActivityLog({
      userId,
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
        userId: userId,
        isActive: true,
      },
    });

    if (!tenant) {
      return {
        data: [],

        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

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
        isActive: true,
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
      throw new Error("Cannot cancel request that is not OPEN");
    }

    if (maintenanceRequest.images.length > 0) {
      const deletePromises = maintenanceRequest.images.map((file) => {
        if (file.objectKey) {
          return deleteFile(file.objectKey).catch((err) => {
            logger.error(
              `❌ Failed to delete file from R2: ${file.objectKey}`,
              err,
            );
          });
        }

        return Promise.resolve();
      });

      await Promise.all(deletePromises);
    }

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

      metadata: {
        title: maintenanceRequest.title,
        roomNumber: maintenanceRequest.roomId,
      },
    });

    return {
      success: true,
      message: "ลบรายการแจ้งซ่อมและรูปภาพประกอบเรียบร้อยแล้ว",
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

    return {
      ...tenant,
      phone: decrypt(tenant.phone),
      idCard: decrypt(tenant.idCard),
      address: decrypt(tenant.address),
      emergencyContactName: decrypt(tenant.emergencyContactName),
      emergencyContactPhone: decrypt(tenant.emergencyContactPhone),
    };
  },

  createNewContractForExistingUser: async (ownerSub: string, data: any) => {
    const createdProfile = await prisma.$transaction(async (tx) => {
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
          email: data.email,
          securityDeposit: Number(data.securityDeposit),
          advancePayment: Number(data.advancePayment),
          entranceFee: Number(data.entranceFee),
          contractStartDate: new Date(data.contractStartDate),
          contractEndDate: new Date(data.contractEndDate),
          moveInDate: new Date(data.moveInDate),
          numberOfResidents: Number(data.numberOfResidents),
          notes: data.notes,
          isActive: true,
          phone: encrypt(data.phone),
          idCard: encrypt(data.idCard),
          address: encrypt(data.address),
          emergencyContactName: encrypt(data.emergencyContactName),
          emergencyContactPhone: encrypt(data.emergencyContactPhone),
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

    return {
      ...createdProfile,
      phone: decrypt(createdProfile.phone),
      idCard: decrypt(createdProfile.idCard),
      address: decrypt(createdProfile.address),
      emergencyContactName: decrypt(createdProfile.emergencyContactName),
      emergencyContactPhone: decrypt(createdProfile.emergencyContactPhone),
    };
  },
};
