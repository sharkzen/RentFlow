export const buildBulkQrHtmlTemplate = (
  qrDataList: {
    roomNumber: string;
    tenantName: string;
    dormName: string;
    dormAddress: string;
    dormPhone: string;
    qrCodeDataUrl: string; // Base64 รูป QR Code
  }[],
  publicPath: string,
): string => {
  const pagesHtml = qrDataList
    .map((data, index) => {
      const pageBreak =
        index > 0 ? '<div style="page-break-before: always;"></div>' : "";

      return `
      ${pageBreak}
      <div class="container">
        <!-- ส่วนหัว (ข้อมูลหอพัก) -->
        <div class="header">
          <div class="dorm-title">${data.dormName}</div>
          <div class="dorm-address">${data.dormAddress}</div>
          <div class="dorm-phone">โทร: ${data.dormPhone || "-"}</div>
        </div>

        <!-- ส่วนเนื้อหาตรงกลาง (QR Code) -->
        <div class="content-wrapper">
          <div class="title-section">
            <div class="room-label">บัตรเข้าสู่ระบบห้องพัก</div>
            <div class="room-number">${data.roomNumber}</div>
            <div class="tenant-name">ผู้เช่า: ${data.tenantName}</div>
          </div>

          <div class="qr-container">
            <img src="${data.qrCodeDataUrl}" class="qr-image" alt="QR Code" />
            <div class="scan-text">สแกนเพื่อเข้าสู่ระบบผู้เช่า</div>
          </div>

          <!-- คำเตือน (สำคัญ) -->
          <div class="warning-box">
            <div class="warning-title">⚠️ คำเตือนด้านความปลอดภัย</div>
            <ul class="warning-list">
              <li>QR Code นี้เปรียบเสมือนรหัสผ่านส่วนตัวของห้องพักท่าน</li>
              <li>ห้ามถ่ายรูป ส่งต่อ หรือเผยแพร่ให้บุคคลอื่นเด็ดขาด</li>
              <li>หากสงสัยว่า QR Code หลุดรอด กรุณาแจ้งเจ้าหน้าที่เพื่อออกใหม่ทันที</li>
            </ul>
          </div>
        </div>

        <!-- ส่วนท้าย -->
        <div class="footer">
          <div>เอกสารสร้างเมื่อ: ${new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "short" }).format(new Date())} น.</div>
          <div style="font-weight: bold; color: #0f172a;">RentFlow System</div>
        </div>
      </div>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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
          padding: 20mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 40px;
        }
        .dorm-title { font-size: 28px; font-weight: 700; color: #0f172a; }
        .dorm-address { font-size: 14px; color: #475569; margin-top: 8px; }
        .dorm-phone { font-size: 14px; font-weight: 700; color: #334155; margin-top: 4px; }
        
        .content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
        }
        .title-section { text-align: center; margin-bottom: 40px; }
        .room-label { font-size: 20px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
        .room-number { font-size: 72px; font-weight: 700; color: #4f46e5; line-height: 1.2; margin: 10px 0; }
        .tenant-name { font-size: 24px; color: #334155; font-weight: 700; }
        
        .qr-container {
          background: white;
          padding: 24px;
          border-radius: 24px;
          border: 3px dashed #cbd5e1;
          text-align: center;
          margin-bottom: 40px;
        }
        .qr-image { width: 300px; height: 300px; display: block; margin: 0 auto; }
        .scan-text { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 16px; }

        .warning-box {
          background-color: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
        }
        .warning-title { color: #dc2626; font-size: 20px; font-weight: 700; margin-bottom: 12px; text-align: center; }
        .warning-list { color: #991b1b; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 24px; }
        .warning-list li { margin-bottom: 8px; }

        .footer {
          margin-top: auto;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `.trim();
};
