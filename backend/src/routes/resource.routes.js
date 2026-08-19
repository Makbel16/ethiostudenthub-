import { Router } from "express";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import prisma from "../config/prisma.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";
import { localUploadDir, upload, uploadToCloudinary } from "../config/upload.js";

const router = Router();

const USEFUL_LINK_TYPE = "USEFUL_LINK";

const REQUIRED_RESOURCE_FIELDS = ["title", "type"];

const REQUIRED_FILE_UPLOAD_FIELDS = [
  "title",
  "type",
  "universityId",
  "departmentId",
  "courseCode",
  "level",
  "semester",
  "academicYear",
];

const CONTENT_TYPE_BY_EXTENSION = {
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};

const GENERIC_CONTENT_TYPES = new Set(["application/octet-stream", "binary/octet-stream"]);

const sanitizeFilename = (value) => {
  const cleaned = String(value || "resource")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);

  return cleaned || "resource";
};

const encodeRFC5987 = (value) =>
  encodeURIComponent(value).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

const getFileExtension = (fileUrl = "") => {
  try {
    const pathname = decodeURIComponent(new URL(fileUrl).pathname);
    const extension = path.extname(pathname).toLowerCase();
    return extension.length <= 12 ? extension : "";
  } catch {
    const extension = path.extname(fileUrl).toLowerCase();
    return extension.length <= 12 ? extension : "";
  }
};

const getResourceFilename = (resource) => {
  const title = sanitizeFilename(resource.title);
  const titleExtension = path.extname(title).toLowerCase();
  const fileExtension = getFileExtension(resource.fileUrl);

  return titleExtension in CONTENT_TYPE_BY_EXTENSION || !fileExtension ? title : `${title}${fileExtension}`;
};

const contentDisposition = (disposition, filename) => {
  const asciiFilename = sanitizeFilename(filename).replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `${disposition}; filename="${asciiFilename}"; filename*=UTF-8''${encodeRFC5987(filename)}`;
};

const inferContentType = (fileUrl, upstreamContentType) => {
  const normalized = upstreamContentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized && !GENERIC_CONTENT_TYPES.has(normalized)) return upstreamContentType;

  return CONTENT_TYPE_BY_EXTENSION[getFileExtension(fileUrl)] || upstreamContentType || "application/octet-stream";
};

const getLocalUploadPath = (fileUrl) => {
  try {
    const pathname = decodeURIComponent(new URL(fileUrl).pathname);
    if (!pathname.startsWith("/uploads/")) return null;

    const filename = path.basename(pathname);
    const uploadRoot = path.resolve(localUploadDir);
    const localPath = path.resolve(uploadRoot, filename);
    const relativePath = path.relative(uploadRoot, localPath);

    if (!filename || relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;
    return localPath;
  } catch {
    return null;
  }
};

const getRemoteFileUrl = (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
};

const normalizeHttpUrl = (value) => {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) && url.hostname ? url.toString() : null;
  } catch {
    return null;
  }
};

const isUsefulLink = (resourceOrType) =>
  (typeof resourceOrType === "string" ? resourceOrType : resourceOrType?.type) === USEFUL_LINK_TYPE;

const allowEmbeddedPreview = (res) => {
  // Helmet's default frame headers block the API file response inside the React app.
  res.removeHeader("X-Frame-Options");
  res.removeHeader("Content-Security-Policy");
};

const sendResourceFile = async (req, res, resource, disposition, onReady) => {
  if (!resource.fileUrl) return res.status(404).json({ error: "No file is attached to this resource" });

  const filename = getResourceFilename(resource);
  const headers = {
    "Content-Disposition": contentDisposition(disposition, filename),
    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, Content-Type, Content-Range, Accept-Ranges",
  };

  if (disposition === "inline") allowEmbeddedPreview(res);

  const localPath = getLocalUploadPath(resource.fileUrl);
  if (localPath) {
    if (!fs.existsSync(localPath)) return res.status(404).json({ error: "Stored file not found" });

    await onReady?.();
    return res.sendFile(localPath, { headers }, (err) => {
      if (err) {
        console.error(err);
        if (!res.headersSent) res.status(err.statusCode || 500).json({ error: "Unable to send file" });
      }
    });
  }

  const remoteUrl = getRemoteFileUrl(resource.fileUrl);
  if (!remoteUrl) return res.status(502).json({ error: "Stored file URL is invalid" });

  const upstreamHeaders = {};
  if (req.headers.range) upstreamHeaders.Range = req.headers.range;

  const upstream = await fetch(remoteUrl, { headers: upstreamHeaders, redirect: "follow" });
  if (upstream.status === 416) {
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) res.setHeader("Content-Range", contentRange);
    return res.status(416).end();
  }

  if (!upstream.ok || !upstream.body) {
    return res.status(502).json({ error: "Could not retrieve stored file" });
  }

  await onReady?.();

  headers["Content-Type"] = inferContentType(resource.fileUrl, upstream.headers.get("content-type"));

  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  const acceptRanges = upstream.headers.get("accept-ranges");

  if (contentLength) headers["Content-Length"] = contentLength;
  if (contentRange) headers["Content-Range"] = contentRange;
  if (acceptRanges) headers["Accept-Ranges"] = acceptRanges;

  res.status(upstream.status === 206 ? 206 : 200);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  Readable.fromWeb(upstream.body)
    .on("error", (err) => {
      console.error(err);
      if (!res.headersSent) res.status(502).json({ error: "Could not stream stored file" });
      else res.destroy(err);
    })
    .pipe(res);
};

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

  const canViewPending =
    req.user && (req.user.id === resource.uploaderId || ["ADMIN", "MODERATOR"].includes(req.user.role));
  if (resource.status !== "APPROVED" && !canViewPending) {
    return res.status(404).json({ error: "Resource not found" });
  }

  // fire-and-forget view count increment
  prisma.resource.update({ where: { id: resource.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  res.json(resource);
});

// POST /api/resources - authenticated students upload
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  const missingBaseFields = REQUIRED_RESOURCE_FIELDS.filter((f) => !req.body[f]);
  if (missingBaseFields.length > 0) {
    return res.status(400).json({ error: `Missing required field(s): ${missingBaseFields.join(", ")}` });
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
    url,
    fileUrl,
    usefulLinkUrl,
  } = req.body;

  if (isUsefulLink(type)) {
    const linkUrl = normalizeHttpUrl(url || fileUrl);
    if (!linkUrl) {
      return res.status(400).json({ error: "A valid http/https URL is required for useful links" });
    }

    try {
      const resource = await prisma.resource.create({
        data: {
          title,
          description,
          type,
          fileUrl: linkUrl,
          thumbnailUrl: null,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          uploaderId: req.user.id,
          universityId: universityId || undefined,
          collegeId: collegeId || undefined,
          departmentId: departmentId || undefined,
          courseId: courseId || undefined,
          courseCode: courseCode || undefined,
          courseTitle: courseTitle || undefined,
          level: level || undefined,
          semester: semester || undefined,
          academicYear: academicYear || undefined,
          status: "PENDING",
        },
      });
      return res.status(201).json(resource);
    } catch (err) {
      return res.status(500).json({ error: "Upload failed", details: err.message });
    }
  }

  if (!req.file) return res.status(400).json({ error: "file is required" });

  const missing = REQUIRED_FILE_UPLOAD_FIELDS.filter((f) => !req.body[f]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
  }

  const usefulLinkValue = String(usefulLinkUrl || "").trim();
  const normalizedUsefulLinkUrl = usefulLinkValue ? normalizeHttpUrl(usefulLinkValue) : null;
  if (usefulLinkValue && !normalizedUsefulLinkUrl) {
    return res.status(400).json({ error: "Useful Link must be a valid http/https URL" });
  }

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
        usefulLinkUrl: normalizedUsefulLinkUrl || undefined,
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
    usefulLinkUrl,
  } = req.body;

  const hasUsefulLinkUrl = Object.prototype.hasOwnProperty.call(req.body, "usefulLinkUrl");
  const usefulLinkValue = String(usefulLinkUrl || "").trim();
  const normalizedUsefulLinkUrl = usefulLinkValue ? normalizeHttpUrl(usefulLinkValue) : null;
  if (hasUsefulLinkUrl && usefulLinkValue && !normalizedUsefulLinkUrl) {
    return res.status(400).json({ error: "Useful Link must be a valid http/https URL" });
  }

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
      ...(hasUsefulLinkUrl && { usefulLinkUrl: normalizedUsefulLinkUrl }),
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

// GET /api/resources/:id/open - authenticated inline stream for in-browser preview
router.get("/:id/open", requireAuth, async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    if (isUsefulLink(resource)) return res.status(400).json({ error: "Useful links do not have a file preview" });

    await sendResourceFile(req, res, resource, "inline");
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Unable to open file" });
  }
});

// GET /api/resources/:id/download - authenticated download stream
router.get("/:id/download", requireAuth, async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    if (isUsefulLink(resource)) return res.status(400).json({ error: "Useful links do not have a downloadable file" });

    const shouldIncrementDownload = !req.headers.range || /^bytes=0-/i.test(req.headers.range);

    await sendResourceFile(req, res, resource, "attachment", async () => {
      if (!shouldIncrementDownload) return;
      await prisma.resource
        .update({
          where: { id: req.params.id },
          data: { downloadCount: { increment: 1 } },
        })
        .catch((err) => console.error("Failed to increment download count", err));
    });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Unable to download file" });
  }
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
