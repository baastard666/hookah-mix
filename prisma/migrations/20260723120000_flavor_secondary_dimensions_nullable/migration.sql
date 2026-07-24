-- ADR-015: the 11 secondary sensory dimensions have zero evidence-backed
-- source across the entire Product Flavor Profile Registry (v0.3.5) and
-- structurally never will for most products. NOT NULL forced every prior
-- row to invent a value; nullable lets "not measured" be represented
-- honestly instead of guessed. The 7 ADR-014 dimensions stay required.
ALTER TABLE "Flavor"
  ALTER COLUMN "cooling" DROP NOT NULL,
  ALTER COLUMN "creaminess" DROP NOT NULL,
  ALTER COLUMN "bitterness" DROP NOT NULL,
  ALTER COLUMN "dryness" DROP NOT NULL,
  ALTER COLUMN "dessertLevel" DROP NOT NULL,
  ALTER COLUMN "spiceLevel" DROP NOT NULL,
  ALTER COLUMN "floralLevel" DROP NOT NULL,
  ALTER COLUMN "herbalLevel" DROP NOT NULL,
  ALTER COLUMN "smokyLevel" DROP NOT NULL,
  ALTER COLUMN "naturalness" DROP NOT NULL,
  ALTER COLUMN "persistence" DROP NOT NULL;
