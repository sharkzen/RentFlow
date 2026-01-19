export const formatMoney = (amount: number) =>
  amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export const formatLongDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

export const formatThaiDateTime = (date: Date | string) => {
  const d = new Date(date);

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export const matchAccount = (
  target: string | null | undefined,
  slip: string | null | undefined,
): boolean => {
  if (!target || !slip) return false;

  const cleanTarget = target.replace(/[^0-9]/g, "");
  const cleanSlip = slip.replace(/[^0-9]/g, "");

  if (!cleanTarget || !cleanSlip) return false;

  if (cleanSlip.length >= 10) {
    return cleanTarget === cleanSlip;
  }

  if (cleanSlip.length >= 3) {
    return cleanTarget.endsWith(cleanSlip);
  }

  return false;
};
