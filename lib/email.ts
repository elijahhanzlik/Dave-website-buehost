import { Resend } from "resend";
import type { InquiryInput } from "@/lib/validations";

export async function sendInquiryNotification(
  inquiry: InquiryInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not set");
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!adminEmail) {
    console.error("[email] ADMIN_EMAIL is not set");
    throw new Error("ADMIN_EMAIL is not set");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Davidschaldach Inquiry <websiteinquiry@send.davidschaldach.com>",
    to: adminEmail,
    replyTo: inquiry.email,
    subject: `New inquiry from ${inquiry.name}`,
    text: `New inquiry from your website:

Name: ${inquiry.name}
Email: ${inquiry.email}

Message:
${inquiry.message}`,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message ?? String(error)}`);
  }
}
