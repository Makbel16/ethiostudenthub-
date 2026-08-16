CREATE TYPE "InstitutionType" AS ENUM ('UNIVERSITY', 'COLLEGE', 'INSTITUTE', 'OTHER');

CREATE TYPE "InstitutionOwnership" AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TYPE "UniversityVerificationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED');

ALTER TABLE "University"
  ADD COLUMN "shortName" TEXT,
  ADD COLUMN "institutionType" "InstitutionType" NOT NULL DEFAULT 'UNIVERSITY',
  ADD COLUMN "ownership" "InstitutionOwnership" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "region" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "studentPortalUrl" TEXT,
  ADD COLUMN "libraryUrl" TEXT,
  ADD COLUMN "digitalLibraryUrl" TEXT,
  ADD COLUMN "libraryCatalogUrl" TEXT,
  ADD COLUMN "institutionalRepositoryUrl" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "additionalContactInfo" TEXT,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "verificationStatus" "UniversityVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "University"
SET "verificationStatus" = CASE
  WHEN "isVerified" = true THEN 'VERIFIED'::"UniversityVerificationStatus"
  ELSE 'UNVERIFIED'::"UniversityVerificationStatus"
END;

ALTER TABLE "University" DROP COLUMN "isVerified";

ALTER TABLE "University" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE INDEX "University_region_idx" ON "University"("region");
CREATE INDEX "University_city_idx" ON "University"("city");
CREATE INDEX "University_institutionType_idx" ON "University"("institutionType");
CREATE INDEX "University_ownership_idx" ON "University"("ownership");
CREATE INDEX "University_verificationStatus_idx" ON "University"("verificationStatus");
CREATE INDEX "University_isActive_idx" ON "University"("isActive");
