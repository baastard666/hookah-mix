-- Structured flavor profiles v0.2.1. Existing rows are preserved and backfilled.
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'TESTED', 'VERIFIED');
CREATE TYPE "ProfileSource" AS ENUM ('MANUAL', 'MANUFACTURER', 'COMMUNITY', 'MIXED');
CREATE TYPE "FlavorNoteCategory" AS ENUM ('FRUIT', 'BERRY', 'CITRUS', 'DESSERT', 'DRINK', 'SPICE', 'FLORAL', 'HERBAL', 'COOLING', 'NUT', 'COFFEE', 'CHOCOLATE', 'DAIRY', 'TROPICAL', 'SMOKY', 'OTHER');
CREATE TYPE "FlavorNoteType" AS ENUM ('DOMINANT', 'SECONDARY', 'ACCENT');

ALTER TABLE "Flavor"
  ALTER COLUMN "strength" TYPE DOUBLE PRECISION,
  ALTER COLUMN "heatResistance" TYPE DOUBLE PRECISION,
  ALTER COLUMN "intensity" TYPE DOUBLE PRECISION,
  ALTER COLUMN "sweetness" TYPE DOUBLE PRECISION,
  ALTER COLUMN "acidity" TYPE DOUBLE PRECISION,
  ALTER COLUMN "cooling" TYPE DOUBLE PRECISION,
  ALTER COLUMN "creaminess" TYPE DOUBLE PRECISION,
  ALTER COLUMN "bitterness" TYPE DOUBLE PRECISION,
  ADD COLUMN "dryness" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "juiciness" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "freshness" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "dessertLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "spiceLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "floralLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "herbalLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "smokyLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "naturalness" DOUBLE PRECISION NOT NULL DEFAULT 5,
  ADD COLUMN "persistence" DOUBLE PRECISION NOT NULL DEFAULT 5,
  ADD COLUMN "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "profileSource" "ProfileSource" NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "FlavorNote" ADD COLUMN "slug" TEXT;
UPDATE "FlavorNote" SET "slug" = lower(regexp_replace(trim("name"), '\s+', '-', 'g'));
ALTER TABLE "FlavorNote" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "FlavorNote" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "FlavorNote" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "FlavorNote" ALTER COLUMN "category" TYPE "FlavorNoteCategory" USING (
  CASE "category"
    WHEN 'фруктовые' THEN 'FRUIT'
    WHEN 'цитрусовые' THEN 'CITRUS'
    WHEN 'десертные' THEN 'DESSERT'
    WHEN 'напитки' THEN 'DRINK'
    WHEN 'пряные' THEN 'SPICE'
    WHEN 'травяные' THEN 'HERBAL'
    WHEN 'свежие' THEN 'COOLING'
    WHEN 'сливочные' THEN 'DAIRY'
    ELSE 'OTHER'
  END::"FlavorNoteCategory"
);
DROP INDEX "FlavorNote_name_key";
CREATE UNIQUE INDEX "FlavorNote_slug_key" ON "FlavorNote"("slug");

ALTER TABLE "FlavorNoteAssignment" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "FlavorNoteAssignment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "FlavorNoteAssignment" ALTER COLUMN "noteType" TYPE "FlavorNoteType" USING upper("noteType")::"FlavorNoteType";

ALTER TABLE "Flavor" ALTER COLUMN "dryness" DROP DEFAULT, ALTER COLUMN "juiciness" DROP DEFAULT, ALTER COLUMN "freshness" DROP DEFAULT,
  ALTER COLUMN "dessertLevel" DROP DEFAULT, ALTER COLUMN "spiceLevel" DROP DEFAULT, ALTER COLUMN "floralLevel" DROP DEFAULT,
  ALTER COLUMN "herbalLevel" DROP DEFAULT, ALTER COLUMN "smokyLevel" DROP DEFAULT, ALTER COLUMN "naturalness" DROP DEFAULT,
  ALTER COLUMN "persistence" DROP DEFAULT, ALTER COLUMN "profileStatus" DROP DEFAULT, ALTER COLUMN "profileSource" DROP DEFAULT;

ALTER TABLE "Flavor" ADD CONSTRAINT "Flavor_dryness_check" CHECK ("dryness" BETWEEN 0 AND 10),
  ADD CONSTRAINT "Flavor_juiciness_check" CHECK ("juiciness" BETWEEN 0 AND 10), ADD CONSTRAINT "Flavor_freshness_check" CHECK ("freshness" BETWEEN 0 AND 10),
  ADD CONSTRAINT "Flavor_dessertLevel_check" CHECK ("dessertLevel" BETWEEN 0 AND 10), ADD CONSTRAINT "Flavor_spiceLevel_check" CHECK ("spiceLevel" BETWEEN 0 AND 10),
  ADD CONSTRAINT "Flavor_floralLevel_check" CHECK ("floralLevel" BETWEEN 0 AND 10), ADD CONSTRAINT "Flavor_herbalLevel_check" CHECK ("herbalLevel" BETWEEN 0 AND 10),
  ADD CONSTRAINT "Flavor_smokyLevel_check" CHECK ("smokyLevel" BETWEEN 0 AND 10), ADD CONSTRAINT "Flavor_naturalness_check" CHECK ("naturalness" BETWEEN 0 AND 10),
  ADD CONSTRAINT "Flavor_persistence_check" CHECK ("persistence" BETWEEN 0 AND 10);
ALTER TABLE "FlavorNoteAssignment" DROP CONSTRAINT "FlavorNoteAssignment_intensity_check";
ALTER TABLE "FlavorNoteAssignment" ADD CONSTRAINT "FlavorNoteAssignment_intensity_check" CHECK ("intensity" BETWEEN 1 AND 10);
