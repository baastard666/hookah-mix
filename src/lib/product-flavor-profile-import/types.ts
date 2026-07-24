import type { FlavorProfileCoreField } from "../flavors/types";
import type { DataCompletenessLevel } from "../product-flavor-profile";

// The subset of a RESOLVED TobaccoIdentityDecision needed to plan a Flavor import row.
// All fields are guaranteed non-null for a genuinely RESOLVED decision except productLine,
// which may legitimately be null (many manufacturers have no distinct product line).
export type ResolvedDecisionForImport = {
  readonly canonicalProductId: string;
  readonly canonicalManufacturerName: string;
  readonly canonicalProductLineName: string | null;
  readonly canonicalProductName: string;
  readonly manufacturerId: string | null;
  readonly productLineId: string | null;
};

// The subset of an existing Prisma Flavor row needed to decide CREATE/UPDATE/SKIPPED_TEST and to
// compute a diff against the 7 ADR-014 core fields. Never includes the 11 secondary fields -
// ADR-016 explicitly forbids the importer from touching them.
export type ExistingFlavorForImport = {
  readonly id: number;
  readonly canonicalProductId: string | null;
  readonly catalogEntryType: "REAL" | "TEST" | "INTERNAL";
} & Record<FlavorProfileCoreField, number | null>;

export type FlavorImportAction = "CREATE" | "UPDATE" | "SKIPPED_TEST";

export type FlavorImportFieldChange = {
  readonly field: FlavorProfileCoreField;
  readonly from: number | null;
  readonly to: number | null;
};

export type FlavorImportPlanItem = {
  readonly canonicalProductId: string;
  readonly manufacturer: string;
  readonly productLine: string | null;
  readonly productName: string;
  readonly manufacturerId: string | null;
  readonly productLineId: string | null;
  readonly brandSlug: string;
  readonly flavorSlug: string;
  readonly displayName: string;
  readonly description: string;
  readonly action: FlavorImportAction;
  readonly dimensionValues: Record<FlavorProfileCoreField, number | null>;
  readonly changedFields: readonly FlavorImportFieldChange[];
  readonly dataCompleteness: DataCompletenessLevel;
  readonly filledDimensionCount: number;
  readonly existingFlavorId: number | null;
  readonly warnings: readonly string[];
};
