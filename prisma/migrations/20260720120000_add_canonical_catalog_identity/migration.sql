-- Persisted canonical catalog identity v0.2.9. Existing display data and relations are preserved.
CREATE TYPE "CatalogIdentityStatus" AS ENUM ('RESOLVED', 'MANUFACTURER_ONLY', 'UNRESOLVED', 'AMBIGUOUS', 'INVALID');
CREATE TYPE "CatalogEntryType" AS ENUM ('REAL', 'TEST', 'INTERNAL');

ALTER TABLE "Flavor"
  ADD COLUMN "manufacturerId" TEXT,
  ADD COLUMN "productLineId" TEXT,
  ADD COLUMN "canonicalProductName" TEXT,
  ADD COLUMN "canonicalProductId" TEXT,
  ADD COLUMN "identityStatus" "CatalogIdentityStatus" NOT NULL DEFAULT 'UNRESOLVED',
  ADD COLUMN "identityVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "catalogEntryType" "CatalogEntryType" NOT NULL DEFAULT 'REAL';

CREATE UNIQUE INDEX "Flavor_canonicalProductId_key" ON "Flavor"("canonicalProductId");
