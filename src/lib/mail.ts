import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendMail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log("[Mail] RESEND_API_KEY not configured. Would have sent:", { to, subject });
    return { skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "CollabDocs <noreply@collabdocs.online>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[Mail] Resend error:", error);
    throw error;
  }

  return { sent: true, id: data?.id };
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  return sendMail(
    to,
    "Reset your CollabDocs password",
    `<div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
      <h2 style="color: #18181b;">Reset your password</h2>
      <p style="color: #52525b;">Click the button below to reset your CollabDocs password. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0;">Reset Password</a>
      <p style="color: #a1a1aa; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`
  );
}

export async function sendInviteEmail(to: string, documentTitle: string, role: string, inviteLink: string) {
  return sendMail(
    to,
    `You've been invited to collaborate on "${documentTitle}"`,
    `<div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
      <h2 style="color: #18181b;">You've been invited</h2>
      <p style="color: #52525b;">Someone invited you to collaborate on <strong>"${documentTitle}"</strong> as a <strong>${role}</strong>.</p>
      <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0;">Accept Invitation</a>
      <p style="color: #a1a1aa; font-size: 12px;">This invitation link expires in 7 days.</p>
    </div>`
  );
}
