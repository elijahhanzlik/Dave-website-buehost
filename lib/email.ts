import { Resend } from "resend";
import type { InquiryInput } from "@/lib/validations";

export async function sendInquiryNotification(
  inquiry: InquiryInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.warn(
      "[email] RESEND_API_KEY or ADMIN_EMAIL missing; skipping inquiry notification",
    );
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: adminEmail,
    replyTo: inquiry.email,
    subject: `New inquiry from ${inquiry.name}`,
    text: `New inquiry from your website:

Name: ${inquiry.name}
Email: ${inquiry.email}

Message:
${inquiry.message}`,
  });
}
