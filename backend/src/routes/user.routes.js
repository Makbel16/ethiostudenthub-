import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { hashPassword } from "../utils/auth.js";

const router = Router();

const managerCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8),
  universityId: z.string().uuid(),
});

// GET /api/users/me - current user's profile
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      reputation: true,
      isVerified: true,
      university: { select: { id: true, name: true } },
      _count: { select: { resources: true, comments: true } },
    },
  });
  res.json(user);
});

// PATCH /api/users/me - update profile
router.patch("/me", requireAuth, async (req, res) => {
  const { fullName, bio, avatarUrl, universityId } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { fullName, bio, avatarUrl, universityId },
  });
  res.json({ id: user.id, fullName: user.fullName, bio: user.bio, avatarUrl: user.avatarUrl });
});

// GET /api/users/me/uploads
router.get("/me/uploads", requireAuth, async (req, res) => {
  const uploads = await prisma.resource.findMany({
    where: { uploaderId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { likes: true, comments: true, bookmarks: true } } },
  });
  res.json(uploads);
});

// GET /api/users/me/bookmarks
router.get("/me/bookmarks", requireAuth, async (req, res) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { resource: { include: { university: { select: { name: true } } } } },
  });
  res.json(bookmarks.map((b) => b.resource));
});

// GET /api/users/me/notifications
router.get("/me/notifications", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
});

// PATCH /api/users/me/notifications/:id/read
router.patch("/me/notifications/:id/read", requireAuth, async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true },
  });
  res.json({ updated: notification.count });
});

// --- Admin: user management ---

// GET /api/users - admin only, paginated list
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { page = "1", pageSize = "20", q } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where = q
    ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isBanned: true,
        university: { select: { id: true, name: true } },
        reputation: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

// POST /api/users/university-managers - admin creates a manager account for one university
router.post("/university-managers", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const parsed = managerCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { fullName, email, password, universityId } = parsed.data;

  const [existingUser, university] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.university.findUnique({ where: { id: universityId }, select: { id: true, name: true, isActive: true } }),
  ]);

  if (existingUser) return res.status(409).json({ error: "Email already registered" });
  if (!university || !university.isActive) return res.status(400).json({ error: "Select an active university" });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: "UNIVERSITY_REP",
      universityId,
      isVerified: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isVerified: true,
      isBanned: true,
      university: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  res.status(201).json(user);
});

// PATCH /api/users/:id/role - admin only
router.patch("/:id/role", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { role } = req.body;
  const validRoles = ["GUEST", "STUDENT", "UNIVERSITY_REP", "MODERATOR", "ADMIN"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ id: user.id, role: user.role });
});

// PATCH /api/users/:id/ban - admin or moderator
router.patch("/:id/ban", requireAuth, requireRole("ADMIN", "MODERATOR"), async (req, res) => {
  const { banned } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBanned: Boolean(banned) },
  });
  res.json({ id: user.id, isBanned: user.isBanned });
});

export default router;
