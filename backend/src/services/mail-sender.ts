import { transporter } from "@/config/mail";
import { getEmailTemplate } from "@/services/email-templates";
import { EmailType } from "@/queues/email.types";
import { env } from "@/config/env";

interface SendMailParams {
  type: EmailType;
  to: string;
  data: any;
  senderName?: string;
  replyTo?: string;
}

export const sendEmailImmediate = async ({
  type,
  to,
  data,
  senderName,
  replyTo,
}: SendMailParams) => {
  console.log(`🚀 Sending Immediate Email to: ${to}`);

  const { subject, html } = getEmailTemplate(type, data);

  if (!env.MAIL_USER) {
    throw new Error("Missing MAIL_USER in .env");
  }

  const fromAddress = `"${senderName || "RentFlow System"}" <${env.MAIL_USER}>`;

  return await transporter.sendMail({
    from: fromAddress,
    to,
    replyTo,
    subject,
    html,
  });
};
