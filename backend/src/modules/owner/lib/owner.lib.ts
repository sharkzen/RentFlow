export const buildBulkBillHtmlTemplate = (
  billsData: {
    bill: any;
    finalDaysLate: number;
  }[],
  formatMoney: (amount: number) => string,
  formatThaiDate: (
    date: Date | string,
    options: Intl.DateTimeFormatOptions,
  ) => string,
  stamps: {
    paid: string;
    cancel: string;
  },
  publicPath: string,
): string => {
  const { paid: paidStamp, cancel: cancelStamp } = stamps;

  const pagesHtml = billsData
    .map(({ bill, finalDaysLate }, index) => {
      const items = bill.items || [];
      const chargeItems = items.filter((item: any) => item.type === "CHARGE");
      const discountItems = items.filter(
        (item: any) => item.type === "DISCOUNT",
      );

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

      const pageBreak =
        index > 0 ? '<div style="page-break-before: always;"></div>' : "";

      return `
      ${pageBreak}
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>${bill.room.dormitory.name}</h1>
            <p>${bill.room.dormitory.address}<br>โทร: ${bill.room.dormitory.contacts?.[0]?.phone || "-"}</p>
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
            <div class="info-text" style="color:#334155;">รอบบิลเดือน: <span class="font-bold">${formatThaiDate(
              bill.billingMonth,
              {
                month: "long",
              },
            )}</span></div>
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
                  <div class="font-bold">ค่าน้ำประปา${bill.waterBillingTypeSnapshot === "FLAT_RATE" ? " (เหมาจ่าย)" : ""}</div>
                  ${bill.waterBillingTypeSnapshot === "FLAT_RATE" ? "" : `<div class="unit-detail">(มิเตอร์: ${bill.prevWaterUnitSnapshot} - ${bill.currentWaterUnitSnapshot})</div>`}
                </td>
                <td class="text-center">${bill.waterBillingTypeSnapshot === "FLAT_RATE" ? "-" : bill.waterUsedSnapshot}</td>
                <td class="text-right">${bill.waterBillingTypeSnapshot === "FLAT_RATE" ? "-" : formatMoney(bill.waterRateSnapshot)}</td>
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
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* (ใส่ CSS เดิมทั้งหมดลงมาในนี้ ไม่ต้องแก้) */
        @font-face {
          font-family: 'Sarabun';
          font-style: normal;
          font-weight: 400;
          src: url('file:///${publicPath}/fonts/Sarabun-Regular.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Sarabun';
          font-style: normal;
          font-weight: 700;
          src: url('file:///${publicPath}/fonts/Sarabun-Bold.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Sarabun';
          font-style: normal;
          font-weight: 800;
          src: url('file:///${publicPath}/fonts/Sarabun-ExtraBold.ttf') format('truetype');
        }
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
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding: 20px 0; }
        .header-left h1 { font-size: 24px; margin: 0; color: #0f172a; line-height: 1.2; }
        .header-left p { font-size: 14px; color: #475569; margin: 8px 0 0; line-height: 1.5; }
        .header-right { text-align: right; }
        .title { font-size: 24px; font-weight: 800; margin: 0; color: #0f172a; }
        .subtitle { font-size: 18px; font-weight: 700; color: #334155; text-transform: uppercase; }
        .info-text { font-size: 14px; color: #64748b; margin-top: 12px; }
        .info-val { font-weight: 700; color: #0f172a; }
        .tenant-section { display: flex; justify-content: space-between; margin-top: 32px; gap: 48px; }
        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
        .tenant-name { font-size: 20px; font-weight: 700; }
        .room-label { font-size: 14px; color: #475569; margin-top: 8px; }
        .room-val { font-size: 18px; font-weight: 700; color: #0f172a; }
        .table-container { flex: 1; margin-top: 32px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { background-color: #f1f5f9; padding: 16px 12px; text-align: left; font-weight: 700; border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a; }
        td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .unit-detail { font-size: 12px; color: #64748b; margin-top: 4px; }
        .footer { margin-top: 24px; border-top: 2px solid #0f172a; padding-top: 16px; }
        .total-row { display: flex; justify-content: flex-end; align-items: center; gap: 48px; margin-top: 16px; }
        .total-label { font-size: 18px; font-weight: 500; color: #475569; }
        .total-amount { font-size: 36px; font-weight: 900; color: #0f172a; }
        .signature-section { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #f1f5f9; padding-top: 40px; }
        .note { width: 60%; font-size: 14px; color: #64748b; line-height: 1.6; }
        .note-title { font-weight: 700; color: #334155; font-style: italic; }
        .signature-box { text-align: center; position: relative; width: 200px; }
        .sig-line { border-bottom: 1px dotted #94a3b8; height: 64px; margin-bottom: 8px; }
        .sig-text { font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; }
        .sig-sub { font-size: 10px; color: #94a3b8; }
        .stamp { position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%); z-index: 10; pointer-events: none; }
        .stamp-paid { width: 100px; opacity: 0.8; }
        .stamp-cancel { width: 200px; transform: translate(-50%, -50%) rotate(-13deg); opacity: 0.8; }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `.trim();
};
