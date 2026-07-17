import crypto from "crypto";
import logger from "./logger";
import { env } from "@/config/env";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SECRET_KEY = env.ENCRYPTION_KEY;

if (Buffer.from(SECRET_KEY, "hex").length !== 32) {
  throw new Error(
    "FATAL ERROR: ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).",
  );
}

export function encrypt(text?: string | null): string | null {
  if (!text) return null;

  try {
    const key = Buffer.from(SECRET_KEY, "hex");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    logger.error(`Encryption failed: ${error}`);
    throw new Error("Encryption process failed");
  }
}

export function decrypt(encryptedText?: string | null): string | null {
  if (!encryptedText) return null;

  try {
    const key = Buffer.from(SECRET_KEY, "hex");
    const parts = encryptedText.split(":");

    if (parts.length !== 3) return encryptedText;

    const [ivHex, authTagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(dataHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    logger.error("Decryption failed. Data might be tampered or key is wrong.");
    return null;
  }
}
