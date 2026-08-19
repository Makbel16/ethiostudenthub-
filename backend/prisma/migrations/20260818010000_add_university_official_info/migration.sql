CREATE TYPE "UniversityCalendarEventType" AS ENUM (
  'SEMESTER_START',
  'SEMESTER_END',
  'REGISTRATION_DEADLINE',
  'EXAM_PERIOD',
  'HOLIDAY',
  'GRADUATION'
);

CREATE TABLE "UniversityCalendarEvent" (
  "id" TEXT NOT NULL,
  "universityId" TEXT NOT NULL,
  "type" "UniversityCalendarEventType" NOT NULL,
  "title" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UniversityCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UniversityAnnouncement" (
  "id" TEXT NOT NULL,
  "universityId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "authorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UniversityAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UniversityCalendarEvent_universityId_type_idx" ON "UniversityCalendarEvent"("universityId", "type");
CREATE INDEX "UniversityCalendarEvent_startDate_idx" ON "UniversityCalendarEvent"("startDate");
CREATE INDEX "UniversityAnnouncement_universityId_createdAt_idx" ON "UniversityAnnouncement"("universityId", "createdAt");

ALTER TABLE "UniversityCalendarEvent"
  ADD CONSTRAINT "UniversityCalendarEvent_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UniversityAnnouncement"
  ADD CONSTRAINT "UniversityAnnouncement_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UniversityAnnouncement"
  ADD CONSTRAINT "UniversityAnnouncement_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
