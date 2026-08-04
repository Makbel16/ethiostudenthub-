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

// GET /api/universities/:slug - university detail with departments
router.get("/:slug", async (req, res) => {
  const university = await prisma.university.findUnique({
    where: { slug: req.params.slug },
    include: { departments: { include: { courses: true } } },
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

// POST /api/universities/:id/departments - admin or university rep
router.post(
  "/:id/departments",
  requireAuth,
  requireRole("ADMIN", "UNIVERSITY_REP"),
  async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const department = await prisma.department.create({
      data: { name, universityId: req.params.id },
    });
    res.status(201).json(department);
  }
);

export default router;
