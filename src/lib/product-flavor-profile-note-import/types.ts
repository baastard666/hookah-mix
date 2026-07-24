import type { FlavorNoteCategory as LegacyFlavorNoteCategory, FlavorNoteType } from "../flavors/types";
import type { FlavorNoteCategory } from "../flavor-knowledge";

// ADR-018: one generic, category-level FlavorNote per knowledge-layer category actually used by
// PRODUCT_FLAVOR_PROFILE_REGISTRY's dominantNoteIds - registry evidence is category-level
// ("FLORAL"), never a specific note name ("lavender"), so inventing a specific note name would be
// the same kind of fact-invention ADR-003 already forbids for numeric values.
export type GenericNoteDefinition = {
  readonly knowledgeCategory: FlavorNoteCategory;
  readonly legacyCategory: LegacyFlavorNoteCategory;
  readonly slug: string;
  readonly name: string;
};

// The subset of a RESOLVED product needed to plan note assignments: identity for reporting,
// plus the dominantNoteIds evidence itself.
export type ProductForNoteImport = {
  readonly canonicalProductId: string;
  readonly manufacturer: string;
  readonly displayName: string;
  readonly dominantNoteIds: readonly FlavorNoteCategory[];
};

export type ExistingFlavorForNoteImport = {
  readonly flavorId: number;
  readonly catalogEntryType: "REAL" | "TEST" | "INTERNAL";
  readonly assignedNoteIds: readonly number[];
};

export type NoteCreationPlanItem = {
  readonly slug: string;
  readonly name: string;
  readonly category: LegacyFlavorNoteCategory;
};

export type AssignmentPlanItem = {
  readonly canonicalProductId: string;
  readonly flavorId: number;
  readonly manufacturer: string;
  readonly displayName: string;
  readonly knowledgeCategory: FlavorNoteCategory;
  readonly noteSlug: string;
  readonly noteType: FlavorNoteType;
  readonly intensity: number;
};

export type NoteImportSkipReason = "NO_FLAVOR_FOUND" | "TEST_ENTRY" | "NO_DOMINANT_NOTES";

export type NoteImportSkip = {
  readonly canonicalProductId: string;
  readonly reason: NoteImportSkipReason;
};

export type NoteImportWarning = {
  readonly canonicalProductId: string;
  readonly message: string;
};

export type NoteImportPlan = {
  readonly notesToCreate: readonly NoteCreationPlanItem[];
  readonly assignmentsToCreate: readonly AssignmentPlanItem[];
  readonly alreadyAssignedCount: number;
  readonly skipped: readonly NoteImportSkip[];
  readonly warnings: readonly NoteImportWarning[];
};

export type NoteImportPlanInput = {
  readonly products: readonly ProductForNoteImport[];
  readonly existingFlavorByCanonicalProductId: ReadonlyMap<string, ExistingFlavorForNoteImport>;
  readonly existingNoteIdBySlug: ReadonlyMap<string, number>;
};
