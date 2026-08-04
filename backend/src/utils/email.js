import nodemailer from "nodemailer";
import crypto from "crypto";

// In dev without SMTP creds set, this logs the email to the console instead
// of sending it, so the flow is still testable end-to-end locally.
const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER;

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export const generateToken = () => crypto.randomBytes(32).toString("hex");

export const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "EthioStudentHub <no-reply@ethiostudenthub.com>",
    to,
    subject,
    html,
  });
};

export const verifyEmailTemplate = (link) => `
  <p>Welcome to EthioStudentHub. Confirm your email to start uploading and downloading resources.</p>
  <p><a href="${link}">Verify my email</a></p>
  <p>This link expires in 24 hours.</p>
`;

export const resetPasswordTemplate = (link) => `
  <p>We received a request to reset your EthioStudentHub password.</p>
  <p><a href="${link}">Reset my password</a></p>
  <p>If you didn't request this, you can ignore this email. This link expires in 1 hour.</p>
`;
