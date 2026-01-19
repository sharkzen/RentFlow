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
import { deleteFile, generateSignedUrl, uploadFile } from "@/services/minio";
import { env } from "@/config/env";
import logger from "@/utils/logger";
import { SlipApiErrorResponse, VerifiedPaymentData } from "./dto/tenant.dto";
import { emailQueue } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";

interface GetTenantDormParams {
  dormId: string;
  sub: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
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
          roomPriceSnapshot: room.basePrice,
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

      return updatedTenant;
    });
  },

  moveOut: async (sub: string, tenantId: string) => {
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
              in: ["PENDING", "OVERDUE"],
            },
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (!tenant.isActive && tenant.moveOutDate) {
      throw new Error("ALREADY_MOVED_OUT");
    }

    if (tenant.bills.length > 0) {
      throw new Error("OUTSTANDING_BILLS_EXIST");
    }

    return await prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.tenantProfile.update({
        where: {
          id: tenantId,
        },

        data: {
          moveOutDate: new Date(),
          isActive: false,
        },
      });

      if (tenant.roomId) {
        await tx.room.update({
          where: {
            id: tenant.roomId,
          },

          data: {
            status: RoomStatus.AVAILABLE,
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

      return updatedTenant;
    });
  },

  getDashboardStats: async (userId: string) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId: userId,
        isActive: true,
        deletedAt: null,
      },

      include: {
        room: {
          include: {
            dormitory: {
              select: {
                name: true,

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

    if (!tenant || !tenant.room) {
      throw new Error("TENANT_NOT_FOUND_OR_NO_ROOM");
    }

    const latestBill = await prisma.bill.findFirst({
      where: {
        tenantId: tenant.id,
        roomId: tenant.room.id,

        status: {
          not: BillStatus.CANCELLED,
        },
      },

      orderBy: [
        {
          status: "asc",
        },
        {
          billingMonth: "desc",
        },
      ],
    });

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
      },
    });

    if (!bill) {
      throw new Error("BILL_NOT_FOUND");
    }

    if (bill.tenant.userId !== userId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (bill.payment && bill.payment.slips.length > 0) {
      const slipsWithUrls = await Promise.all(
        bill.payment.slips.map(async (slip) => {
          const signedUrl = await generateSignedUrl(slip.objectKey);

          return {
            ...slip,
            url: signedUrl,
          };
        }),
      );

      (bill.payment as any).slips = slipsWithUrls;
    }

    return bill;
  },

  generateBillPdf: async (userId: string, billId: string) => {
    const bill = await tenantService.getBillById(userId, billId);

    if (!bill) throw new Error("BILL_NOT_FOUND");

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
            color: #1e293b; /* slate-800 */
          }
          .container {
            width: 210mm;
            height: 297mm;
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
            border-bottom: 2px solid #0f172a; /* border-slate-900 */
            padding: 20px 0;
          }
          .header-left h1 {
            font-size: 24px;
            margin: 0;
            color: #0f172a;
            line-height: 1.2;
          }
          .header-left p {
            font-size: 14px;
            color: #475569; /* slate-600 */
            margin: 8px 0 0 0;
            line-height: 1.5;
          }
          .header-right { text-align: right; }
          .title { font-size: 24px; font-weight: 800; margin: 0; color: #0f172a; }
          .subtitle { font-size: 18px; font-weight: 700; color: #334155; text-transform: uppercase; }
          .info-text { font-size: 14px; color: #64748b; margin-top: 12px; }
          .info-val { font-weight: 700; color: #0f172a; }

          .tenant-section {
            display: flex;
            justify-content: space-between;
            margin-top: 32px;
            gap: 48px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 8px;
            letter-spacing: 0.05em;
          }
          .tenant-name { font-size: 20px; font-weight: 700; }
          .room-label { font-size: 14px; color: #475569; margin-top: 8px; }
          .room-val { font-size: 18px; font-weight: 700; color: #0f172a; }

          .table-container { flex: 1; margin-top: 32px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th {
            background-color: #f1f5f9; /* slate-100 */
            padding: 16px 12px;
            text-align: left;
            font-weight: 700;
            border-top: 1px solid #0f172a;
            border-bottom: 1px solid #0f172a;
          }
          td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .unit-detail { font-size: 12px; color: #64748b; margin-top: 4px; }

          .footer { margin-top: 24px; border-top: 2px solid #0f172a; pt-16px; }
          .total-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 48px;
            margin-top: 16px;
          }
          .total-label { font-size: 18px; font-weight: 500; color: #475569; }
          .total-amount { font-size: 36px; font-weight: 900; color: #0f172a; }

          .signature-section {
            margin-top: 48px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px solid #f1f5f9;
            padding-top: 40px;
          }
          .note { width: 60%; font-size: 14px; color: #64748b; line-height: 1.6; }
          .note-title { font-weight: 700; color: #334155; font-style: italic; }
          
          .signature-box { text-align: center; position: relative; width: 200px; }
          .sig-line { border-bottom: 1px dotted #94a3b8; height: 64px; margin-bottom: 8px; }
          .sig-text { font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; }
          .sig-sub { font-size: 10px; color: #94a3b8; }

          .stamp {
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            pointer-events: none;
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
              <div class="info-text text-right">วันที่: <span class="info-val">${formatLongDate(new Date())}</span></div>
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
              <div class="info-text" style="color:#334155;">รอบบิลเดือน: <span class="font-bold">${new Intl.DateTimeFormat(
                "th-TH",
                {
                  month: "long",
                  year: "numeric",
                },
              ).format(new Date(bill.billingMonth))}</span></div>
              <div class="info-text font-bold" style="color: #dc2626; margin-top: 4px;">กำหนดชำระ: ${formatDate(bill.dueDate)}</div>
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
                  bill.lateFeeSnapshot > 0
                    ? `
                <tr>
                  <td class="font-bold" style="color: #dc2626;">ค่าปรับล่าช้า</td>
                  <td class="text-center">-</td>
                  <td class="text-right">-</td>
                  <td class="text-right font-bold" style="color: #dc2626;">${formatMoney(bill.lateFeeSnapshot)}</td>
                </tr>`
                    : ""
                }
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
                ${bill.status !== "PAID" ? "กรุณาตรวจสอบรายการและชำระเงินตามกำหนดเวลาที่ระบุไว้ข้างต้น" : "ขอบคุณที่ใช้บริการ เอกสารฉบับนี้ถือเป็นหลักฐานการรับเงินที่สมบูรณ์"}
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
              },
            },
          },
        },
      },
    });

    if (!bill) {
      throw new Error("BILL_NOT_FOUND");
    }

    if (bill.tenant.userId !== userId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

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
    fileName,
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

    if (refNo) {
      const existingPayment = await prisma.payment.findUnique({
        where: {
          transferRef: refNo,
        },
      });

      if (existingPayment && existingPayment.billId !== billId) {
        throw new Error("SLIP_DUPLICATE");
      }
    }

    let verifiedData: any = null;

    try {
      verifiedData = await slipOkService.verifySlip(fileBuffer, bill.total);
    } catch (error: any) {
      throw error;
    }

    let paymentStatus: PaymentStatus = PaymentStatus.WAITING_VERIFY;
    let billStatus: BillStatus = BillStatus.WAITING_FOR_VERIFICATION;
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
    const extension = mimeType ? mimeType.split("/")[1] : "jpg";
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
          ? "ชำระเงินเรียบร้อยแล้ว (ตรวจสอบอัตโนมัติ)"
          : "ส่งหลักฐานเรียบร้อย (รอเจ้าหน้าที่ตรวจสอบ)",

        data: {
          paidAt: finalPaidAt,
          amount: payment.transferAmount,
          refNo: payment.transferRef,
          sender: payment.senderName,
          bank: payment.transferBank,
        },
      };
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
};
