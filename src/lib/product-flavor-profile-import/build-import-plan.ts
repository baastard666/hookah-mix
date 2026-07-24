import { FLAVOR_PROFILE_CORE_FIELDS, type FlavorProfileCoreField } from "../flavors/types";
import { normalizeSlug } from "../flavors/slug";
import { calculateDataCompleteness, countFilledDimensions } from "../product-flavor-profile";
import type { FlavorDimensionId, ProductFlavorProfile } from "../product-flavor-profile";
import type { ExistingFlavorForImport, FlavorImportPlanItem, ResolvedDecisionForImport } from "./types";

// ADR-016: the registry's dimension names differ from Prisma's Flavor field names in exactly one
// case - `sourness` (registry/ADR-014 domain name) maps to `acidity` (Prisma column name). The other
// 6 are identical strings on both sides.
const DIMENSION_TO_PRISMA_FIELD: Readonly<Record<FlavorDimensionId, FlavorProfileCoreField>> = {
  sweetness: "sweetness",
  sourness: "acidity",
  freshness: "freshness",
  intensity: "intensity",
  strength: "strength",
  heatResistance: "heatResistance",
  juiciness: "juiciness",
};

// ADR-016 addendum: `daily-hookah-slivochnyi-krem` is the one confirmed semantic near-duplicate on
// record (see docs/architecture/product-flavor-profile-demo-near-duplicates.md). Deliberately a small,
// hand-curated map rather than any similarity/fuzzy detection - consistent with the project's blanket
// ban on fuzzy identity matching (ADR-008/009/012). New pairs are added here only after being reviewed
// and recorded in that document, never auto-detected.
export const KNOWN_NEAR_DUPLICATE_WARNINGS: Readonly<Record<string, string>> = {
  "daily-hookah-slivochnyi-krem": 'Похоже на смысловой дубль demo-строки Daily Hookah / "Сливки" (slug: cream) - см. docs/architecture/product-flavor-profile-demo-near-duplicates.md. Импортируется отдельной строкой, НЕ объединяется автоматически (ADR-016 п.4). Решение о тождестве - предмет отдельного будущего identity-decision.',
};

// ADR-016: Brand.slug reuses normalizeSlug (Cyrillic-preserving) so that manufacturers already present
// via prisma/seed.ts (Overdose, Element, MustHave, BlackBurn, Daily Hookah) resolve to the exact same
// slug and the exact same Brand row - this is what makes the demo-overlap detection work by construction
// rather than by special-casing brand names.
export const buildBrandSlug = (manufacturer: string): string => normalizeSlug(manufacturer);

// Product line folded into the slug/name to avoid collisions between two lines of the same brand that
// happen to share a product name (e.g. Chabacco Medium vs Chabacco Mix).
export const buildDisplayName = (productLine: string | null, productName: string): string =>
  productLine ? `${productLine} ${productName}` : productName;
export const buildFlavorSlug = (productLine: string | null, productName: string): string =>
  normalizeSlug(buildDisplayName(productLine, productName));

// ADR-016: no source exists for descriptive taste prose for these evidence-backed imports (that would
// mean inventing text, exactly what ADR-003/014/015 forbid for numeric values). The description is the
// canonical identity itself, nothing more - never a fabricated sentence about how the product tastes.
export const buildDescription = (productLine: string | null, productName: string): string =>
  buildDisplayName(productLine, productName);

const buildDimensionValues = (profile: ProductFlavorProfile): Record<FlavorProfileCoreField, number | null> => {
  const values = Object.fromEntries(FLAVOR_PROFILE_CORE_FIELDS.map(field => [field, null])) as Record<FlavorProfileCoreField, number | null>;
  (Object.keys(DIMENSION_TO_PRISMA_FIELD) as FlavorDimensionId[]).forEach(dimensionId => {
    const value = profile.dimensions[dimensionId];
    if (value) values[DIMENSION_TO_PRISMA_FIELD[dimensionId]] = value.value;
  });
  return values;
};

export const planFlavorImport = (input: {
  readonly decision: ResolvedDecisionForImport;
  readonly profile: ProductFlavorProfile;
  readonly existingFlavor: ExistingFlavorForImport | null;
}): FlavorImportPlanItem => {
  const { decision, profile, existingFlavor } = input;
  const brandSlug = buildBrandSlug(decision.canonicalManufacturerName);
  const flavorSlug = buildFlavorSlug(decision.canonicalProductLineName, decision.canonicalProductName);
  const displayName = buildDisplayName(decision.canonicalProductLineName, decision.canonicalProductName);
  const description = buildDescription(decision.canonicalProductLineName, decision.canonicalProductName);
  const dimensionValues = buildDimensionValues(profile);
  const dataCompleteness = calculateDataCompleteness(profile);
  const filledDimensionCount = countFilledDimensions(profile);
  const warnings: string[] = [];
  const nearDuplicateWarning = KNOWN_NEAR_DUPLICATE_WARNINGS[decision.canonicalProductId];
  if (nearDuplicateWarning) warnings.push(nearDuplicateWarning);

  const base = {
    canonicalProductId: decision.canonicalProductId,
    manufacturer: decision.canonicalManufacturerName,
    productLine: decision.canonicalProductLineName,
    productName: decision.canonicalProductName,
    manufacturerId: decision.manufacturerId,
    productLineId: decision.productLineId,
    brandSlug,
    flavorSlug,
    displayName,
    description,
    dimensionValues,
    dataCompleteness,
    filledDimensionCount,
  };

  // ADR-016 п.5: TEST-записи (Test Kitchen и любые будущие) импортёр не трогает вообще.
  if (existingFlavor?.catalogEntryType === "TEST") {
    return {
      ...base, action: "SKIPPED_TEST", changedFields: [], existingFlavorId: existingFlavor.id,
      warnings: [...warnings, `Существующая строка id=${existingFlavor.id} помечена catalogEntryType=TEST - импортёр её не создаёт и не обновляет.`],
    };
  }

  if (!existingFlavor) {
    return { ...base, action: "CREATE", changedFields: [], existingFlavorId: null, warnings };
  }

  // ADR-016 п.2: evidence-backed значения всегда перезаписывают demo-данные при апсерте; 11 второстепенных
  // полей существующей строки никогда не читаются и не пишутся здесь.
  const changedFields = FLAVOR_PROFILE_CORE_FIELDS
    .filter(field => existingFlavor[field] !== dimensionValues[field])
    .map(field => ({ field, from: existingFlavor[field], to: dimensionValues[field] }));
  if (existingFlavor.canonicalProductId === null && changedFields.length) {
    warnings.push(`Перезаписывает ${changedFields.length} из 7 core-полей существующей строки id=${existingFlavor.id} без evidence (вероятно demo/seed-данные) - см. ADR-016 п.2.`);
  }
  return { ...base, action: "UPDATE", changedFields, existingFlavorId: existingFlavor.id, warnings };
};
