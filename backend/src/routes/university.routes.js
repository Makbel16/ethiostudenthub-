import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../config/upload.js";

const router = Router();

const MANAGE_UNIVERSITY_ROLES = ["ADMIN", "MODERATOR"];
const INSTITUTION_TYPES = ["UNIVERSITY", "COLLEGE", "INSTITUTE", "OTHER"];
const OWNERSHIPS = ["PUBLIC", "PRIVATE"];
const VERIFICATION_STATUSES = ["VERIFIED", "UNVERIFIED"];
const STATUS_ACTIONS = ["VERIFIED", "UNVERIFIED", "ACTIVE", "INACTIVE"];

const URL_FIELDS = [
  "logoUrl",
  "website",
  "studentPortalUrl",
  "libraryUrl",
  "digitalLibraryUrl",
  "libraryCatalogUrl",
  "institutionalRepositoryUrl",
];

const OPTIONAL_TEXT_FIELDS = [
  "shortName",
  "city",
  "address",
  "description",
  "contactEmail",
  "contactPhone",
  "additionalContactInfo",
  "region",
];

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

const normalizeHttpUrl = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return ["http:", "https:"].includes(url.protocol) && url.hostname ? url.toString() : null;
  } catch {
    return null;
  }
};

const isValidPhone = (value) => /^\+?[0-9][0-9\s().-]{6,20}$/.test(String(value || "").trim());

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

const optionalString = (max = 500) => z.string().trim().max(max).optional();
const optionalCoordinate = (min, max) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(min).max(max).optional()
  );

const universityBaseSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(90).optional(),
  shortName: optionalString(40),
  institutionType: z.enum(INSTITUTION_TYPES).optional(),
  ownership: z.enum(OWNERSHIPS).optional(),
  region: z.string().trim().min(2).max(100),
  city: optionalString(100),
  address: optionalString(300),
  description: optionalString(2000),
  logoUrl: optionalString(2048),
  website: optionalString(2048),
  studentPortalUrl: optionalString(2048),
  libraryUrl: optionalString(2048),
  digitalLibraryUrl: optionalString(2048),
  libraryCatalogUrl: optionalString(2048),
  institutionalRepositoryUrl: optionalString(2048),
  contactEmail: optionalString(254),
  contactPhone: optionalString(40),
  additionalContactInfo: optionalString(1000),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  isActive: z.preprocess(parseBoolean, z.boolean().optional()),
});

const universityCreateSchema = universityBaseSchema.extend({
  institutionType: z.enum(INSTITUTION_TYPES).default("UNIVERSITY"),
  ownership: z.enum(OWNERSHIPS).default("PUBLIC"),
});

const universityUpdateSchema = universityBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

const statusSchema = z
  .object({
    status: z.enum(STATUS_ACTIONS).optional(),
    verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
    isActive: z.preprocess(parseBoolean, z.boolean().optional()),
  })
  .refine((value) => value.status || value.verificationStatus || value.isActive !== undefined, {
    message: "status, verificationStatus, or isActive is required",
  });

const sendZodError = (res, parsed) => res.status(400).json({ error: parsed.error.flatten() });

const withDerivedStatus = (university) =>
  university
    ? {
        ...university,
        isVerified: university.verificationStatus === "VERIFIED",
      }
    : university;

const buildUniversityData = async (input, file, { isCreate = false } = {}) => {
  const parsed = (isCreate ? universityCreateSchema : universityUpdateSchema).safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const values = parsed.data;
  const data = {};

  if ("name" in values) data.name = values.name;
  if ("slug" in values || (isCreate && values.name)) {
    const slug = slugify(values.slug || values.name);
    if (!slug) return { error: "A valid slug could not be generated" };
    data.slug = slug;
  }
  if ("institutionType" in values) data.institutionType = values.institutionType;
  if ("ownership" in values) data.ownership = values.ownership;
  if ("verificationStatus" in values) data.verificationStatus = values.verificationStatus;
  if ("isActive" in values) data.isActive = values.isActive;
  if ("latitude" in values) data.latitude = values.latitude ?? null;
  if ("longitude" in values) data.longitude = values.longitude ?? null;

  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (!(field in values)) continue;
    data[field] = normalizeText(values[field]);
  }

  for (const field of URL_FIELDS) {
    if (!(field in values)) continue;
    const normalized = normalizeHttpUrl(values[field]);
    if (values[field] && !normalized) {
      return { error: `${field} must be a valid http or https URL` };
    }
    data[field] = normalized;
  }

  if (data.contactEmail && !z.string().email().safeParse(data.contactEmail).success) {
    return { error: "contactEmail must be a valid email address" };
  }

  if (data.contactPhone && !isValidPhone(data.contactPhone)) {
    return { error: "contactPhone must be a valid phone number" };
  }

  if (file) {
    if (!file.mimetype.startsWith("image/")) return { error: "Logo must be an image file" };
    const uploaded = await uploadToCloudinary(file.buffer, "ethiostudenthub/universities", file.originalname);
    data.logoUrl = uploaded.secure_url;
  }

  return { data };
};

const assertNoDuplicate = async ({ id, name, slug }) => {
  if (name) {
    const existingByName = await prisma.university.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(id && { NOT: { id } }),
      },
      select: { id: true },
    });
    if (existingByName) return "A university with this name already exists";
  }

  if (slug) {
    const existingBySlug = await prisma.university.findFirst({
      where: {
        slug,
        ...(id && { NOT: { id } }),
      },
      select: { id: true },
    });
    if (existingBySlug) return "A university with this slug already exists";
  }

  return null;
};

const handlePrismaError = (res, err) => {
  if (err.code === "P2025") return res.status(404).json({ error: "University not found" });
  if (err.code === "P2002") return res.status(409).json({ error: "University already exists" });
  console.error(err);
  return res.status(500).json({ error: "University request failed" });
};

const canManageUniversities = (user) => user && MANAGE_UNIVERSITY_ROLES.includes(user.role);

// GET /api/universities/options - lightweight active list for dropdowns
router.get("/options", async (_req, res) => {
  const universities = await prisma.university.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take: 500,
    select: {
      id: true,
      name: true,
      slug: true,
      shortName: true,
      region: true,
      city: true,
      verificationStatus: true,
      isActive: true,
    },
  });
  res.json(universities.map(withDerivedStatus));
});

// GET /api/universities/filters - public filter options
router.get("/filters", async (_req, res) => {
  const universities = await prisma.university.findMany({
    where: { isActive: true },
    select: { region: true, city: true },
  });

  const sortedUnique = (values) =>
    Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  res.json({
    regions: sortedUnique(universities.map((university) => university.region)),
    cities: sortedUnique(universities.map((university) => university.city)),
    institutionTypes: INSTITUTION_TYPES,
    ownerships: OWNERSHIPS,
    verificationStatuses: VERIFICATION_STATUSES,
  });
});

// GET /api/universities - search + filter + paginate
router.get("/", optionalAuth, async (req, res) => {
  const {
    q,
    region,
    city,
    institutionType,
    type,
    ownership,
    verificationStatus,
    verified,
    active,
    sort = "name",
    page = "1",
    pageSize = "12",
  } = req.query;

  const isManager = canManageUniversities(req.user);
  const normalizedType = institutionType || type;
  const where = {};

  if (active === "false" && isManager) {
    where.isActive = false;
  } else if (active === "all" && isManager) {
    // Admin and moderator views can intentionally include inactive institutions.
  } else {
    where.isActive = true;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { shortName: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
    ];
  }

  if (region) where.region = { equals: region, mode: "insensitive" };
  if (city) where.city = { equals: city, mode: "insensitive" };
  if (normalizedType && INSTITUTION_TYPES.includes(normalizedType)) where.institutionType = normalizedType;
  if (ownership && OWNERSHIPS.includes(ownership)) where.ownership = ownership;
  if (verificationStatus && VERIFICATION_STATUSES.includes(verificationStatus)) {
    where.verificationStatus = verificationStatus;
  }
  if (verified === "true") where.verificationStatus = "VERIFIED";
  if (verified === "false") where.verificationStatus = "UNVERIFIED";

  const take = Math.min(parseInt(pageSize, 10) || 12, 100);
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (currentPage - 1) * take;

  const orderBy =
    sort === "newest" ? { createdAt: "desc" } : sort === "updated" ? { updatedAt: "desc" } : { name: "asc" };

  const [items, total] = await Promise.all([
    prisma.university.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        _count: { select: { departments: true, resources: true, users: true } },
      },
    }),
    prisma.university.count({ where }),
  ]);

  res.json({
    items: items.map(withDerivedStatus),
    total,
    page: currentPage,
    pageSize: take,
    totalPages: Math.ceil(total / take),
  });
});

// GET /api/universities/:id/colleges - list colleges for cascading dropdowns
router.get("/:id/colleges", async (req, res) => {
  const colleges = await prisma.college.findMany({
    where: { universityId: req.params.id },
    orderBy: { name: "asc" },
  });
  res.json(colleges);
});

// GET /api/universities/:id/departments - optionally narrowed to a college
router.get("/:id/departments", async (req, res) => {
  const { collegeId } = req.query;
  const departments = await prisma.department.findMany({
    where: { universityId: req.params.id, ...(collegeId && { collegeId }) },
    orderBy: { name: "asc" },
  });
  res.json(departments);
});

// GET /api/universities/:idOrSlug - public detail page
router.get("/:idOrSlug", async (req, res) => {
  const university = await prisma.university.findFirst({
    where: {
      isActive: true,
      OR: [{ id: req.params.idOrSlug }, { slug: req.params.idOrSlug }],
    },
    include: {
      colleges: { orderBy: { name: "asc" } },
      departments: { include: { courses: { orderBy: { title: "asc" } } }, orderBy: { name: "asc" } },
      _count: { select: { departments: true, resources: true, users: true } },
    },
  });

  if (!university) return res.status(404).json({ error: "University not found" });

  const [relatedResources, relatedUsefulLinks] = await Promise.all([
    prisma.resource.findMany({
      where: {
        universityId: university.id,
        status: "APPROVED",
        NOT: { type: "USEFUL_LINK" },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        uploader: { select: { id: true, fullName: true } },
        department: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
    prisma.resource.findMany({
      where: {
        universityId: university.id,
        status: "APPROVED",
        type: "USEFUL_LINK",
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        uploader: { select: { id: true, fullName: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
  ]);

  res.json(withDerivedStatus({ ...university, relatedResources, relatedUsefulLinks }));
});

// POST /api/universities - admin/moderator only
router.post("/", requireAuth, requireRole(...MANAGE_UNIVERSITY_ROLES), upload.single("logo"), async (req, res) => {
  try {
    const { data, error } = await buildUniversityData(req.body, req.file, { isCreate: true });
    if (error) return res.status(400).json({ error });

    const duplicate = await assertNoDuplicate({ name: data.name, slug: data.slug });
    if (duplicate) return res.status(409).json({ error: duplicate });

    const university = await prisma.university.create({ data });
    res.status(201).json(withDerivedStatus(university));
  } catch (err) {
    handlePrismaError(res, err);
  }
});

const updateUniversity = async (req, res) => {
  try {
    const existing = await prisma.university.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "University not found" });

    const { data, error } = await buildUniversityData(req.body, req.file);
    if (error) return res.status(400).json({ error });

    const duplicate = await assertNoDuplicate({ id: req.params.id, name: data.name, slug: data.slug });
    if (duplicate) return res.status(409).json({ error: duplicate });

    const university = await prisma.university.update({
      where: { id: req.params.id },
      data,
    });
    res.json(withDerivedStatus(university));
  } catch (err) {
    handlePrismaError(res, err);
  }
};

// PUT/PATCH /api/universities/:id - admin/moderator only
router.put("/:id", requireAuth, requireRole(...MANAGE_UNIVERSITY_ROLES), upload.single("logo"), updateUniversity);
router.patch("/:id", requireAuth, requireRole(...MANAGE_UNIVERSITY_ROLES), upload.single("logo"), updateUniversity);

// PATCH /api/universities/:id/status - verify/unverify/activate/deactivate
router.patch("/:id/status", requireAuth, requireRole(...MANAGE_UNIVERSITY_ROLES), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return sendZodError(res, parsed);

  const data = {};
  if (parsed.data.status === "VERIFIED") {
    data.verificationStatus = "VERIFIED";
    data.isActive = true;
  }
  if (parsed.data.status === "UNVERIFIED") data.verificationStatus = "UNVERIFIED";
  if (parsed.data.status === "ACTIVE") data.isActive = true;
  if (parsed.data.status === "INACTIVE") data.isActive = false;
  if (parsed.data.verificationStatus) data.verificationStatus = parsed.data.verificationStatus;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  try {
    const university = await prisma.university.update({ where: { id: req.params.id }, data });
    res.json(withDerivedStatus(university));
  } catch (err) {
    handlePrismaError(res, err);
  }
});

// DELETE /api/universities/:id - soft delete by deactivation
router.delete("/:id", requireAuth, requireRole(...MANAGE_UNIVERSITY_ROLES), async (req, res) => {
  try {
    const university = await prisma.university.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, university: withDerivedStatus(university) });
  } catch (err) {
    handlePrismaError(res, err);
  }
});

// --- Colleges ---

// POST /api/universities/:id/colleges - admin or university rep
router.post(
  "/:id/colleges",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const college = await prisma.college.create({
      data: { name, universityId: req.params.id },
    });
    res.status(201).json(college);
  }
);

// PATCH /api/universities/colleges/:id - admin or university rep
router.patch(
  "/colleges/:id",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    const { name } = req.body;
    const college = await prisma.college.update({
      where: { id: req.params.id },
      data: { name },
    });
    res.json(college);
  }
);

// DELETE /api/universities/colleges/:id - admin or university rep
router.delete(
  "/colleges/:id",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    await prisma.college.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }
);

// --- Departments ---

// POST /api/universities/:id/departments - admin or university rep
router.post(
  "/:id/departments",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    const { name, collegeId } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const department = await prisma.department.create({
      data: { name, universityId: req.params.id, collegeId: collegeId || undefined },
    });
    res.status(201).json(department);
  }
);

// PATCH /api/universities/departments/:id - admin or university rep
router.patch(
  "/departments/:id",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    const { name, collegeId } = req.body;
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: { name, collegeId: collegeId || undefined },
    });
    res.json(department);
  }
);

// DELETE /api/universities/departments/:id - admin or university rep
router.delete(
  "/departments/:id",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }
);

// --- Courses ---

// POST /api/universities/departments/:id/courses - admin or university rep
router.post(
  "/departments/:id/courses",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    const { title, code, year, semester } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const course = await prisma.course.create({
      data: { title, code, year, semester, departmentId: req.params.id },
    });
    res.status(201).json(course);
  }
);

// PATCH /api/universities/courses/:id - admin or university rep
router.patch(
  "/courses/:id",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    const { title, code, year, semester } = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, code, year, semester },
    });
    res.json(course);
  }
);

// DELETE /api/universities/courses/:id - admin or university rep
router.delete(
  "/courses/:id",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  }
);

export default router;
