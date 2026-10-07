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

/** ข้อความที่ผู้ใช้/แอดมินพิมพ์เองต้อง escape ก่อนใส่ใน HTML อีเมล */
const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const minifyHtml = (html: string) => {
  return html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
};

const getCopyrightYear = () => new Date().getFullYear();

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
            © ${getCopyrightYear()} RentFlow
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
          `บิลค่าเช่าห้อง ${data.roomNumber} ประจำเดือน ${data.month}`,
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
                        Number(data.details.water.prev) === 0 &&
                        Number(data.details.water.curr) === 0
                          ? "(เหมาจ่าย)"
                          : `(มิเตอร์: ${data.details.water.prev} - ${data.details.water.curr})`
                      }
                    </div>
                  </td>
                  <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 600; color: ${THEME.text};">
                    ${
                      Number(data.details.water.prev) === 0 &&
                      Number(data.details.water.curr) === 0
                        ? "-"
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
      const statusText = isAuto
        ? "ชำระเงินสำเร็จ — ยืนยันอัตโนมัติ"
        : "รอตรวจสอบจากเจ้าหน้าที่";
      const noticeText = isAuto
        ? "การชำระเงินได้รับการยืนยันอัตโนมัติแล้ว ระบบได้บันทึกข้อมูลเรียบร้อย"
        : "กรุณารอการตรวจสอบจากเจ้าหน้าที่ภายใน 24 ชั่วโมง คุณจะได้รับการแจ้งเตือนเมื่อยืนยันแล้ว";
      const actionText = isAuto ? "ดูประวัติธุรกรรม" : "ตรวจสอบสลิป";
      const bankDisplayName = getBankName(data.bankName);

      return {
        subject: getSubject(
          `แจ้งชำระเงิน ${data.amount} บาท (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "ใบแจ้งชำระเงิน",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                ใบแจ้งชำระเงิน
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 1px;">
                ${statusText}
              </p>
            </div>

            <div style="border: 1px solid ${THEME.border}; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                หอพัก: ${data.dormName}
              </div>
              <table width="100%" style="border-spacing: 0;">
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px; width: 35%;">เลขที่ห้อง:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 700; padding-bottom: 12px;">${data.roomNumber}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px;">ผู้เช่า:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; padding-bottom: 12px;">${data.tenantName}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px;">ธนาคาร:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; padding-bottom: 12px;">${bankDisplayName}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; ${data.refNo ? "padding-bottom: 12px;" : ""}">วันที่/เวลาที่โอน:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; ${data.refNo ? "padding-bottom: 12px;" : ""}">${data.paidDate}</td>
                </tr>
                ${
                  data.refNo
                    ? `
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px;">หมายเลขอ้างอิง:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; font-family: 'Courier New', monospace;">#${data.refNo}</td>
                </tr>
                `
                    : ""
                }
              </table>

              <div style="border-top: 1px solid #f1f5f9; margin-top: 20px; padding-top: 20px;">
                <div style="color: ${THEME.muted}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  ยอดเงินที่ชำระ
                </div>
                <div style="color: ${THEME.primary}; font-size: 36px; font-weight: 800;">
                  ฿${Number(data.amount).toLocaleString("th-TH")}
                </div>
              </div>
            </div>

            <p style="color: ${THEME.secondary}; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
              ${noticeText}
            </p>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
                    ${actionText}
                  </a>
                </td>
              </tr>
            </table>
            `,
          ),
        ),
      };
    }
    case EmailType.REJECT_SLIP: {
      const actionText = "แนบสลิปใหม่";

      return {
        subject: getSubject(
          `แจ้งเตือน: สลิปไม่ถูกต้อง กรุณาแนบใหม่ (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "แจ้งเตือนสลิปไม่ถูกต้อง",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                แจ้งปฏิเสธการรับชำระเงิน
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 700; color: ${THEME.danger}; text-transform: uppercase; letter-spacing: 1px;">
                สลิปไม่ถูกต้อง
              </p>
            </div>

            <div style="border: 1px solid ${THEME.border}; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                หอพัก: ${data.dormName}
              </div>
              <table width="100%" style="border-spacing: 0;">
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px; width: 35%;">เลขที่ห้อง:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 700; padding-bottom: 12px;">${data.roomNumber}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px;">ผู้เช่า:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600;">${data.tenantName}</td>
                </tr>
              </table>

              <div style="border-top: 1px solid #f1f5f9; margin-top: 20px; padding-top: 20px;">
                <div style="color: ${THEME.muted}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  ยอดเงินบิลรอบ ${data.month}
                </div>
                <div style="color: ${THEME.primary}; font-size: 32px; font-weight: 800;">
                  ฿${data.amount}
                </div>
              </div>

              <div style="margin-top: 20px; background-color: ${THEME.dangerBg}; border: 1px solid ${THEME.dangerBorder}; padding: 16px;">
                <div style="font-size: 13px; font-weight: 700; color: ${THEME.dangerText}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  เหตุผลที่ปฏิเสธ
                </div>
                <div style="color: ${THEME.dangerText}; font-size: 15px; line-height: 1.5;">
                  ${data.reason || "สลิปยอดเงินไม่ตรง หรือรูปสลิปไม่ชัดเจน โปรดตรวจสอบและแนบสลิปเข้ามาใหม่"}
                </div>
              </div>
            </div>

            <p style="color: ${THEME.secondary}; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
              สถานะบิลของคุณถูกเปลี่ยนกลับเป็น "รอชำระ" แล้ว กรุณากดปุ่มด้านล่างเพื่อตรวจสอบบิลและทำการแนบสลิปโอนเงินเข้ามาใหม่อีกครั้ง
            </p>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.danger}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
                    ${actionText}
                  </a>
                </td>
              </tr>
            </table>

            <div style="text-align: center; color: ${THEME.muted}; font-size: 12px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
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
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                บัญชีของคุณได้รับการอนุมัติแล้ว
              </h1>
            </div>

            <div style="padding: 0 2px;">
              <p style="color: ${THEME.text}; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                เรียน คุณ <strong style="color: ${THEME.primary};">${data.ownerName}</strong>,
              </p>

              <p style="color: ${THEME.secondary}; font-size: 16px; line-height: 1.8; margin-bottom: 28px;">
                ข้อมูลและเอกสารของคุณได้ผ่านการตรวจสอบจากทีมงาน <strong>RentFlow</strong> เรียบร้อยแล้ว
                ขณะนี้บัญชีของคุณเปิดใช้งานอย่างสมบูรณ์ คุณสามารถเข้าสู่ระบบเพื่อเริ่มต้นบริหารจัดการหอพักได้ทันที
              </p>

              <div style="border: 1px solid ${THEME.border}; padding: 20px; margin-bottom: 32px;">
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
                    <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; padding-bottom: 12px;">เจ้าของหอพัก (Owner)</td>
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
                              padding: 12px 32px;
                              text-decoration: none;
                              border-radius: 4px;
                              font-weight: 700;
                              font-size: 15px;
                              display: inline-block;">
                      เข้าสู่ระบบ
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border: 1px solid ${THEME.border}; padding: 20px;">
                <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">
                  ขั้นตอนแนะนำสำหรับเริ่มต้นใช้งาน
                </div>
                <table width="100%" style="border-spacing: 0;">
                  <tr>
                    <td valign="top" style="padding-bottom: 8px; width: 20px; color: ${THEME.primary}; font-weight: 700;">1.</td>
                    <td style="color: ${THEME.text}; font-size: 14px; line-height: 1.5; padding-bottom: 8px;">ตั้งค่าข้อมูลพื้นฐานและช่องทางการรับชำระเงินของหอพัก</td>
                  </tr>
                  <tr>
                    <td valign="top" style="padding-bottom: 8px; width: 20px; color: ${THEME.primary}; font-weight: 700;">2.</td>
                    <td style="color: ${THEME.text}; font-size: 14px; line-height: 1.5; padding-bottom: 8px;">เพิ่มข้อมูลห้องพัก ราคา และค่าน้ำ/ค่าไฟ</td>
                  </tr>
                  <tr>
                    <td valign="top" style="width: 20px; color: ${THEME.primary}; font-weight: 700;">3.</td>
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
      return {
        subject: getSubject("แจ้งผลการตรวจสอบบัญชีผู้จัดการหอพัก | RentFlow"),

        html: minifyHtml(
          wrapEmail(
            "แจ้งผลการพิจารณา",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                แจ้งผลการตรวจสอบบัญชี
              </h1>
            </div>

            <div style="padding: 0 2px;">
              <p style="color: ${THEME.text}; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                เรียน คุณ <strong style="color: ${THEME.primary};">${data.ownerName}</strong>,
              </p>

              <p style="color: ${THEME.secondary}; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
                จากการตรวจสอบข้อมูลและเอกสารประกอบการสมัครบัญชีผู้จัดการหอพักของคุณ ทีมงาน RentFlow ขออภัยที่ต้องแจ้งให้ทราบว่า <strong>เราไม่สามารถอนุมัติบัญชีของคุณได้ในขณะนี้</strong> เนื่องจากพบข้อมูลบางส่วนไม่ถูกต้องหรือไม่สมบูรณ์
              </p>

              ${
                data.reason
                  ? `<div style="background-color: ${THEME.dangerBg}; border: 1px solid ${THEME.dangerBorder}; padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: 700; color: ${THEME.dangerText}; margin-bottom: 10px;">
                  เหตุผลจากทีมงาน:
                </div>
                <div style="color: ${THEME.dangerText}; font-size: 15px; line-height: 1.7;">
                  ${escapeHtml(String(data.reason)).replace(/\r?\n/g, "<br>")}
                </div>
              </div>`
                  : ""
              }

              <div style="background-color: ${THEME.dangerBg}; border: 1px solid ${THEME.dangerBorder}; padding: 20px; margin-bottom: 32px;">
                <div style="font-size: 14px; font-weight: 700; color: ${THEME.dangerText}; margin-bottom: 10px;">
                  สิ่งที่ควรตรวจสอบก่อนทำการสมัครใหม่:
                </div>
                <ul style="margin: 0; padding-left: 20px; color: ${THEME.dangerText}; font-size: 14px; line-height: 1.7;">
                  <li><strong>การปักหมุดที่ตั้งหอพัก:</strong> กรุณาตรวจสอบและปักหมุดตำแหน่งที่ตั้งหอพักในแผนที่ให้ตรงกับความจริง</li>
                  <li><strong>ข้อมูลและเอกสาร:</strong> ตรวจสอบข้อมูลให้ถูกต้องว่าเป็นข้อมูลจริงทั้งหมด</li>
                </ul>
              </div>

              <p style="color: ${THEME.text}; font-size: 15px; line-height: 1.6;">
                เพื่อความถูกต้องของระบบและแผนที่ ระบบได้ทำการยกเลิกข้อมูลการสมัครเดิมของคุณแล้ว <strong>คุณสามารถทำการสมัครและกรอกข้อมูลเข้ามาใหม่ได้ทันที</strong> ทางเราหวังเป็นอย่างยิ่งว่าจะได้ร่วมงานกับคุณ
              </p>
            </div>
            `,
          ),
        ),
      };
    }
    case EmailType.MAINTENANCE_CREATED: {
      return {
        subject: getSubject(
          `แจ้งซ่อมใหม่: ห้อง ${data.roomNumber} - ${data.title}`,
        ),

        html: minifyHtml(
          wrapEmail(
            "แจ้งซ่อมใหม่",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                มีการแจ้งซ่อมใหม่
              </h1>
              <p style="color: ${THEME.muted}; margin: 8px 0 0 0; font-size: 14px;">หอพัก: <strong style="color: ${THEME.text};">${data.dormName}</strong></p>
            </div>

            <div style="border: 1px solid ${THEME.border}; padding: 20px; margin-bottom: 28px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                รายละเอียดการแจ้งซ่อม
              </div>
              <table width="100%" style="border-spacing: 0;">
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px; width: 100px;">ห้องพัก:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 700; padding-bottom: 12px;">${data.roomNumber}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px;">ผู้แจ้ง:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; padding-bottom: 12px;">${data.tenantName}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px;">หัวข้อ:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; padding-bottom: 12px;">${data.title}</td>
                </tr>
                <tr>
                  <td valign="top" style="color: ${THEME.secondary}; font-size: 15px;">รายละเอียด:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; line-height: 1.6;">${data.description}</td>
                </tr>
              </table>
              ${
                data.hasImages
                  ? `<p style="margin: 16px 0 0 0; padding-top: 12px; border-top: 1px solid #f1f5f9; color: ${THEME.muted}; font-size: 13px;">มีรูปภาพประกอบแนบมาในระบบ</p>`
                  : ""
              }
            </div>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
                    ดูรูปภาพและรับเรื่องซ่อม
                  </a>
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
          `รับเรื่องแจ้งซ่อมแล้ว: ${data.title} (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "รับเรื่องแจ้งซ่อม",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                เจ้าหน้าที่รับเรื่องแล้ว
              </h1>
              <p style="color: ${THEME.muted}; margin: 8px 0 0 0; font-size: 14px;">หอพัก <strong style="color: ${THEME.text};">${data.dormName}</strong> กำลังดำเนินการแก้ไขให้ท่าน</p>
            </div>

            <div style="border: 1px solid ${THEME.border}; padding: 20px; margin-bottom: 28px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                ข้อความจากเจ้าหน้าที่
              </div>
              <p style="color: ${THEME.text}; font-size: 15px; line-height: 1.6; margin: 0;">${data.note}</p>
            </div>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
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
          `ข้อความใหม่: ${data.title} (ห้อง ${data.roomNumber})`,
        ),

        html: minifyHtml(
          wrapEmail(
            "ข้อความใหม่จากแจ้งซ่อม",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                ${data.senderRoleLabel}ส่งข้อความถึงคุณ
              </h1>
              <p style="color: ${THEME.muted}; margin: 8px 0 0 0; font-size: 14px;">เกี่ยวกับรายการแจ้งซ่อม "<strong style="color: ${THEME.text};">${data.title}</strong>" ห้อง ${data.roomNumber} - หอพัก <strong style="color: ${THEME.text};">${data.dormName}</strong></p>
            </div>

            <div style="border: 1px solid ${THEME.border}; padding: 20px; margin-bottom: 28px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                ข้อความจาก${data.senderName}
              </div>
              <p style="color: ${THEME.text}; font-size: 15px; line-height: 1.6; margin: 0;">${data.message}</p>
            </div>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
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
        subject: getSubject(`ซ่อมแซมเสร็จสิ้น: ${data.title}`),

        html: minifyHtml(
          wrapEmail(
            "ซ่อมแซมเสร็จสิ้น",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                ดำเนินการซ่อมเสร็จสิ้น
              </h1>
              <p style="color: ${THEME.muted}; margin: 8px 0 0 0; font-size: 14px;">รายการแจ้งซ่อม "<strong style="color: ${THEME.text};">${data.title}</strong>" สำเร็จแล้ว</p>
            </div>

            <div style="border: 1px solid ${THEME.border}; padding: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                สรุปการซ่อม
              </div>
              <p style="color: ${THEME.text}; font-size: 15px; line-height: 1.6; margin: 0;">
                ${data.note || "ดำเนินการแก้ไขเรียบร้อยแล้ว ขอบคุณที่แจ้งให้ทราบ"}
              </p>
            </div>
            `,
          ),
        ),
      };
    }
    case EmailType.MAINTENANCE_CANCELLED: {
      return {
        subject: getSubject(`ยกเลิกรายการแจ้งซ่อม: ${data.title}`),

        html: minifyHtml(
          wrapEmail(
            "ยกเลิกการแจ้งซ่อม",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                รายการแจ้งซ่อมถูกยกเลิก
              </h1>
              <p style="color: ${THEME.muted}; margin: 8px 0 0 0; font-size: 14px;">รายการแจ้งซ่อม "<strong style="color: ${THEME.text};">${data.title}</strong>"</p>
            </div>

            <div style="background-color: ${THEME.dangerBg}; border: 1px solid ${THEME.dangerBorder}; padding: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.dangerText}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                สาเหตุ / หมายเหตุ
              </div>
              <p style="color: ${THEME.dangerText}; font-size: 15px; line-height: 1.6; margin: 0;">${data.note}</p>
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
              &copy; ${getCopyrightYear()} RentFlow
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
      const lateFeeText =
        Number(data.lateFeeRate) > 0
          ? `หากชำระล่าช้าเกินกำหนด มีค่าปรับวันละ ฿${Number(data.lateFeeRate).toLocaleString("th-TH")}`
          : "ไม่มีค่าปรับในบิลนี้";

      return {
        subject: getSubject(
          `แจ้งเตือน: บิลห้อง ${data.roomNumber} ครบกำหนดชำระพรุ่งนี้`,
        ),

        html: minifyHtml(
          wrapEmail(
            "แจ้งเตือนบิลใกล้ครบกำหนด",
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                แจ้งเตือนบิลใกล้ครบกำหนด
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 700; color: ${THEME.warning}; text-transform: uppercase; letter-spacing: 1px;">
                บิลของท่านครบกำหนดชำระเร็ว ๆ นี้
              </p>
            </div>

            <div style="border: 1px solid ${THEME.border}; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 13px; font-weight: 700; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                หอพัก: ${data.dormName}
              </div>
              <table width="100%" style="border-spacing: 0;">
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px; width: 35%;">โทร:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600; padding-bottom: 12px;">${data.ownerPhone || "-"}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px; padding-bottom: 12px;">เลขที่ห้อง:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 700; padding-bottom: 12px;">${data.roomNumber}</td>
                </tr>
                <tr>
                  <td style="color: ${THEME.secondary}; font-size: 15px;">ผู้เช่า:</td>
                  <td style="color: ${THEME.text}; font-size: 15px; font-weight: 600;">${data.tenantName}</td>
                </tr>
              </table>

              <div style="border-top: 1px solid #f1f5f9; margin-top: 20px; padding-top: 20px;">
                <div style="color: ${THEME.muted}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  รอบบิลเดือน ${data.month}
                </div>
                <div style="color: ${THEME.primary}; font-size: 36px; font-weight: 800; margin-bottom: 8px;">
                  ${data.amount} บาท
                </div>
                <div style="color: ${THEME.danger}; font-size: 14px; font-weight: 700; margin-bottom: 8px;">
                  ครบกำหนดชำระ: ${data.dueDate}
                </div>
                <div style="color: ${THEME.muted}; font-size: 13px;">
                  ${lateFeeText}
                </div>
              </div>
            </div>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
                    ดูรายละเอียดบิล / ชำระเงิน
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin-top: 24px; margin-bottom: 0; font-size: 13px; color: ${THEME.muted}; text-align: center;">
              หากท่านชำระเงินเรียบร้อยแล้ว กรุณาละเว้นอีเมลฉบับนี้
            </p>
            `,
          ),
        ),
      };
    }
    case EmailType.SUBSCRIPTION_EXPIRING:
    case EmailType.SUBSCRIPTION_EXPIRED: {
      const expired = type === EmailType.SUBSCRIPTION_EXPIRED;

      const headline = expired
        ? "แพ็คเกจของท่านหมดอายุแล้ว"
        : `แพ็คเกจของท่านจะหมดอายุในอีก ${data.daysLeft} วัน`;

      const detail = expired
        ? `ท่านยังเข้าดูข้อมูลได้ตามปกติจนถึง ${data.graceEndsAt} แต่จะเพิ่มหอพัก ห้องพัก หรือออกบิลใหม่ไม่ได้จนกว่าจะต่ออายุ ข้อมูลของท่านจะไม่ถูกลบ`
        : `แพ็คเกจ ${data.planName} จะหมดอายุวันที่ ${data.endDate} ต่ออายุก่อนหมดเพื่อให้ใช้งานต่อเนื่อง`;

      return {
        subject: getSubject(
          expired
            ? "แพ็คเกจ RentFlow ของท่านหมดอายุแล้ว"
            : `แพ็คเกจ RentFlow จะหมดอายุในอีก ${data.daysLeft} วัน`,
        ),

        html: minifyHtml(
          wrapEmail(
            headline,
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                ${headline}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 700; color: ${expired ? THEME.danger : THEME.warning}; letter-spacing: 1px;">
                ${data.ownerName ? `เรียน ${data.ownerName}` : "เรียนเจ้าของหอพัก"}
              </p>
            </div>

            <p style="color: ${THEME.text}; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
              ${detail}
            </p>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
                    ต่ออายุแพ็คเกจ
                  </a>
                </td>
              </tr>
            </table>
            `,
          ),
        ),
      };
    }
    case EmailType.SUBSCRIPTION_CHANGED: {
      // ผู้ดูแลระบบปรับแพ็คเกจ/วันหมดอายุ/คืนเงินให้ แจ้งเจ้าของหอให้ทราบเสมอ
      return {
        subject: getSubject(data.headline),

        html: minifyHtml(
          wrapEmail(
            data.headline,
            `
            <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
              <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
                ${data.headline}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 700; color: ${THEME.warning}; letter-spacing: 1px;">
                ${data.ownerName ? `เรียน ${data.ownerName}` : "เรียนเจ้าของหอพัก"}
              </p>
            </div>

            <p style="color: ${THEME.text}; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
              ${data.detail}
            </p>

            <table width="100%">
              <tr>
                <td align="center">
                  <a href="${data.link}" style="background-color: ${THEME.primary}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 15px; display: inline-block;">
                    ดูแพ็คเกจของฉัน
                  </a>
                </td>
              </tr>
            </table>
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
    <div style="border-bottom: 2px solid ${THEME.primary}; padding-bottom: 16px; margin-bottom: 28px;">
      <h1 style="color: ${THEME.primary}; margin: 0; font-size: 24px; font-weight: 800;">
        คำขอรีเซ็ตรหัสผ่าน
      </h1>
    </div>

    <div style="padding: 0 2px;">
      <p style="color: ${THEME.secondary}; font-size: 16px; line-height: 1.8; margin: 0 0 28px 0;">
        เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ
        กรอกรหัส OTP ด้านล่างในหน้าเว็บเพื่อตั้งรหัสผ่านใหม่
      </p>

      <div style="border: 1px solid ${THEME.border}; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: ${THEME.text};">
          ${otp}
        </span>
      </div>

      <div style="background-color: ${THEME.dangerBg}; border: 1px solid ${THEME.dangerBorder}; padding: 16px;">
        <p style="margin: 0; color: ${THEME.dangerText}; font-size: 14px; line-height: 1.5;">
          <strong>ความปลอดภัย:</strong> รหัส OTP นี้จะหมดอายุใน <strong>5 นาที</strong><br>
          หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
        </p>
      </div>
    </div>
  `;

  return wrapEmail(
    title,
    minifyHtml(content),
    `รหัส OTP ของคุณคือ ${otp} หมดอายุใน 5 นาที`,
  );
};
