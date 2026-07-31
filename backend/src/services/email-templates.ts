import { EmailType } from "../queues/email.types";
import { env } from "../config/env";

const THEME = {
  primary: "#0f172a",
  secondary: "#64748B",
  text: "#334155",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f1f5f9",
  paper: "#ffffff",
  danger: "#dc2626",
  success: "#10b981",
  successBg: "#ecfdf5",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  dangerText: "#991B1B",
};

const getBankName = (code: string) => {
  const banks: Record<string, string> = {
    "002": "ธนาคารกรุงเทพ (BBL)",
    "004": "ธนาคารกสิกรไทย (KBANK)",
    "006": "ธนาคารกรุงไทย (KTB)",
    "011": "ธนาคารทหารไทยธนชาต (TTB)",
    "014": "ธนาคารไทยพาณิชย์ (SCB)",
    "025": "ธนาคารกรุงศรีอยุธยา (BAY)",
    "030": "ธนาคารออมสิน (GSB)",
    "034": "ธนาคาร ธ.ก.ส. (BAAC)",
    "069": "ธนาคารเกียรตินาคินภัทร (KKP)",
    "073": "ธนาคารแลนด์ แอนด์ เฮาส์ (LH)",
  };

  return banks[code] || code || "-";
};

const minifyHtml = (html: string) => {
  return html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
};

const getSubject = (text: string) => {
  if (env.NODE_ENV === "development") {
    const time = new Date().toLocaleTimeString("th-TH", {
      hour12: false,
    });

    return `[DEV ${time}] ${text}`;
  }

  return text;
};

const wrapEmail = (title: string, contentHtml: string, preheader?: string) => {
  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${THEME.bg};">${preheader}</div>`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        /* Force Sarabun */
        body, table, td, p, a, li, blockquote {
          font-family: 'Sarabun', 'TH Sarabun New', Helvetica, Arial, sans-serif !important;
        }

        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
          .paper { width: 100% !important; padding: 15px !important; }
          .col-left, .col-right { display: block !important; width: 100% !important; text-align: left !important; }
          .col-right { margin-top: 15px !important; }
          .table-header { font-size: 12px !important; }
          .hide-mobile { display: none !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px 0; background-color: ${THEME.bg}; -webkit-font-smoothing: antialiased;">
      ${preheaderHtml}
      <table role="presentation" class="paper" align="center" width="700" style="margin: 0 auto; background-color: ${THEME.paper}; border: 1px solid ${THEME.border}; border-spacing: 0;">
        <tr>
          <td style="padding: 40px;">
            ${contentHtml}
          </td>
        </tr>
        
        <tr>
          <td style="background-color: ${THEME.primary}; padding: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
            © 2026 RentFlow Management System
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};

export const getEmailTemplate = (type: EmailType, data: any) => {
  switch (type) {
    case EmailType.NEW_BILL: {
      const formatMoney = (amount: number) =>
        Number(amount).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
        });

      const chargeItems =
        data.details.items?.filter((item: any) => item.type === "CHARGE") || [];
      const discountItems =
        data.details.items?.filter((item: any) => item.type === "DISCOUNT") ||
        [];

      const lateFeeHtml =
        data.status === "OVERDUE" && Number(data.details.lateFee) > 0
          ? `
        <tr>
          <td style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border};">
            <div style="font-weight: 700; color: ${THEME.danger};">ค่าปรับล่าช้า</div>
            ${data.daysLate > 0 ? `<div style="font-size: 12px; color: ${THEME.muted}; margin-top: 4px;">(ค้างชำระ ${data.daysLate} วัน)</div>` : ""}
          </td>
          <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
          <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
          <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.danger};">${formatMoney(data.details.lateFee)}</td>
        </tr>
      `
          : "";

      const chargeItemsHtml = chargeItems
        .map(
          (item: any) => `
        <tr>
          <td style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">${item.name}</td>
          <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
          <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
          <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">${formatMoney(item.amount)}</td>
        </tr>
      `,
        )
        .join("");

      const discountItemsHtml = discountItems
        .map(
          (item: any) => `
        <tr>
          <td style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border};">
            <div style="font-weight: 700; color: ${THEME.danger};">
              ${item.name} <span style="margin-left: 8px; font-size: 11px; color: #ef4444;">(ส่วนลด/หักลบ)</span>
            </div>
          </td>
          <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
          <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
          <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.danger};">-${formatMoney(item.amount)}</td>
        </tr>
      `,
        )
        .join("");

      return {
        subject: getSubject(
          `🧾 บิลค่าเช่าห้อง ${data.roomNumber} ประจำเดือน ${data.month}`,
        ),

        html: minifyHtml(
          wrapEmail(
            "บิลค่าเช่า",
            `
          <table width="100%" style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 20px;">
            <tr>
              <td valign="top" class="col-left" style="width: 60%;">
                <h1 style="margin: 0; color: ${THEME.primary}; font-size: 26px; font-weight: 700; line-height: 1.2;">
                  ${data.dormName}
                </h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: ${THEME.text}; line-height: 1.5;">
                  โทร: ${data.ownerPhone || "-"}
                </p>
              </td>
              <td valign="top" class="col-right" style="width: 40%; text-align: right;">
                <div style="font-size: 24px; font-weight: 800; color: ${THEME.primary}; margin-bottom: 5px;">บิลค่าเช่า</div>
                <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: ${THEME.text}; letter-spacing: 1px;">(INVOICE)</div>
                <div style="margin-top: 15px; font-size: 14px; color: ${THEME.muted};">
                  เลขที่: <span style="font-weight: 700; color: ${THEME.primary};">#${data.billId}</span><br>
                  วันที่: <span style="font-weight: 700; color: ${THEME.primary};">${data.currentDate}</span>
                </div>
              </td>
            </tr>
          </table>

          <table width="100%" style="margin-top: 30px;">
            <tr>
              <td valign="top" class="col-left" style="width: 60%;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${THEME.muted}; border-bottom: 1px solid ${THEME.border}; padding-bottom: 4px; margin-bottom: 8px;">
                  ผู้เช่า (Bill To)
                </div>
                <div style="font-size: 20px; font-weight: 700; color: ${THEME.text}; margin-bottom: 4px;">
                  ${data.tenantName}
                </div>
                <div style="font-size: 14px; color: ${THEME.muted};">
                  ห้องเลขที่: <span style="font-size: 18px; font-weight: 700; color: ${THEME.primary};">${data.roomNumber}</span>
                </div>
              </td>
              <td valign="top" class="col-right" style="width: 40%; text-align: right;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${THEME.muted}; border-bottom: 1px solid ${THEME.border}; padding-bottom: 4px; margin-bottom: 8px;">
                  รายละเอียด (Reference)
                </div>
                <div style="font-size: 14px; color: ${THEME.text}; margin-bottom: 6px;">
                  รอบบิลเดือน: <span style="font-weight: 700;">${data.month}</span>
                </div>
                <div style="font-size: 14px; color: ${THEME.danger}; font-weight: 700;">
                  ชำระไม่เกิน: ${data.dueDate}
                </div>
              </td>
            </tr>
          </table>

          <div style="margin-top: 30px;">
            <table width="100%" style="border-collapse: collapse; width: 100%;">
              <thead style="background-color: #f1f5f9;">
                <tr>
                  <th align="left" style="padding: 12px; border-top: 2px solid ${THEME.primary}; border-bottom: 2px solid ${THEME.primary}; font-weight: 700; font-size: 14px; color: ${THEME.primary};">รายการ (Description)</th>
                  <th align="center" style="padding: 12px; border-top: 2px solid ${THEME.primary}; border-bottom: 2px solid ${THEME.primary}; font-weight: 700; font-size: 14px; color: ${THEME.primary};">หน่วย (Units)</th>
                  <th align="right" style="padding: 12px; border-top: 2px solid ${THEME.primary}; border-bottom: 2px solid ${THEME.primary}; font-weight: 700; font-size: 14px; color: ${THEME.primary};">ราคา/หน่วย</th>
                  <th align="right" style="padding: 12px; border-top: 2px solid ${THEME.primary}; border-bottom: 2px solid ${THEME.primary}; font-weight: 700; font-size: 14px; color: ${THEME.primary};">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">
                    ค่าเช่าห้องพัก
                  </td>
                  <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">${data.details.rent}</td>
                </tr>

                <tr>
                  <td style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border};">
                    <div style="font-weight: 700; color: ${THEME.text};">ค่าน้ำประปา 💧</div>
                    <div style="font-size: 12px; color: ${THEME.muted}; margin-top: 4px;">
                      ${
                        Number(data.details.water.prev) === 0 && Number(data.details.water.curr) === 0
                          ? '(เหมาจ่าย)'
                          : `(มิเตอร์: ${data.details.water.prev} - ${data.details.water.curr})`
                      }
                    </div>
                  </td>
                  <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 600; color: ${THEME.text};">
                    ${
                      Number(data.details.water.prev) === 0 && Number(data.details.water.curr) === 0
                        ? '-'
                        : data.details.water.used
                    }
                  </td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.text};">
                    ${data.details.water.unitPrice}
                  </td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">
                    ${data.details.water.total}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border};">
                    <div style="font-weight: 700; color: ${THEME.text};">ค่าไฟฟ้า ⚡</div>
                    <div style="font-size: 12px; color: ${THEME.muted}; margin-top: 4px;">
                      (มิเตอร์: ${data.details.electric.prev} - ${data.details.electric.curr})
                    </div>
                  </td>
                  <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 600; color: ${THEME.text};">
                    ${data.details.electric.used}
                  </td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.text};">
                    ${data.details.electric.unitPrice}
                  </td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">
                    ${data.details.electric.total}
                  </td>
                </tr>

                ${
                  Number(data.details.commonFeeRaw) > 0
                    ? `
                <tr>
                  <td style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">
                    ค่าส่วนกลาง
                  </td>
                  <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; color: ${THEME.muted};">-</td>
                  <td align="right" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 700; color: ${THEME.text};">${data.details.commonFee}</td>
                </tr>`
                    : ""
                }

                ${lateFeeHtml}
                ${chargeItemsHtml}
                ${discountItemsHtml}

              </tbody>
            </table>
          </div>

          <div style="margin-top: 20px; border-top: 2px solid ${THEME.primary}; padding-top: 20px;">
            <table width="100%">
              <tr>
                <td align="right">
                   <span style="font-size: 18px; font-weight: 600; color: ${THEME.text}; margin-right: 20px;">ยอดรวมสุทธิ (Total)</span>
                   <span style="font-size: 36px; font-weight: 900; color: ${THEME.primary};">฿${data.amount}</span>
                </td>
              </tr>
              <tr>
                <td align="right" style="font-size: 12px; color: ${THEME.muted}; font-style: italic; padding-top: 5px;">
                  * กรุณาตรวจสอบความถูกต้องและชำระเงินตามยอดที่ระบุ
                </td>
              </tr>
            </table>
          </div>

          <table width="100%" style="margin-top: 40px; border-top: 1px solid ${THEME.bg}; padding-top: 30px;">
             <tr>
               <td width="60%" valign="bottom" style="font-size: 14px; color: ${THEME.muted}; line-height: 1.6;">
                 <strong>หมายเหตุ:</strong><br>
                 เมื่อทำการโอนเงินแล้ว กรุณาแจ้งการชำระเงินผ่านระบบ<br>หรือกดปุ่มด้านขวาเพื่อดำเนินการต่อ
               </td>
               <td width="40%" align="center" valign="bottom">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: 700; display: inline-block;">
                    แจ้งชำระเงิน (Pay Now)
                  </a>
                  <div style="margin-top: 15px; border-bottom: 1px dotted ${THEME.muted}; width: 150px; margin-left: auto; margin-right: auto;"></div>
                  <div style="font-size: 12px; font-weight: 700; color: ${THEME.text}; margin-top: 5px;">ผู้ออกเอกสาร</div>
               </td>
             </tr>
          </table>
          `,
          ),
        ),
      };
    }
    case EmailType.PAYMENT_RECEIVED: {
      const isAuto = data.isAutoVerified;
      const statusColor = isAuto ? THEME.success : THEME.warning;
      const statusBg = isAuto ? "#f0fdf4" : "#fffbeb";
      const statusBorder = isAuto ? "#86efac" : "#fde047";
      const statusText = isAuto ? "ชำระเงินสำเร็จ" : "รอตรวจสอบ";
      const statusIcon = isAuto ? "✓" : "⏱";
      const actionText = isAuto ? "ดูประวัติธุรกรรม" : "ตรวจสอบสลิป";
      const bankDisplayName = getBankName(data.bankName);

      return {
        subject: getSubject(
          `💰 แจ้งชำระเงิน ${data.amount} บาท (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "ใบแจ้งชำระเงิน",
            `
        <!-- Status Banner -->
        <div style="background-color: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 12px; padding: 16px 24px; margin-bottom: 24px; text-align: center;">
          <table width="100%" style="border-spacing: 0;">
            <tr>
              <td align="center">
                <span style="font-size: 28px; vertical-align: middle; margin-right: 8px;">${statusIcon}</span>
                <span style="color: ${statusColor}; font-size: 18px; font-weight: 700; vertical-align: middle;">
                  ${statusText}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Receipt Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
          <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            ใบแจ้งชำระเงิน
          </div>
          <div style="font-size: 14px; color: #64748b; font-weight: 600;">
            PAYMENT RECEIPT
          </div>
        </div>

        <!-- Receipt Body -->
        <div style="background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 8px; padding: 0; margin-bottom: 24px;">
          
          <!-- Dorm Name -->
          <div style="background-color: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 4px;">
              หอพัก / DORMITORY
            </div>
            <div style="color: #0f172a; font-size: 16px; font-weight: 700;">
              ${data.dormName}
            </div>
          </div>

          <!-- Receipt Details -->
          <div style="padding: 24px;">
            
            <!-- Row 1: Room & Tenant -->
            <table width="100%" style="border-spacing: 0; margin-bottom: 20px;">
              <tr>
                <td width="50%" style="padding-right: 12px; vertical-align: top;">
                  <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                    เลขที่ห้อง
                  </div>
                  <div style="color: #0f172a; font-size: 20px; font-weight: 800;">
                    ${data.roomNumber}
                  </div>
                </td>
                <td width="50%" style="padding-left: 12px; vertical-align: top;">
                  <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                    ผู้เช่า
                  </div>
                  <div style="color: #0f172a; font-size: 16px; font-weight: 700;">
                    ${data.tenantName}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height: 1px; background-color: #e2e8f0; margin: 20px 0;"></div>

            <!-- Row 2: Bank & Date -->
            <table width="100%" style="border-spacing: 0; margin-bottom: 20px;">
              <tr>
                <td width="50%" style="padding-right: 12px; vertical-align: top;">
                  <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                    💳 ธนาคาร
                  </div>
                  <div style="color: #0f172a; font-size: 15px; font-weight: 600;">
                    ${bankDisplayName}
                  </div>
                </td>
                <td width="50%" style="padding-left: 12px; vertical-align: top;">
                  <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                    📅 วันที่ชำระ
                  </div>
                  <div style="color: #0f172a; font-size: 15px; font-weight: 600;">
                    ${data.paidDate}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height: 2px; background-color: #e2e8f0; margin: 20px 0;"></div>

            <!-- Amount Section -->
            <table width="100%" style="border-spacing: 0;">
              <tr>
                <td>
                  <div style="color: #64748b; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    💵 ยอดเงินที่ชำระ
                  </div>
                  <div style="color: #0f172a; font-size: 42px; font-weight: 800; line-height: 1; letter-spacing: -1px;">
                    ฿${Number(data.amount).toLocaleString("th-TH")}
                  </div>
                </td>
              </tr>
            </table>

            ${
              data.refNo
                ? `
            <!-- Reference Number -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
              <table width="100%" style="border-spacing: 0;">
                <tr>
                  <td style="color: #64748b; font-size: 12px; font-weight: 600;">
                    📋 หมายเลขอ้างอิง
                  </td>
                  <td align="right" style="color: #0f172a; font-size: 14px; font-weight: 700; font-family: 'Courier New', monospace;">
                    #${data.refNo}
                  </td>
                </tr>
              </table>
            </div>
            `
                : ""
            }

          </div>
        </div>

        <!-- Notice Box -->
        <div style="background-color: ${isAuto ? "#f0fdf4" : "#fffbeb"}; border-left: 4px solid ${statusColor}; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
          <div style="color: #0f172a; font-size: 14px; line-height: 1.6;">
            <strong>${isAuto ? "✓ สถานะ:" : "⏱ สถานะ:"}</strong> 
            ${isAuto ? "การชำระเงินได้รับการยืนยันอัตโนมัติแล้ว ระบบได้บันทึกข้อมูลเรียบร้อย" : "กรุณารอการตรวจสอบจากเจ้าหน้าที่ภายใน 24 ชั่วโมง คุณจะได้รับการแจ้งเตือนเมื่อยืนยันแล้ว"}
          </div>
        </div>

        <!-- CTA Button -->
        <table width="100%" style="margin-top: 24px;">
          <tr>
            <td align="center">
              <a href="${data.link}" 
                 style="background-color: #0f172a; 
                        color: #ffffff; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: 700; 
                        font-size: 15px; 
                        display: inline-block; 
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                📊 ${actionText}
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          หากมีข้อสงสัยเกี่ยวกับการชำระเงิน กรุณาติดต่อเจ้าหน้าที่
        </div>
        `,
          ),
        ),
      };
    }
    case EmailType.REJECT_SLIP: {
      const statusColor = "#ef4444";
      const statusBg = "#fef2f2";
      const statusBorder = "#fca5a5";
      const statusText = "สลิปไม่ถูกต้อง";
      const statusIcon = "❌";
      const actionText = "แนบสลิปใหม่";

      return {
        subject: getSubject(
          `⚠️ แจ้งเตือน: สลิปไม่ถูกต้อง กรุณาแนบใหม่ (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "แจ้งเตือนสลิปไม่ถูกต้อง",
            `
        <!-- Status Banner -->
        <div style="background-color: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 12px; padding: 16px 24px; margin-bottom: 24px; text-align: center;">
          <table width="100%" style="border-spacing: 0;">
            <tr>
              <td align="center">
                <span style="font-size: 28px; vertical-align: middle; margin-right: 8px;">${statusIcon}</span>
                <span style="color: ${statusColor}; font-size: 18px; font-weight: 700; vertical-align: middle;">
                  ${statusText}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
          <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            แจ้งปฏิเสธการรับชำระเงิน
          </div>
          <div style="font-size: 14px; color: #ef4444; font-weight: 600;">
            PAYMENT REJECTED
          </div>
        </div>

        <!-- Receipt Body -->
        <div style="background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 8px; padding: 0; margin-bottom: 24px;">
          
          <!-- Dorm Name -->
          <div style="background-color: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0;">
            <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 4px;">
              หอพัก / DORMITORY
            </div>
            <div style="color: #0f172a; font-size: 16px; font-weight: 700;">
              ${data.dormName}
            </div>
          </div>

          <!-- Details -->
          <div style="padding: 24px;">
            
            <!-- Row 1: Room & Tenant -->
            <table width="100%" style="border-spacing: 0; margin-bottom: 20px;">
              <tr>
                <td width="50%" style="padding-right: 12px; vertical-align: top;">
                  <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                    เลขที่ห้อง
                  </div>
                  <div style="color: #0f172a; font-size: 20px; font-weight: 800;">
                    ${data.roomNumber}
                  </div>
                </td>
                <td width="50%" style="padding-left: 12px; vertical-align: top;">
                  <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                    ผู้เช่า
                  </div>
                  <div style="color: #0f172a; font-size: 16px; font-weight: 700;">
                    ${data.tenantName}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height: 1px; background-color: #e2e8f0; margin: 20px 0;"></div>

            <!-- Amount Section -->
            <table width="100%" style="border-spacing: 0;">
              <tr>
                <td>
                  <div style="color: #64748b; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    📄 ยอดเงินบิลรอบ ${data.month}
                  </div>
                  <div style="color: #0f172a; font-size: 32px; font-weight: 800; line-height: 1; letter-spacing: -1px;">
                    ฿${data.amount}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Reason Box (เน้นเหตุผลที่ Reject) -->
            <div style="margin-top: 24px; background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px;">
              <div style="color: #b91c1c; font-size: 13px; font-weight: 700; margin-bottom: 8px;">
                ⚠️ เหตุผลที่ปฏิเสธ:
              </div>
              <div style="color: #991b1b; font-size: 15px; line-height: 1.5;">
                ${data.reason || "สลิปยอดเงินไม่ตรง หรือรูปสลิปไม่ชัดเจน โปรดตรวจสอบและแนบสลิปเข้ามาใหม่"}
              </div>
            </div>

          </div>
        </div>

        <!-- Notice Box -->
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
          <div style="color: #0f172a; font-size: 14px; line-height: 1.6;">
            <strong>💡 สิ่งที่ต้องทำต่อไป:</strong> 
            สถานะบิลของคุณถูกเปลี่ยนกลับเป็น "รอชำระ" แล้ว กรุณากดปุ่มด้านล่างเพื่อตรวจสอบบิลและทำการแนบสลิปโอนเงินเข้ามาใหม่อีกครั้ง
          </div>
        </div>

        <!-- CTA Button -->
        <table width="100%" style="margin-top: 24px;">
          <tr>
            <td align="center">
              <a href="${data.link}" 
                 style="background-color: #ef4444; 
                        color: #ffffff; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: 700; 
                        font-size: 15px; 
                        display: inline-block; 
                        box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">
                📤 ${actionText}
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          หากคุณมั่นใจว่าสลิปเดิมถูกต้อง หรือมีข้อสงสัยเพิ่มเติม กรุณาติดต่อเจ้าหน้าที่หอพัก
        </div>
        `,
          ),
        ),
      };
    }
    case EmailType.RESET_PASSWORD:
      return {
        subject: getSubject(
          `${data.otp} คือรหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณ`,
        ),
        html: getResetPasswordOtpHtml(data.otp),
      };
    case EmailType.OWNER_APPROVED: {
      const loginLink = env.FRONTEND_URL;

      const approveDate = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Bangkok",
      });

      return {
        subject: getSubject(
          "บัญชีผู้จัดการหอพักของคุณได้รับการอนุมัติแล้ว | RentFlow",
        ),

        html: minifyHtml(
          wrapEmail(
            "อนุมัติบัญชีสำเร็จ",
            `
            <table width="100%" style="margin-bottom: 30px;">
              <tr>
                <td align="center">
                  <div style="background-color: ${THEME.successBg}; width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 4px solid #ffffff; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto; padding-top: 22px;">
                      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="${THEME.success}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M9 12L11 14L15 10" stroke="${THEME.success}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <h1 style="color: ${THEME.primary}; margin: 0 0 10px 0; font-size: 28px; font-weight: 800; text-align: center; letter-spacing: -0.5px;">
                    ยินดีต้อนรับสู่ RentFlow
                  </h1>
                  <p style="color: ${THEME.success}; font-size: 16px; font-weight: 700; margin: 0; text-align: center; background-color: ${THEME.successBg}; display: inline-block; padding: 6px 16px; border-radius: 20px;">
                    ตรวจสอบข้อมูลเรียบร้อยแล้ว
                  </p>
                </td>
              </tr>
            </table>

            <div style="padding: 0 10px;">
              <p style="color: ${THEME.text}; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                เรียน คุณ <strong style="color: ${THEME.primary};">${data.ownerName}</strong>,
              </p>
              
              <p style="color: ${THEME.secondary}; font-size: 16px; line-height: 1.8; margin-bottom: 28px;">
                เราขอแจ้งให้ทราบว่า ข้อมูลและเอกสารของคุณได้ผ่านการตรวจสอบจากทีมงาน <strong>RentFlow</strong> เรียบร้อยแล้ว 
                ขณะนี้บัญชีของคุณเปิดใช้งานอย่างสมบูรณ์ คุณสามารถเข้าสู่ระบบเพื่อเริ่มต้นบริหารจัดการหอพักได้อย่างเต็มรูปแบบ
              </p>

              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                  รายละเอียดบัญชีผู้ใช้งาน
                </div>
                <table width="100%" style="border-spacing: 0;">
                  <tr>
                    <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px; width: 35%;">อีเมล:</td>
                    <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; padding-bottom: 12px;">${data.email}</td>
                  </tr>
                  <tr>
                    <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px;">ระดับบัญชี:</td>
                    <td style="padding-bottom: 12px;">
                      <span style="background-color: #f1f5f9; color: ${THEME.primary}; font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 4px;">เจ้าของหอพัก (Owner)</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: ${THEME.secondary}; font-size: 15px;">วันที่อนุมัติ:</td>
                    <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600;">${approveDate}</td>
                  </tr>
                </table>
              </div>

              <table width="100%" style="margin-bottom: 36px;">
                <tr>
                  <td align="center">
                    <a href="${loginLink}" 
                       style="background-color: ${THEME.primary}; 
                              color: #ffffff; 
                              padding: 16px 48px; 
                              text-decoration: none; 
                              border-radius: 6px; 
                              font-weight: 700; 
                              font-size: 16px; 
                              display: inline-block; 
                              transition: background-color 0.3s;">
                      เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-left: 4px solid ${THEME.primary}; border-radius: 0 8px 8px 0; padding: 20px; text-align: left;">
                <h3 style="margin: 0 0 12px 0; color: ${THEME.primary}; font-size: 16px; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">🚀</span> สิ่งที่ควรทำเป็นอันดับแรก:
                </h3>
                <table width="100%" style="border-spacing: 0;">
                  <tr>
                    <td valign="top" style="padding-bottom: 8px; width: 20px; color: ${THEME.primary};">1.</td>
                    <td style="color: ${THEME.text}; font-size: 14px; line-height: 1.5; padding-bottom: 8px;">ตั้งค่าข้อมูลพื้นฐานและช่องทางการรับชำระเงินของหอพัก</td>
                  </tr>
                  <tr>
                    <td valign="top" style="padding-bottom: 8px; width: 20px; color: ${THEME.primary};">2.</td>
                    <td style="color: ${THEME.text}; font-size: 14px; line-height: 1.5; padding-bottom: 8px;">เพิ่มข้อมูลห้องพัก ราคา และค่าน้ำ/ค่าไฟ</td>
                  </tr>
                  <tr>
                    <td valign="top" style="width: 20px; color: ${THEME.primary};">3.</td>
                    <td style="color: ${THEME.text}; font-size: 14px; line-height: 1.5;">เพิ่มข้อมูลผู้เช่าเพื่อเริ่มออกบิลเรียกเก็บเงิน</td>
                  </tr>
                </table>
              </div>
            </div>
            `,
          ),
        ),
      };
    }
    case EmailType.OWNER_REJECTED: {
      const rejectDate = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Bangkok",
      });

      return {
        subject: getSubject("แจ้งผลการตรวจสอบบัญชีผู้จัดการหอพัก | RentFlow"),

        html: minifyHtml(
          wrapEmail(
            "แจ้งผลการพิจารณา",
            `
            <table width="100%" style="margin-bottom: 30px;">
              <tr>
                <td align="center">
                  <h1 style="color: ${THEME.text}; margin: 0 0 10px 0; font-size: 24px; font-weight: 800; text-align: center;">
                    แจ้งผลการตรวจสอบบัญชี
                  </h1>
                </td>
              </tr>
            </table>

            <div style="padding: 0 10px;">
              <p style="color: ${THEME.text}; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                เรียน คุณ <strong style="color: ${THEME.primary};">${data.ownerName}</strong>,
              </p>
              
              <p style="color: ${THEME.secondary}; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
                จากการตรวจสอบข้อมูลและเอกสารประกอบการสมัครบัญชีผู้จัดการหอพักของคุณ ทีมงาน RentFlow ขออภัยที่ต้องแจ้งให้ทราบว่า <strong>เราไม่สามารถอนุมัติบัญชีของคุณได้ในขณะนี้</strong> เนื่องจากพบข้อมูลบางส่วนไม่ถูกต้องหรือไม่สมบูรณ์
              </p>

              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                <div style="font-size: 14px; font-weight: 700; color: #be123c; margin-bottom: 10px; display: flex; align-items: center;">
                  สิ่งที่ควรตรวจสอบก่อนทำการสมัครใหม่:
                </div>
                <ul style="margin: 0; padding-left: 20px; color: #9f1239; font-size: 14px; line-height: 1.7;">
                  <li><strong>การปักหมุดที่ตั้งหอพัก:</strong> กรุณาตรวจสอบและปักหมุดตำแหน่งที่ตั้งหอพักในแผนที่ให้ตรงกับความจริง</li>
                  <li><strong>ข้อมูลและเอกสาร:</strong> ตรวจสอบข้อมูลให้ถูกต้องว่าเป็นข้อมูลจริงทั้งหมด</li>
                </ul>
              </div>

              <p style="color: ${THEME.text}; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                เพื่อความถูกต้องของระบบและแผนที่ ระบบได้ทำการยกเลิกข้อมูลการสมัครเดิมของคุณแล้ว <strong>คุณสามารถทำการสมัครและกรอกข้อมูลเข้ามาใหม่ได้ทันที</strong> ทางเราหวังเป็นอย่างยิ่งว่าจะได้ร่วมงานกับคุณ
              </p>

              <div style="text-align: center; color: ${THEME.muted}; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                รหัสอ้างอิง: REJ-${new Date().getTime().toString().slice(-6)} <br>
                วันที่ทำรายการ: ${rejectDate}
              </div>
            </div>
            `,
          ),
        ),
      };
    }
    case EmailType.MAINTENANCE_CREATED: {
      return {
        subject: getSubject(
          `🛠️ แจ้งซ่อมใหม่: ห้อง ${data.roomNumber} - ${data.title}`,
        ),

        html: minifyHtml(
          wrapEmail(
            "แจ้งซ่อมใหม่",
            `
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" bgcolor="${THEME.bg}" style="width: 80px; height: 80px; border-radius: 40px; vertical-align: middle;">
                    <span style="font-size: 38px; line-height: 80px; display: block;">🛠️</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: ${THEME.primary}; margin: 24px 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">มีการแจ้งซ่อมใหม่</h1>
              <p style="color: ${THEME.muted}; margin: 0; font-size: 16px;">หอพัก: <strong style="color: ${THEME.primary};">${data.dormName}</strong></p>
            </td>
          </tr>
        </table>

        <div style="background-color: #ffffff; border: 1px solid ${THEME.border}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); margin-bottom: 32px;">
          <div style="background-color: ${THEME.primary}; padding: 14px 24px;">
            <table width="100%">
              <tr>
                <td style="color: #ffffff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Maintenance Request</td>
              </tr>
            </table>
          </div>
          
          <div style="padding: 24px; background-color: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-bottom: 16px; width: 100px; color: ${THEME.muted}; font-size: 14px; font-weight: 600;">ห้องพัก:</td>
                <td style="padding-bottom: 16px; color: ${THEME.primary}; font-weight: 800; font-size: 20px;">${data.roomNumber}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 16px; width: 100px; color: ${THEME.muted}; font-size: 14px; font-weight: 600;">ผู้แจ้ง:</td>
                <td style="padding-bottom: 16px; color: ${THEME.text}; font-weight: 600;">${data.tenantName}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 16px; width: 100px; color: ${THEME.muted}; font-size: 14px; font-weight: 600;">หัวข้อ:</td>
                <td style="padding-bottom: 16px; color: ${THEME.text}; font-weight: 700;">${data.title}</td>
              </tr>
              <tr>
                <td valign="top" style="padding-top: 4px; width: 100px; color: ${THEME.muted}; font-size: 14px; font-weight: 600;">รายละเอียด:</td>
                <td style="color: ${THEME.text}; line-height: 1.6; font-size: 15px; background-color: #f8fafc; padding: 12px; border-radius: 8px;">${data.description}</td>
              </tr>
            </table>

            ${
              data.hasImages
                ? `
              <div style="margin-top: 20px; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; background-color: #fffbeb;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">📸 มีรูปภาพประกอบแนบมาในระบบ</p>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.3);">
                ดูรูปภาพและรับเรื่องซ่อม
              </a>
              <p style="margin-top: 24px; color: ${THEME.muted}; font-size: 12px;">
                คลิกปุ่มด้านบนเพื่อตรวจสอบรูปภาพและดำเนินการต่อในระบบ RentFlow
              </p>
            </td>
          </tr>
        </table>
        `,
          ),
        ),
      };
    }
    case EmailType.MAINTENANCE_IN_PROGRESS: {
      return {
        subject: getSubject(
          `🛠️ รับเรื่องแจ้งซ่อมแล้ว: ${data.title} (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "รับเรื่องแจ้งซ่อม",
            `
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                    <tr>
                      <td align="center" bgcolor="${THEME.successBg}" style="width: 70px; height: 70px; border-radius: 35px; vertical-align: middle;">
                        <span style="font-size: 32px; line-height: 70px; display: block;">⚙️</span>
                      </td>
                    </tr>
                  </table>
                  <h2 style="color: ${THEME.primary}; margin: 16px 0 4px 0; font-size: 22px;">เจ้าหน้าที่รับเรื่องแล้ว</h2>
                  <p style="color: ${THEME.muted}; margin: 0;">หอพัก <strong>${data.dormName}</strong> กำลังดำเนินการแก้ไขให้ท่าน</p>
                </td>
              </tr>
            </table>

            <div style="background-color: #f8fafc; border: 1px solid ${THEME.border}; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 8px; color: ${THEME.muted}; font-size: 13px; font-weight: 700; text-transform: uppercase;">ข้อความจากเจ้าหน้าที่:</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.primary}; font-size: 16px; font-weight: 600; line-height: 1.6; font-style: italic;">
                    "${data.note}"
                  </td>
                </tr>
              </table>
            </div>

            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 10px rgba(15,23,42,0.2);">
                    ตรวจสอบสถานะปัจจุบัน
                  </a>
                </td>
              </tr>
            </table>
            `,
          ),
        ),
      };
    }
    case EmailType.MAINTENANCE_NEW_MESSAGE: {
      return {
        subject: getSubject(
          `💬 ข้อความใหม่: ${data.title} (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "ข้อความใหม่จากแจ้งซ่อม",
            `
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                    <tr>
                      <td align="center" bgcolor="${THEME.bg}" style="width: 70px; height: 70px; border-radius: 35px; vertical-align: middle;">
                        <span style="font-size: 32px; line-height: 70px; display: block;">💬</span>
                      </td>
                    </tr>
                  </table>
                  <h2 style="color: ${THEME.primary}; margin: 16px 0 4px 0; font-size: 22px;">${data.senderRoleLabel}ส่งข้อความถึงคุณ</h2>
                  <p style="color: ${THEME.muted}; margin: 0;">เกี่ยวกับรายการแจ้งซ่อม "<strong>${data.title}</strong>" ห้อง ${data.roomNumber} - หอพัก <strong>${data.dormName}</strong></p>
                </td>
              </tr>
            </table>

            <div style="background-color: #f8fafc; border: 1px solid ${THEME.border}; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 8px; color: ${THEME.muted}; font-size: 13px; font-weight: 700; text-transform: uppercase;">ข้อความจาก${data.senderName}:</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.primary}; font-size: 16px; font-weight: 600; line-height: 1.6; font-style: italic;">
                    "${data.message}"
                  </td>
                </tr>
              </table>
            </div>

            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 10px rgba(15,23,42,0.2);">
                    ดูข้อความและตอบกลับ
                  </a>
                </td>
              </tr>
            </table>
            `,
          ),
        ),
      };
    }
    case EmailType.MAINTENANCE_COMPLETED: {
      return {
        subject: getSubject(`✅ ซ่อมแซมเสร็จสิ้น: ${data.title}`),

        html: minifyHtml(
          wrapEmail(
            "ซ่อมแซมเสร็จสิ้น",
            `
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                    <tr>
                      <td align="center" bgcolor="${THEME.successBg}" style="width: 70px; height: 70px; border-radius: 35px; vertical-align: middle;">
                        <span style="font-size: 32px; line-height: 70px;">✅</span>
                      </td>
                    </tr>
                  </table>
                  <h2 style="color: ${THEME.success}; margin: 16px 0 4px 0;">ดำเนินการซ่อมเสร็จสิ้น</h2>
                  <p style="color: ${THEME.muted};">รายการแจ้งซ่อม "<strong>${data.title}</strong>" สำเร็จแล้ว</p>
                </td>
              </tr>
            </table>

            <div style="background-color: #ecfdf5; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase;">สรุปการซ่อม:</p>
              <div style="color: #065f46; font-size: 16px; font-weight: 600; line-height: 1.6;">
                "${data.note || "ดำเนินการแก้ไขเรียบร้อยแล้ว ขอบคุณที่แจ้งให้ทราบ"}"
              </div>
            </div>
            `,
          ),
        ),
      };
    }
    case EmailType.MAINTENANCE_CANCELLED: {
      return {
        subject: getSubject(`❌ ยกเลิกรายการแจ้งซ่อม: ${data.title}`),

        html: minifyHtml(
          wrapEmail(
            "ยกเลิกการแจ้งซ่อม",
            `
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                    <tr>
                      <td align="center" bgcolor="${THEME.dangerBg}" style="width: 70px; height: 70px; border-radius: 35px; vertical-align: middle;">
                        <span style="font-size: 32px; line-height: 70px;">🚫</span>
                      </td>
                    </tr>
                  </table>
                  <h2 style="color: ${THEME.danger}; margin: 16px 0 4px 0;">รายการแจ้งซ่อมถูกยกเลิก</h2>
                </td>
              </tr>
            </table>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #991b1b; font-weight: 700;">สาเหตุ / หมายเหตุ:</p>
              <div style="color: #991b1b; font-size: 16px; line-height: 1.6;">
                "${data.note}"
              </div>
            </div>
            `,
          ),
        ),
      };
    }
    case EmailType.ANNOUNCEMENT: {
      const typeConfig =
        data.type === "URGENT"
          ? {
              accentColor: "#b91c1c",
              label: "ประกาศด่วนที่สุด",
            }
          : data.type === "IMPORTANT"
            ? {
                accentColor: "#1e40af",
                label: "ประกาศสำคัญ",
              }
            : {
                accentColor: "#475569",
                label: "ประกาศทั่วไป",
              };

      return {
        subject: getSubject(
          data.type === "URGENT"
            ? `[ด่วนที่สุด] ${data.title} — ${data.dormName}`
            : data.type === "IMPORTANT"
              ? `[สำคัญ] ${data.title} — ${data.dormName}`
              : `[ประกาศ] ${data.title} — ${data.dormName}`,
        ),

        html: `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body, table, td, p, a, span {
      font-family: 'Sarabun', 'TH Sarabun New', Arial, sans-serif !important;
    }
    body { 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f5; 
      -webkit-font-smoothing: antialiased;
    }
    @media only screen and (max-width: 480px) {
      .container { width: 100% !important; padding: 0 !important; }
      .content-area { padding: 24px 20px !important; }
      .title-text { font-size: 20px !important; }
      .meta-text { display: block !important; margin-top: 4px !important; }
    }
  </style>
</head>
<body style="background-color: #f4f4f5; padding: 40px 0;">

<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
  <tr>
    <td align="center" style="padding: 0 16px;">
      <table class="container" width="100%" border="0" cellspacing="0" cellpadding="0"
             style="max-width: 600px; background-color: #ffffff; border-top: 4px solid ${typeConfig.accentColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">

        <tr>
          <td class="content-area" style="padding: 32px 40px 16px; border-bottom: 1px solid #e4e4e7;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="left" style="font-size: 14px; color: #52525b; font-weight: 600;">
                  ${data.dormName}
                </td>
                <td align="right" class="meta-text" style="font-size: 13px; color: #a1a1aa;">
                  ${data.date}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="content-area" style="padding: 24px 40px 16px;">
            <div style="display: inline-block; padding: 4px 12px; background-color: #f4f4f5; color: ${typeConfig.accentColor}; font-size: 12px; font-weight: 600; border-radius: 4px; margin-bottom: 16px; letter-spacing: 0.5px;">
              ${typeConfig.label}
            </div>
            <div class="title-text" style="font-size: 22px; font-weight: 700; color: #18181b; line-height: 1.4;">
              ${data.title}
            </div>
          </td>
        </tr>

        ${
          data.imageUrl
            ? `<tr>
                <td style="padding: 0 40px 16px;" class="content-area">
                  <img src="${data.imageUrl}"
                       alt="${data.title}"
                       width="100%"
                       style="display: block; max-height: 360px; object-fit: cover; border-radius: 4px; border: 1px solid #e4e4e7;" />
                </td>
               </tr>`
            : ""
        }

        <tr>
          <td class="content-area" style="padding: 0 40px 32px;">
            <p style="margin: 0; color: #3f3f46; font-size: 15px; line-height: 1.8; white-space: pre-line;">
              ${data.content}
            </p>
          </td>
        </tr>

        <tr>
          <td class="content-area" style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; line-height: 1.6;">
              หากท่านมีข้อสงสัยเกี่ยวกับการแจ้งเตือนนี้ กรุณาติดต่อ <strong>${data.dormName}</strong> โดยตรง
            </p>
            <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">
              &copy; 2026 RentFlow Management System
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`,
      };
    }
    case EmailType.BILL_DUE_REMINDER: {
      return {
        subject: getSubject(
          `⏰ แจ้งเตือน: บิลห้อง ${data.roomNumber} ครบกำหนดชำระพรุ่งนี้`,
        ),

        html: minifyHtml(
          wrapEmail(
            "แจ้งเตือนบิลใกล้ครบกำหนด",
            `
          <div style="background-color: ${THEME.warningBg}; border: 2px solid ${THEME.warning}; border-radius: 12px; padding: 16px 24px; margin-bottom: 24px; text-align: center;">
            <span style="font-size: 24px; vertical-align: middle; margin-right: 8px;">⏰</span>
            <span style="color: ${THEME.warning}; font-size: 18px; font-weight: 700; vertical-align: middle;">
              บิลของท่านใกล้ครบกำหนดชำระ
            </span>
          </div>

          <table width="100%" style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 20px; margin-bottom: 24px;">
            <tr>
              <td valign="top" class="col-left" style="width: 60%;">
                <h1 style="margin: 0; color: ${THEME.primary}; font-size: 24px; font-weight: 700;">
                  ${data.dormName}
                </h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: ${THEME.text};">
                  โทร: ${data.ownerPhone || "-"}
                </p>
              </td>
              <td valign="top" class="col-right" style="width: 40%; text-align: right;">
                <div style="font-size: 14px; color: ${THEME.muted};">
                  ห้อง: <span style="font-weight: 700; color: ${THEME.primary};">${data.roomNumber}</span><br>
                  ผู้เช่า: <span style="font-weight: 700; color: ${THEME.primary};">${data.tenantName}</span>
                </div>
              </td>
            </tr>
          </table>

          <table width="100%" style="margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px; background-color: ${THEME.bg}; border-radius: 8px;">
                <div style="font-size: 13px; color: ${THEME.muted}; margin-bottom: 4px;">
                  รอบบิลเดือน ${data.month}
                </div>
                <div style="font-size: 28px; font-weight: 800; color: ${THEME.primary};">
                  ${data.amount} บาท
                </div>
                <div style="font-size: 14px; color: ${THEME.danger}; font-weight: 700; margin-top: 8px;">
                  ครบกำหนดชำระ: ${data.dueDate}
                </div>
              </td>
            </tr>
          </table>

          <table width="100%">
            <tr>
              <td align="center">
                <a href="${data.link}" style="display: inline-block; background-color: ${THEME.primary}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 8px;">
                  ดูรายละเอียดบิล / ชำระเงิน
                </a>
              </td>
            </tr>
          </table>

          <p style="margin-top: 24px; font-size: 13px; color: ${THEME.muted}; text-align: center;">
            หากท่านชำระเงินเรียบร้อยแล้ว กรุณาละเว้นอีเมลฉบับนี้
          </p>
          `,
          ),
        ),
      };
    }
    default:
      throw new Error("Unknown Type");
  }
};

export const getResetPasswordOtpHtml = (otp: string) => {
  const title = "รีเซ็ตรหัสผ่าน";

  const content = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 24px auto;">
      <tr>
        <td width="56" height="56" align="center" valign="middle" style="background-color: #EFF6FF; border-radius: 50%;">
          <span style="font-size: 28px; line-height: 1;">🔑</span>
        </td>
      </tr>
    </table>

    <h1 style="color: ${THEME.text}; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; font-family: 'Sarabun', sans-serif; text-align: center;">
      ลืมรหัสผ่านใช่ไหม?
    </h1>

    <p style="color: ${THEME.secondary}; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; font-family: 'Sarabun', sans-serif; text-align: center;">
      เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ<br>
      กรอกรหัส OTP ด้านล่างในหน้าเว็บเพื่อตั้งรหัสผ่านใหม่
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="margin: 0 auto 32px auto;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="${THEME.dangerBg}" style="border: 1px solid ${THEME.border}; border-radius: 8px; padding: 20px 40px;">
                <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: ${THEME.text};">
                  ${otp}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${THEME.dangerBg}; border: 1px solid ${THEME.dangerBorder}; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" width="24" style="padding-right: 12px; font-size: 18px;">⚠️</td>
              <td>
                <p style="margin: 0; color: ${THEME.dangerText}; font-size: 14px; line-height: 1.5; font-family: 'Sarabun', sans-serif; text-align: left;">
                  <strong>ความปลอดภัย:</strong> รหัส OTP นี้จะหมดอายุใน <strong>5 นาที</strong><br>
                  หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return wrapEmail(
    title,
    minifyHtml(content),
    `รหัส OTP ของคุณคือ ${otp} หมดอายุใน 5 นาที`,
  );
};
