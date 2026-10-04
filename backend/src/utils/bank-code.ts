// id ธนาคารที่เจ้าของหอเลือกในตั้งค่าการชำระเงิน (THAI_BANKS ฝั่ง frontend) -> รหัส 3 หลักของ SlipOK
const SLIP_BANK_CODES: Record<string, string> = {
  bbl: "002",
  kbank: "004",
  ktb: "006",
  ttb: "011",
  scb: "014",
  cimb: "022",
  uob: "024",
  bay: "025",
  gsb: "030",
  ghb: "033",
  baac: "034",
  kkp: "069",
  lhb: "073",
};

export const getSlipBankCode = (
  bankId: string | null | undefined,
): string | null => {
  if (!bankId) return null;

  return SLIP_BANK_CODES[bankId.toLowerCase()] ?? null;
};
