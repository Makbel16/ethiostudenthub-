import { Router } from "express";
import prisma from "../config/prisma.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../config/upload.js";

const router = Router();

const REQUIRED_UPLOAD_FIELDS = [
  "title",
  "type",
  "universityId",
  "departmentId",
  "courseCode",
  "level",
  "semester",
  "academicYear",
];

// GET /api/resources - search + filter + paginate
// query params: q, universityId, collegeId, departmentId, courseId, courseCode,
//               level, semester, academicYear, type, examType,
//               sort=newest|popular|rating, page, pageSize
router.get("/", async (req, res) => {
  const {
    q,
    universityId,
    collegeId,
    departmentId,
    courseId,
    courseCode,
    level,
    semester,
    academicYear,
    type,
    examType,
    sort = "newest",
    page = "1",
    pageSize = "20",
  } = req.query;

  const where = {
    status: "APPROVED",
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { courseCode: { contains: q, mode: "insensitive" } },
        { courseTitle: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    }),
    ...(universityId && { universityId }),
    ...(collegeId && { collegeId }),
    ...(departmentId && { departmentId }),
    ...(courseId && { courseId }),
    ...(courseCode && { courseCode: { contains: courseCode, mode: "insensitive" } }),
    ...(level && { level }),
    ...(semester && { semester }),
    ...(academicYear && { academicYear }),
    ...(type && { type }),
    ...(examType && { examType }),
  };

  const orderBy =
    sort === "popular"
      ? { downloadCount: "desc" }
      : sort === "rating"
      ? { likes: { _count: "desc" } }
      : { createdAt: "desc" };

  const take = Math.min(parseInt(pageSize, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        uploader: { select: { id: true, fullName: true } },
        university: { select: { id: true, name: true } },
        college: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
    prisma.resource.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

// GET /api/resources/:id
router.get("/:id", optionalAuth, async (req, res) => {
  const resource = await prisma.resource.findUnique({
    where: { id: req.params.id },
    include: {
      uploader: { select: { id: true, fullName: true } },
      university: true,
      college: true,
      department: true,
      course: true,
      comments: { include: { user: { select: { id: true, fullName: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { likes: true, bookmarks: true } },
    },
  });
  if (!resource) return res.status(404).json({ error: "Resource not found" });

  // fire-and-forget view count increment
  prisma.resource.update({ where: { id: resource.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  res.json(resource);
});

// POST /api/resources - authenticated students upload
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });

  const missing = REQUIRED_UPLOAD_FIELDS.filter((f) => !req.body[f]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
  }

  const {
    title,
    description,
    type,
    universityId,
    collegeId,
    departmentId,
    courseId,
    courseCode,
    courseTitle,
    level,
    semester,
    academicYear,
    instructor,
    examType,
    tags,
  } = req.body;

  try {
    const uploaded = await uploadToCloudinary(req.file.buffer, "ethiostudenthub", req.file.originalname);

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type,
        examType: examType || undefined,
        fileUrl: uploaded.secure_url,
        thumbnailUrl: uploaded.secure_url.includes("/image/") ? uploaded.secure_url : null,
        instructor,
        courseCode,
        courseTitle,
        level,
        semester,
        academicYear,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        uploaderId: req.user.id,
        universityId: universityId || undefined,
        collegeId: collegeId || undefined,
        departmentId: departmentId || undefined,
        courseId: courseId || undefined,
        status: "PENDING", // goes to moderation queue
      },
    });
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// PATCH /api/resources/:id - owner or admin edits metadata (not the file itself)
router.patch("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Resource not found" });

  const isOwner = existing.uploaderId === req.user.id;
  const isPrivileged = ["ADMIN", "MODERATOR"].includes(req.user.role);
  if (!isOwner && !isPrivileged) return res.status(403).json({ error: "Not allowed to edit this resource" });

  const {
    title,
    description,
    instructor,
    examType,
    tags,
    universityId,
    collegeId,
    departmentId,
    courseId,
    courseCode,
    courseTitle,
    level,
    semester,
    academicYear,
  } = req.body;

  const resource = await prisma.resource.update({
    where: { id: req.params.id },
    data: {
      title,
      description,
      instructor,
      examType: examType || undefined,
      courseCode,
      courseTitle,
      level: level || undefined,
      semester: semester || undefined,
      academicYear,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim())) : undefined,
      universityId: universityId || undefined,
      collegeId: collegeId || undefined,
      departmentId: departmentId || undefined,
      courseId: courseId || undefined,
      // Edits by a non-privileged owner go back to moderation
      status: isOwner && !isPrivileged ? "PENDING" : undefined,
    },
  });
  res.json(resource);
});

// DELETE /api/resources/:id - owner or admin/moderator
router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Resource not found" });

  const isOwner = existing.uploaderId === req.user.id;
  const isPrivileged = ["ADMIN", "MODERATOR"].includes(req.user.role);
  if (!isOwner && !isPrivileged) return res.status(403).json({ error: "Not allowed to delete this resource" });

  // Clean up dependent rows first (no cascading delete defined in the schema)
  await prisma.$transaction([
    prisma.like.deleteMany({ where: { resourceId: req.params.id } }),
    prisma.bookmark.deleteMany({ where: { resourceId: req.params.id } }),
    prisma.comment.deleteMany({ where: { resourceId: req.params.id } }),
    prisma.report.deleteMany({ where: { resourceId: req.params.id } }),
    prisma.resource.delete({ where: { id: req.params.id } }),
  ]);

  res.json({ success: true });
});

// POST /api/resources/:id/like
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    await prisma.like.create({ data: { userId: req.user.id, resourceId: req.params.id } });
    res.status(201).json({ liked: true });
  } catch {
    // already liked -> unlike (toggle behavior)
    await prisma.like.delete({
      where: { userId_resourceId: { userId: req.user.id, resourceId: req.params.id } },
    });
    res.json({ liked: false });
  }
});

// POST /api/resources/:id/bookmark
router.post("/:id/bookmark", requireAuth, async (req, res) => {
  try {
    await prisma.bookmark.create({ data: { userId: req.user.id, resourceId: req.params.id } });
    res.status(201).json({ bookmarked: true });
  } catch {
    await prisma.bookmark.delete({
      where: { userId_resourceId: { userId: req.user.id, resourceId: req.params.id } },
    });
    res.json({ bookmarked: false });
  }
});

// POST /api/resources/:id/comments
router.post("/:id/comments", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "content is required" });
  const comment = await prisma.comment.create({
    data: { content, userId: req.user.id, resourceId: req.params.id },
    include: { user: { select: { id: true, fullName: true } } },
  });
  res.status(201).json(comment);
});

// DELETE /api/resources/:id/comments/:commentId - owner or admin/moderator
router.delete("/:id/comments/:commentId", requireAuth, async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const isOwner = comment.userId === req.user.id;
  const isPrivileged = ["ADMIN", "MODERATOR"].includes(req.user.role);
  if (!isOwner && !isPrivileged) return res.status(403).json({ error: "Not allowed to delete this comment" });

  await prisma.comment.delete({ where: { id: req.params.commentId } });
  res.json({ success: true });
});

// GET /api/resources/:id/download - increments count and redirects to file
router.get("/:id/download", async (req, res) => {
  const resource = await prisma.resource.update({
    where: { id: req.params.id },
    data: { downloadCount: { increment: 1 } },
  });
  res.redirect(resource.fileUrl);
});

// GET /api/resources/moderation/queue - moderator/admin: list pending resources
router.get(
  "/moderation/queue",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  async (req, res) => {
    const items = await prisma.resource.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        uploader: { select: { id: true, fullName: true, email: true } },
        university: { select: { name: true } },
      },
    });
    res.json(items);
  }
);

// PATCH /api/resources/:id/moderate - moderator/admin approve or reject
router.patch(
  "/:id/moderate",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  async (req, res) => {
    const { status } = req.body; // APPROVED | REJECTED
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "status must be APPROVED or REJECTED" });
    }
    const resource = await prisma.resource.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(resource);
  }
);

export default router;