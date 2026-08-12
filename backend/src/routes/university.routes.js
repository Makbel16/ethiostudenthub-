import { Router } from "express";
import prisma from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/universities - list all universities
router.get("/", async (_req, res) => {
  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { departments: true, resources: true } } },
  });
  res.json(universities);
});

// GET /api/universities/:id/colleges - list colleges for a university (for cascading filter dropdowns)
router.get("/:id/colleges", async (req, res) => {
  const colleges = await prisma.college.findMany({
    where: { universityId: req.params.id },
    orderBy: { name: "asc" },
  });
  res.json(colleges);
});

// GET /api/universities/:id/departments - list departments for a university,
// optionally narrowed to a college. Used for cascading filter/upload dropdowns.
router.get("/:id/departments", async (req, res) => {
  const { collegeId } = req.query;
  const departments = await prisma.department.findMany({
    where: { universityId: req.params.id, ...(collegeId && { collegeId }) },
    orderBy: { name: "asc" },
  });
  res.json(departments);
});

// GET /api/universities/:slug - university detail with colleges/departments/courses
router.get("/:slug", async (req, res) => {
  const university = await prisma.university.findUnique({
    where: { slug: req.params.slug },
    include: {
      colleges: true,
      departments: { include: { courses: true } },
    },
  });
  if (!university) return res.status(404).json({ error: "University not found" });
  res.json(university);
});

// POST /api/universities - admin only
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { name, slug, city, website, description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  const university = await prisma.university.create({
    data: { name, slug, city, website, description },
  });
  res.status(201).json(university);
});

// PATCH /api/universities/:id - admin only
router.patch("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { name, city, website, description, isVerified } = req.body;
  const university = await prisma.university.update({
    where: { id: req.params.id },
    data: { name, city, website, description, isVerified },
  });
  res.json(university);
});

// DELETE /api/universities/:id - admin only
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  await prisma.university.delete({ where: { id: req.params.id } });
  res.json({ success: true });
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