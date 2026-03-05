export function formatDateTH(date: string | Date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
