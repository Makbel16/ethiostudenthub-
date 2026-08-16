-- CreateEnum
CREATE TYPE "AcademicLevel" AS ENUM ('YEAR_1', 'YEAR_2', 'YEAR_3', 'YEAR_4', 'YEAR_5', 'YEAR_6', 'MASTERS', 'PHD');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('SEMESTER_1', 'SEMESTER_2', 'SUMMER');

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_universityId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_departmentId_fkey";

-- DropIndex
DROP INDEX "Resource_universityId_departmentId_courseId_idx";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "collegeId" TEXT;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "collegeId" TEXT,
ADD COLUMN     "courseCode" TEXT,
ADD COLUMN     "courseTitle" TEXT,
ADD COLUMN     "level" "AcademicLevel",
ADD COLUMN     "semester" "Semester";

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "College_universityId_name_key" ON "College"("universityId", "name");

-- CreateIndex
CREATE INDEX "Resource_universityId_collegeId_departmentId_courseId_idx" ON "Resource"("universityId", "collegeId", "departmentId", "courseId");

-- CreateIndex
CREATE INDEX "Resource_courseCode_idx" ON "Resource"("courseCode");

-- CreateIndex
CREATE INDEX "Resource_level_semester_idx" ON "Resource"("level", "semester");

-- AddForeignKey
ALTER TABLE "College" ADD CONSTRAINT "College_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;
