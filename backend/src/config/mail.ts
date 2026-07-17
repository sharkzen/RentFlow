import nodemailer from "nodemailer";
import { env } from "@/config/env";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
  },
});
