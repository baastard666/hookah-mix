-- ADR-017: extends ADR-015's "null means not measured, never 0" policy to the remaining
-- 7 ADR-014 core dimensions. Discovered while building the Product Flavor Profile Registry
-- importer: none of the 86 RESOLVED products have all 7 core dimensions filled, and one has
-- zero filled - honoring ADR-016 ("import all 86 regardless of completeness") is impossible
-- without either inventing values (forbidden since ADR-003) or allowing null here too.
ALTER TABLE "Flavor"
  ALTER COLUMN "strength" DROP NOT NULL,
  ALTER COLUMN "heatResistance" DROP NOT NULL,
  ALTER COLUMN "intensity" DROP NOT NULL,
  ALTER COLUMN "sweetness" DROP NOT NULL,
  ALTER COLUMN "acidity" DROP NOT NULL,
  ALTER COLUMN "juiciness" DROP NOT NULL,
  ALTER COLUMN "freshness" DROP NOT NULL;
