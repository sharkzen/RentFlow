export function getDueMonthText(offset: number) {
  if (offset === 0) return "ชำระภายในเดือนที่ออกบิล";
  if (offset === 1) return "ชำระได้ถึงเดือนถัดไป";
  return `ชำระได้ภายใน ${offset} เดือน`;
}
