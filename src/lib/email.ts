import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"Portfolio Manager" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Reset your password</h2>
        <p style="color: #444;">You requested a password reset for your Portfolio Manager account.</p>
        <p style="color: #444;">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
          style="display: inline-block; margin: 24px 0; padding: 12px 24px;
                 background-color: #0f172a; color: #fff; text-decoration: none;
                 border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 13px;">
          If you didn&apos;t request this, you can safely ignore this email.
        </p>
        <p style="color: #888; font-size: 13px;">
          Or copy this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #0f172a;">${resetUrl}</a>
        </p>
      </div>
    `,
  });
}
