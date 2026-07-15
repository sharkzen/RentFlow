export const buildBulkQrHtmlTemplate = (
  qrDataList: {
    roomNumber: string;
    tenantName: string;
    dormName: string;
    dormAddress: string;
    dormPhone: string;
    qrCodeDataUrl: string;
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
        
        <!-- ส่วนหัว: ชื่อหอพัก (อยู่ด้านบนสุด) -->
        <div class="header">
          <div class="dorm-title">${data.dormName}</div>
          <div class="dorm-contact">${data.dormAddress}</div>
          <div class="dorm-contact">โทร: ${data.dormPhone || "-"}</div>
        </div>

        <!-- ส่วนกลาง: ข้อมูลห้องและ QR Code -->
        <div class="content">
          <div class="room-label">บัตรเข้าสู่ระบบห้องพัก</div>
          <div class="room-number">${data.roomNumber}</div>
          <div class="tenant-name">ผู้เช่า: ${data.tenantName}</div>

          <div class="qr-wrapper">
            <img src="${data.qrCodeDataUrl}" class="qr-image" alt="QR Code" />
          </div>
          <div class="scan-text">สแกนเพื่อเข้าสู่ระบบจัดการห้องพัก</div>
        </div>

        <!-- ส่วนท้าย: คำเตือน (Modern Alert UI) -->
        <div class="warning-box">
          <div class="warning-icon-wrapper">
            <!-- SVG Icon คำเตือน -->
            <svg xmlns="http://www.w3.org/2000/svg" class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="warning-content">
            <div class="warning-title">คำเตือนด้านความปลอดภัย</div>
            <ul class="warning-list">
              <li>QR Code นี้เปรียบเสมือน <strong>รหัสผ่านส่วนตัว</strong> ของห้องพักท่าน</li>
              <li>ห้ามถ่ายภาพ ส่งต่อ หรือเผยแพร่ให้บุคคลอื่นเด็ดขาด</li>
              <li>หากสงสัยว่า QR Code หลุดรอด กรุณาแจ้งเจ้าหน้าที่เพื่อออกใหม่ทันที</li>
            </ul>
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
          font-weight: 600;
          src: url('file:///${publicPath}/fonts/Sarabun-SemiBold.ttf') format('truetype');
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
          background-color: #ffffff;
          color: #0f172a;
          -webkit-print-color-adjust: exact;
        }

        .container {
          width: 210mm;
          height: 296mm; /* ขนาด A4 */
          padding: 25mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Header */
        .header {
          text-align: center;
          padding-bottom: 24px;
          border-bottom: 2px solid #f1f5f9;
        }
        .dorm-title { 
          font-size: 30px; 
          font-weight: 700; 
          color: #1e293b;
          margin-bottom: 6px;
        }
        .dorm-contact { 
          font-size: 15px; 
          color: #64748b; 
          line-height: 1.5;
        }

        /* Content (ตรงกลาง) */
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        }
        .room-label { 
          font-size: 18px; 
          color: #64748b; 
          font-weight: 600; 
          letter-spacing: 2px; 
        }
        .room-number { 
          font-size: 96px; 
          font-weight: 700; 
          color: #2563eb; /* สีน้ำเงินให้ดูโดดเด่น */
          line-height: 1;
          margin: 10px 0; 
        }
        .tenant-name { 
          font-size: 22px; 
          color: #334155; 
          font-weight: 600;
          margin-bottom: 40px;
          background-color: #f8fafc;
          padding: 8px 24px;
          border-radius: 99px;
        }

        /* QR Code */
        .qr-wrapper {
          background: #ffffff;
          padding: 20px;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); /* เงาบางๆ */
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }
        .qr-image { 
          width: 300px; 
          height: 300px; 
          display: block; 
        }
        .scan-text { 
          font-size: 18px; 
          font-weight: 700; 
          color: #475569; 
        }

        /* Warning Box (แถบเตือนด้านล่าง) */
        .warning-box {
          margin-top: auto; /* ดันลงไปชิดขอบล่างของหน้า */
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background-color: #fef2f2; /* พื้นหลังสีแดงอ่อน */
          border: 1px solid #fecaca; /* กรอบสีแดงอ่อน */
          border-left: 6px solid #ef4444; /* แถบสีแดงเข้มด้านซ้าย ให้ดูจริงจัง */
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          margin-left: auto;
          margin-right: auto;
        }
        .warning-icon-wrapper {
          flex-shrink: 0;
          padding-top: 2px;
        }
        .warning-icon {
          width: 28px;
          height: 28px;
          color: #ef4444; /* ไอคอนสีแดง */
        }
        .warning-content {
          flex: 1;
        }
        .warning-title {
          color: #991b1b;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .warning-list {
          color: #991b1b;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
          padding-left: 20px;
        }
        .warning-list li {
          margin-bottom: 4px;
        }
        .warning-list strong {
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `.trim();
};
