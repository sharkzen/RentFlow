interface ExtractedSlipData {
  refNo: string | null;
  amount: number | null;
  bankName: string | null;
}

const BANK_NAMES = [
  {
    keywords: ["kbank", "กสิกร", "กสกร", "kasikorn"],
    name: "กสิกรไทย (KBank)",
  },
  {
    keywords: ["ktb", "krungthai", "กรุงไทย", "โรงไทย", "กรงไทย"],
    name: "กรุงไทย (KTB)",
  },
  {
    keywords: ["scb", "ไทยพาณิชย์", "easy", "siam commercial"],
    name: "ไทยพาณิชย์ (SCB)",
  },
  {
    keywords: ["bbl", "bangkok", "กรุงเทพ", "bualuang"],
    name: "กรุงเทพ (BBL)",
  },
  {
    keywords: ["gsb", "ออมสิน", "mymo", "ออมสน"],
    name: "ออมสิน (GSB)",
  },
  {
    keywords: ["ttb", "tmbr", "ทหารไทย", "ธนชาต", "tmb"],
    name: "ทีทีบี (TTB)",
  },
  {
    keywords: ["bay", "krungsri", "กรุงศรี", "ayudhya"],
    name: "กรุงศรี (BAY)",
  },
  {
    keywords: ["baac", "ธ.ก.ส", "ธกส", "baac"],
    name: "ธ.ก.ส. (BAAC)",
  },
  {
    keywords: ["uob", "ยูโอบี"],
    name: "ยูโอบี (UOB)",
  },
  {
    keywords: ["kkp", "kiatnakin", "เกียรตินาคิน"],
    name: "เกียรตินาคินภัทร (KKP)",
  },
  {
    keywords: ["cimb", "ซีไอเอ็มบี"],
    name: "ซีไอเอ็มบี ไทย (CIMBT)",
  },
];

export const validateSlipContent = (text: string): boolean => {
  const lowerText = text.toLowerCase().replace(/\s+/g, "");

  const negativeKeywords = [
    "thaiqrpayment",
    "scanpayment",
    "scantopay",
    "promptpay",
    "สแกนจ่าย",
    "สร้างqr",
    "myqr",
    "qrcode",
    "request",
    "payment",
  ];

  const successKeywords = [
    "สำเร็จ",
    "success",
    "sucess",
    "completed",
    "successful",
    "ชำระเงินแล้ว",
    "paid",
    "โอนเงินสำเร็จ",
    "ทำรายการสำเร็จ",
    "slip",
    "receipt",
    "transaction",
  ];

  const isQrImage = negativeKeywords.some((kw) => lowerText.includes(kw));
  const hasSuccess = successKeywords.some((kw) => lowerText.includes(kw));

  if (isQrImage && !hasSuccess) return false;

  const generalKeywords = [
    "รหัสอ้างอิง",
    "เลขที่รายการ",
    "รหัสรายการ",
    "ref",
    "จำนวน",
    "amount",
    "บาท",
    "baht",
    "ค่าธรรมเนียม",
    "fee",
    "จาก",
    "ไปยัง",
    "วัน",
    "เวลา",
    ...BANK_NAMES.flatMap((b) => b.keywords),
  ];

  let score = 0;

  if (hasSuccess) score += 5;

  generalKeywords.forEach((kw) => {
    if (lowerText.includes(kw)) score += 1;
  });

  return score >= 3;
};

export const extractSlipData = (text: string): ExtractedSlipData => {
  let cleanText = text.replace(/,/g, "").trim();
  let refNo: string | null = null;
  const refKeywordRegex =
    /(?:รหัสอ้างอิง|เลขที่รายการ|รหัสรายการ|เลขที่ทำรายการ|Ref\.?(?:No|erence)?\.?|Transaction ID|Trans ID)\s*[:.\-]?\s*([A-Za-z0-9]{10,35})/i;
  const refMatch = cleanText.match(refKeywordRegex);

  if (refMatch) {
    refNo = refMatch[1];
  } else {
    const fallbackRegex = /\b([A-Za-z0-9]{10,35})\b/g;
    const candidates = cleanText.match(fallbackRegex) || [];

    const validRefs = candidates.filter((r) => {
      const isCommonWord =
        /^(promptpay|amount|success|transfer|baht|total|transaction|kasikorn|krungthai|bangkok|service|charge)$/i.test(
          r,
        );
      const hasDigit = /[0-9]/.test(r);
      const isLengthValid = r.length >= 10;
      return !isCommonWord && hasDigit && isLengthValid;
    });

    if (validRefs.length > 0) {
      refNo = validRefs.sort((a, b) => b.length - a.length)[0];
    }
  }

  const amountRegex = /(\d+)\s?[\.,]\s?(\d{2})\b/g;
  const amountsFound: number[] = [];
  let match;

  while ((match = amountRegex.exec(cleanText)) !== null) {
    const valStr = `${match[1]}.${match[2]}`;
    const val = parseFloat(valStr);

    if (!isNaN(val) && val > 0 && val < 1000000) {
      if (val >= 2500 && val <= 2600 && Number.isInteger(val)) continue;

      if (val >= 2020 && val <= 2030 && Number.isInteger(val)) continue;

      amountsFound.push(val);
    }
  }

  const amount = amountsFound.length > 0 ? Math.max(...amountsFound) : null;
  const lowerText = text.toLowerCase();
  const foundBank = BANK_NAMES.find((b) =>
    b.keywords.some((k) => lowerText.includes(k)),
  );

  return {
    refNo,
    amount,
    bankName: foundBank ? foundBank.name : null,
  };
};
