ALTER TABLE "Department"
  ADD COLUMN "durationYears" INTEGER,
  ADD COLUMN "degreeAwarded" TEXT,
  ADD COLUMN "programOverview" TEXT,
  ADD COLUMN "admissionRequirements" TEXT;

CREATE TABLE "ProgramBatch" (
  "id" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "admissionYear" TEXT NOT NULL,
  "capacity" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProgramBatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgramBatch_departmentId_admissionYear_key"
  ON "ProgramBatch"("departmentId", "admissionYear");

CREATE INDEX "ProgramBatch_departmentId_idx" ON "ProgramBatch"("departmentId");

ALTER TABLE "ProgramBatch"
  ADD CONSTRAINT "ProgramBatch_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
