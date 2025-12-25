export const isValidPhone = (phone: string) => {
  return /^0\d{9}$/.test(phone);
};
