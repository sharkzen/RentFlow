import fs from "fs";
import path from "path";

const fontDataUriCache = new Map<string, string>();

const getFontDataUri = (publicPath: string, fileName: string): string => {
  const cacheKey = `${publicPath}/${fileName}`;

  if (fontDataUriCache.has(cacheKey)) {
    return fontDataUriCache.get(cacheKey)!;
  }

  const base64 = fs.readFileSync(
    path.join(publicPath, "fonts", fileName),
    "base64",
  );

  const dataUri = `data:font/ttf;base64,${base64}`;

  fontDataUriCache.set(cacheKey, dataUri);

  return dataUri;
};

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

        <!-- Header: ชื่อหอพัก -->
        <div class="header">
          <div class="dorm-title">${data.dormName}</div>
          <div class="dorm-meta">
            <span>${data.dormAddress}</span>
            ${data.dormPhone ? `<span class="dot">•</span><span>โทร ${data.dormPhone}</span>` : ""}
          </div>
        </div>

        <!-- Card หลัก -->
        <div class="card">

          <div class="card-top">
            <div class="room-label">ห้องพัก</div>
            <div class="room-number">${data.roomNumber}</div>
            <div class="tenant-pill">${data.tenantName}</div>
          </div>

          <div class="qr-section">
            <div class="qr-wrapper">
              <img src="${data.qrCodeDataUrl}" class="qr-image" alt="QR Code" />
            </div>
            <div class="scan-text">
              <svg xmlns="http://www.w3.org/2000/svg" class="scan-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                <path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 21h3"></path>
              </svg>
              สแกนเพื่อเข้าสู่ระบบ
            </div>
          </div>

        </div>

        <!-- Notice: คำเตือนความปลอดภัย -->
        <div class="notice">
          <div class="notice-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" class="notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div class="notice-content">
            <div class="notice-title">โปรดเก็บ QR Code นี้เป็นความลับ</div>
            <div class="notice-text">
              QR Code นี้เทียบเท่ารหัสผ่านส่วนตัวของท่าน ห้ามถ่ายภาพหรือส่งต่อให้ผู้อื่น
              หากสงสัยว่าหลุดรอด กรุณาแจ้งเจ้าหน้าที่เพื่อขอออกใหม่ทันที
            </div>
          </div>
        </div>

        <div class="footer">
          ออกเอกสารโดยระบบจัดการหอพัก · ${data.dormName}
        </div>

      </div>
    `;
    })
    .join("");

  const regularFont = getFontDataUri(publicPath, "IBMPlexSansThai-Regular.ttf");
  const mediumFont = getFontDataUri(publicPath, "IBMPlexSansThai-Medium.ttf");
  const semiBoldFont = getFontDataUri(publicPath, "IBMPlexSansThai-SemiBold.ttf");
  const boldFont = getFontDataUri(publicPath, "IBMPlexSansThai-Bold.ttf");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @font-face {
          font-family: 'IBM Plex Sans Thai';
          font-style: normal;
          font-weight: 400;
          src: url('${regularFont}') format('truetype');
        }
        @font-face {
          font-family: 'IBM Plex Sans Thai';
          font-style: normal;
          font-weight: 500;
          src: url('${mediumFont}') format('truetype');
        }
        @font-face {
          font-family: 'IBM Plex Sans Thai';
          font-style: normal;
          font-weight: 600;
          src: url('${semiBoldFont}') format('truetype');
        }
        @font-face {
          font-family: 'IBM Plex Sans Thai';
          font-style: normal;
          font-weight: 700;
          src: url('${boldFont}') format('truetype');
        }

        * { box-sizing: border-box; }

        body {
          font-family: 'IBM Plex Sans Thai', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          color: #0f172a;
          -webkit-print-color-adjust: exact;
        }

        .container {
          width: 210mm;
          height: 296mm;
          padding: 20mm 22mm;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Header */
        .header {
          text-align: center;
          padding-bottom: 18px;
        }
        .dorm-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.2px;
        }
        .dorm-meta {
          margin-top: 4px;
          font-size: 13px;
          color: #94a3b8;
        }
        .dorm-meta .dot {
          margin: 0 8px;
        }

        /* Main card */
        .card {
          flex: 1;
          margin-top: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 45%);
        }

        .card-top {
          text-align: center;
          margin-bottom: 32px;
        }
        .room-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .room-number {
          font-size: 104px;
          font-weight: 700;
          color: #1d4ed8;
          line-height: 1;
          margin: 8px 0 16px;
          letter-spacing: -2px;
        }
        .tenant-pill {
          display: inline-block;
          font-size: 16px;
          color: #334155;
          font-weight: 600;
          background-color: #eef2ff;
          padding: 8px 22px;
          border-radius: 99px;
        }

        /* QR section */
        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-wrapper {
          background: #ffffff;
          padding: 18px;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }
        .qr-image {
          width: 260px;
          height: 260px;
          display: block;
          border-radius: 4px;
        }
        .scan-text {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 600;
          color: #475569;
        }
        .scan-icon {
          width: 16px;
          height: 16px;
          color: #64748b;
        }

        /* Notice */
        .notice {
          margin-top: 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 18px 20px;
        }
        .notice-icon-wrapper {
          flex-shrink: 0;
          padding-top: 2px;
        }
        .notice-icon {
          width: 22px;
          height: 22px;
          color: #b45309;
        }
        .notice-content {
          flex: 1;
        }
        .notice-title {
          color: #92400e;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 3px;
        }
        .notice-text {
          color: #92400e;
          font-size: 13px;
          line-height: 1.6;
        }

        /* Footer */
        .footer {
          margin-top: 14px;
          text-align: center;
          font-size: 11px;
          color: #cbd5e1;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `.trim();
};
