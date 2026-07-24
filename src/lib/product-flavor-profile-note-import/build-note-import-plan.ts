import type { NoteImportPlan, NoteImportPlanInput, GenericNoteDefinition, NoteCreationPlanItem, AssignmentPlanItem, NoteImportSkip, NoteImportWarning } from "./types";

// ADR-018 п.3: 8 categories reuse an already-existing generic-named demo note (fruit/berry/citrus/
// dessert/spice/herbal/tropical/coffee); the remaining 16 have no such note today and are created new.
// `mint`/COOLING and `vanilla`/DESSERT already exist as *specific* notes under a different category -
// the new MINT/VANILLA category notes use a distinct slug to avoid colliding with them.
export const GENERIC_NOTE_DEFINITIONS: readonly GenericNoteDefinition[] = [
  { knowledgeCategory: "FRUIT", legacyCategory: "FRUIT", slug: "fruit", name: "fruit" },
  { knowledgeCategory: "BERRY", legacyCategory: "BERRY", slug: "berry", name: "berry" },
  { knowledgeCategory: "CITRUS", legacyCategory: "CITRUS", slug: "citrus", name: "citrus" },
  { knowledgeCategory: "DESSERT", legacyCategory: "DESSERT", slug: "dessert", name: "dessert" },
  { knowledgeCategory: "SPICE", legacyCategory: "SPICE", slug: "spice", name: "spice" },
  { knowledgeCategory: "HERBAL", legacyCategory: "HERBAL", slug: "herbal", name: "herbal" },
  { knowledgeCategory: "TROPICAL", legacyCategory: "TROPICAL", slug: "tropical", name: "tropical" },
  { knowledgeCategory: "COFFEE", legacyCategory: "COFFEE", slug: "coffee", name: "coffee" },
  { knowledgeCategory: "CREAMY", legacyCategory: "DAIRY", slug: "dairy", name: "dairy" },
  { knowledgeCategory: "CHOCOLATE", legacyCategory: "CHOCOLATE", slug: "chocolate", name: "chocolate" },
  { knowledgeCategory: "NUT", legacyCategory: "NUT", slug: "nut", name: "nut" },
  { knowledgeCategory: "FLORAL", legacyCategory: "FLORAL", slug: "floral", name: "floral" },
  { knowledgeCategory: "COOLING", legacyCategory: "COOLING", slug: "cooling", name: "cooling" },
  { knowledgeCategory: "SMOKY", legacyCategory: "SMOKY", slug: "smoky", name: "smoky" },
  { knowledgeCategory: "BEVERAGE", legacyCategory: "DRINK", slug: "drink", name: "drink" },
  { knowledgeCategory: "SOUR", legacyCategory: "SOUR", slug: "sour", name: "sour" },
  { knowledgeCategory: "CANDY", legacyCategory: "CANDY", slug: "candy", name: "candy" },
  { knowledgeCategory: "TEA", legacyCategory: "TEA", slug: "tea", name: "tea" },
  { knowledgeCategory: "FRESH", legacyCategory: "FRESH", slug: "fresh", name: "fresh" },
  { knowledgeCategory: "BAKERY", legacyCategory: "BAKERY", slug: "bakery", name: "bakery" },
  { knowledgeCategory: "ALCOHOL", legacyCategory: "ALCOHOL", slug: "alcohol", name: "alcohol" },
  { knowledgeCategory: "WOODY", legacyCategory: "WOODY", slug: "woody", name: "woody" },
  { knowledgeCategory: "MINT", legacyCategory: "MINT", slug: "mint-generic", name: "mint-generic" },
  { knowledgeCategory: "VANILLA", legacyCategory: "VANILLA", slug: "vanilla-generic", name: "vanilla-generic" },
];

const DEFINITION_BY_KNOWLEDGE_CATEGORY = new Map(GENERIC_NOTE_DEFINITIONS.map(definition => [definition.knowledgeCategory, definition]));

// ADR-018 п.3: every existing DOMINANT assignment in the database uses this exact intensity (17/17) -
// dominantNoteIds carries no per-note intensity of its own, only the fact that the category is dominant.
const DOMINANT_NOTE_TYPE = "DOMINANT" as const;
const DOMINANT_INTENSITY = 10;

export const buildNoteImportPlan = (input: NoteImportPlanInput): NoteImportPlan => {
  const notesToCreateBySlug = new Map<string, NoteCreationPlanItem>();
  const assignmentsToCreate: AssignmentPlanItem[] = [];
  const skipped: NoteImportSkip[] = [];
  const warnings: NoteImportWarning[] = [];
  let alreadyAssignedCount = 0;

  for (const product of input.products) {
    const flavor = input.existingFlavorByCanonicalProductId.get(product.canonicalProductId);
    if (!flavor) { skipped.push({ canonicalProductId: product.canonicalProductId, reason: "NO_FLAVOR_FOUND" }); continue; }
    if (flavor.catalogEntryType === "TEST") { skipped.push({ canonicalProductId: product.canonicalProductId, reason: "TEST_ENTRY" }); continue; }
    if (product.dominantNoteIds.length === 0) { skipped.push({ canonicalProductId: product.canonicalProductId, reason: "NO_DOMINANT_NOTES" }); continue; }

    const seenCategories = new Set<string>();
    for (const knowledgeCategory of product.dominantNoteIds) {
      if (seenCategories.has(knowledgeCategory)) continue;
      seenCategories.add(knowledgeCategory);

      const definition = DEFINITION_BY_KNOWLEDGE_CATEGORY.get(knowledgeCategory);
      if (!definition) {
        warnings.push({ canonicalProductId: product.canonicalProductId, message: `Категория "${knowledgeCategory}" не имеет generic-ноты в GENERIC_NOTE_DEFINITIONS - пропущена, требуется ручное решение.` });
        continue;
      }

      const existingNoteId = input.existingNoteIdBySlug.get(definition.slug);
      if (existingNoteId === undefined && !notesToCreateBySlug.has(definition.slug)) {
        notesToCreateBySlug.set(definition.slug, { slug: definition.slug, name: definition.name, category: definition.legacyCategory });
      }

      if (existingNoteId !== undefined && flavor.assignedNoteIds.includes(existingNoteId)) {
        alreadyAssignedCount += 1;
        continue;
      }

      assignmentsToCreate.push({
        canonicalProductId: product.canonicalProductId,
        flavorId: flavor.flavorId,
        manufacturer: product.manufacturer,
        displayName: product.displayName,
        knowledgeCategory,
        noteSlug: definition.slug,
        noteType: DOMINANT_NOTE_TYPE,
        intensity: DOMINANT_INTENSITY,
      });
    }
  }

  return { notesToCreate: [...notesToCreateBySlug.values()], assignmentsToCreate, alreadyAssignedCount, skipped, warnings };
};
