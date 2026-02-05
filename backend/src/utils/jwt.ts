import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const RESET_SECRET = process.env.RESET_SECRET!;

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

export const signResetToken = (payload: { sub: string }) => {
  return jwt.sign(payload, RESET_SECRET, {
    expiresIn: "15m",
  });
};

export const verifyResetToken = (token: string) => {
  try {
    return jwt.verify(token, RESET_SECRET) as {
      sub: string;
    };
  } catch (error) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }
};
