import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const universities = [
    { name: "Addis Ababa University", slug: "aau", city: "Addis Ababa" },
    { name: "Bahir Dar University", slug: "bdu", city: "Bahir Dar" },
    { name: "Jimma University", slug: "ju", city: "Jimma" },
    { name: "Haramaya University", slug: "hu", city: "Haramaya" },
    { name: "Mekelle University", slug: "mu", city: "Mekelle" },
    { name: "Hawassa University", slug: "hwu", city: "Hawassa" },
    { name: "Adama Science and Technology University", slug: "astu", city: "Adama" },
    { name: "Arba Minch University", slug: "amu", city: "Arba Minch" },
    { name: "Wolkite University", slug: "wku", city: "Wolkite" },
    { name: "Wollo University", slug: "wu", city: "Dessie" },
    { name: "Debre Berhan University", slug: "dbu", city: "Debre Berhan" },
  ];

  for (const u of universities) {
    await prisma.university.upsert({ where: { slug: u.slug }, update: {}, create: u });
  }

  const aau = await prisma.university.findUnique({ where: { slug: "aau" } });
  const cs = await prisma.department.upsert({
    where: { universityId_name: { universityId: aau.id, name: "Computer Science" } },
    update: {},
    create: { name: "Computer Science", universityId: aau.id },
  });
  await prisma.course.create({
    data: { title: "Data Structures and Algorithms", code: "CoSc2012", departmentId: cs.id, year: 2, semester: 1 },
  });

  const passwordHash = await bcrypt.hash("Password123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@ethiostudenthub.com" },
    update: {},
    create: {
      fullName: "Platform Admin",
      email: "admin@ethiostudenthub.com",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });
  await prisma.user.upsert({
    where: { email: "student@ethiostudenthub.com" },
    update: {},
    create: {
      fullName: "Selam Tesfaye",
      email: "student@ethiostudenthub.com",
      passwordHash,
      role: "STUDENT",
      universityId: aau.id,
      isVerified: true,
    },
  });

  console.log("Seed complete. Sample login: admin@ethiostudenthub.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
