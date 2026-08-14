import crypto from "crypto";

export function generateNumericOtp(length = 6) {
  const max = 10 ** length;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(length, "0");
}
