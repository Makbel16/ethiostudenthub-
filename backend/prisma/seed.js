import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const universities = [
    {
      name: "Addis Ababa University",
      slug: "aau",
      shortName: "AAU",
      region: "Addis Ababa",
      city: "Addis Ababa",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "VERIFIED",
    },
    {
      name: "Bahir Dar University",
      slug: "bdu",
      shortName: "BDU",
      region: "Amhara",
      city: "Bahir Dar",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Jimma University",
      slug: "ju",
      shortName: "JU",
      region: "Oromia",
      city: "Jimma",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Haramaya University",
      slug: "hu",
      shortName: "HU",
      region: "Oromia",
      city: "Haramaya",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Mekelle University",
      slug: "mu",
      shortName: "MU",
      region: "Tigray",
      city: "Mekelle",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Hawassa University",
      slug: "hwu",
      shortName: "HU",
      region: "Sidama",
      city: "Hawassa",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Adama Science and Technology University",
      slug: "astu",
      shortName: "ASTU",
      region: "Oromia",
      city: "Adama",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Arba Minch University",
      slug: "amu",
      shortName: "AMU",
      region: "South Ethiopia",
      city: "Arba Minch",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Wolkite University",
      slug: "wku",
      shortName: "WKU",
      region: "Central Ethiopia",
      city: "Wolkite",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Wollo University",
      slug: "wu",
      shortName: "WU",
      region: "Amhara",
      city: "Dessie",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Debre Berhan University",
      slug: "dbu",
      shortName: "DBU",
      region: "Amhara",
      city: "Debre Berhan",
      institutionType: "UNIVERSITY",
      ownership: "PUBLIC",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "Unity University",
      slug: "unity-university",
      shortName: "UU",
      region: "Addis Ababa",
      city: "Addis Ababa",
      institutionType: "UNIVERSITY",
      ownership: "PRIVATE",
      verificationStatus: "UNVERIFIED",
    },
    {
      name: "St. Mary's University",
      slug: "st-marys-university",
      shortName: "SMU",
      region: "Addis Ababa",
      city: "Addis Ababa",
      institutionType: "UNIVERSITY",
      ownership: "PRIVATE",
      verificationStatus: "UNVERIFIED",
    },
  ];

  for (const u of universities) {
    await prisma.university.upsert({ where: { slug: u.slug }, update: u, create: u });
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
