import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/auth.js";
import {
  generateToken,
  sendEmail,
  verifyEmailTemplate,
  resetPasswordTemplate,
} from "../utils/email.js";

const router = Router();
const DEFAULT_CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const splitEnvList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const configuredClientOrigins = new Set([DEFAULT_CLIENT_URL, ...splitEnvList(process.env.CLIENT_URLS)]);

const isTrustedClientOrigin = (origin) => {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return (
      configuredClientOrigins.has(origin) ||
      ["localhost", "127.0.0.1", "::1"].includes(hostname) ||
      hostname.endsWith(".ngrok-free.app") ||
      hostname.endsWith(".ngrok.app")
    );
  } catch {
    return false;
  }
};

const getRequestClientUrl = (req) => {
  const origin = req.get("origin");
  if (isTrustedClientOrigin(origin)) return origin;

  const referer = req.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isTrustedClientOrigin(refererOrigin)) return refererOrigin;
    } catch {
      // Ignore malformed referer headers and fall back to configured local URL.
    }
  }

  return DEFAULT_CLIENT_URL;
};

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { fullName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const verifyToken = generateToken();
  const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: { fullName, email, passwordHash, verifyToken, verifyTokenExpires },
  });

  await sendEmail({
    to: email,
    subject: "Verify your EthioStudentHub email",
    html: verifyEmailTemplate(`${getRequestClientUrl(req)}/verify-email?token=${encodeURIComponent(verifyToken)}`),
  }).catch((err) => console.error("Failed to send verification email:", err.message));

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res.status(201).json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isVerified: user.isVerified },
    accessToken,
    refreshToken,
  });
});

// GET /api/auth/verify-email?token=...
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "token is required" });

  const user = await prisma.user.findFirst({
    where: { verifyToken: token, verifyTokenExpires: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired verification link" });

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null, verifyTokenExpires: null },
  });
  res.json({ success: true, message: "Email verified" });
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return 200 so this endpoint can't be used to enumerate accounts
  if (!user || user.isVerified) return res.json({ success: true });

  const verifyToken = generateToken();
  const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { verifyToken, verifyTokenExpires } });

  await sendEmail({
    to: email,
    subject: "Verify your EthioStudentHub email",
    html: verifyEmailTemplate(`${getRequestClientUrl(req)}/verify-email?token=${encodeURIComponent(verifyToken)}`),
  }).catch((err) => console.error("Failed to send verification email:", err.message));

  res.json({ success: true });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return 200 so this endpoint can't be used to enumerate accounts
  if (!user) return res.json({ success: true });

  const resetToken = generateToken();
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpires } });

  await sendEmail({
    to: email,
    subject: "Reset your EthioStudentHub password",
    html: resetPasswordTemplate(`${getRequestClientUrl(req)}/reset-password?token=${encodeURIComponent(resetToken)}`),
  }).catch((err) => console.error("Failed to send reset email:", err.message));

  res.json({ success: true });
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { token, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired reset link" });

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpires: null, refreshToken: null },
  });

  res.json({ success: true, message: "Password updated. Please log in again." });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (user.isBanned) {
    return res.status(403).json({ error: "This account has been banned" });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  }
  res.json({ success: true });
});

export default router;
