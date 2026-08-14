import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
const RESET_SECRET = env.RESET_SECRET;

type AccessTokenPayload = {
  sub: string;
  role: string;
};

type RefreshTokenPayload = {
  sub: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(payload: RefreshTokenPayload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyRefreshToken(
  token: string,
): RefreshTokenPayload & JwtPayload {
  try {
    const payload = jwt.verify(
      token,
      REFRESH_TOKEN_SECRET,
    ) as RefreshTokenPayload & JwtPayload;
    return payload;
  } catch (err) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }
}

type ResetSessionPayload = {
  sub: string;
  purpose: "password_reset";
  otpId: string;
};

export const signResetSessionToken = (payload: ResetSessionPayload) => {
  return jwt.sign(payload, RESET_SECRET, {
    expiresIn: "2m",
  });
};

export const verifyResetSessionToken = (token: string) => {
  try {
    const payload = jwt.verify(token, RESET_SECRET) as ResetSessionPayload &
      JwtPayload;

    if (payload.purpose !== "password_reset") {
      throw new Error("INVALID_OR_EXPIRED_TOKEN");
    }

    return payload;
  } catch (error) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }
};
