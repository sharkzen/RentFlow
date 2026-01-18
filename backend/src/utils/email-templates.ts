import { EmailType } from "@/queues/email.types";

const THEME = {
  primary: "#0f172a",
  text: "#334155",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f1f5f9",
  paper: "#ffffff",
  danger: "#dc2626",
};

const wrapEmail = (title: string, contentHtml: string) => {
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
    case EmailType.NEW_BILL:
      return {
        subject: `🧾 บิลค่าเช่าห้อง ${data.roomNumber} ประจำเดือน ${data.month}`,

        html: wrapEmail(
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
                      (มิเตอร์: ${data.details.water.prev} - ${data.details.water.curr})
                    </div>
                  </td>
                  <td align="center" style="padding: 15px 12px; border-bottom: 1px solid ${THEME.border}; font-weight: 600; color: ${THEME.text};">
                    ${data.details.water.used}
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
      };
    default:
      throw new Error("Unknown Type");
  }
};
