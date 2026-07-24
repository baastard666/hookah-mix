import { describe, expect, it } from "vitest";
import { getProductFlavorProfile } from "../product-flavor-profile";
import { GENERIC_NOTE_DEFINITIONS, buildNoteImportPlan } from "./build-note-import-plan";
import type { ExistingFlavorForNoteImport, ProductForNoteImport } from "./types";

const product = (overrides: Partial<ProductForNoteImport> = {}): ProductForNoteImport => ({
  canonicalProductId: "test-brand-flavor",
  manufacturer: "Test Brand",
  displayName: "Flavor",
  dominantNoteIds: ["FRUIT"],
  ...overrides,
});

const flavor = (overrides: Partial<ExistingFlavorForNoteImport> = {}): ExistingFlavorForNoteImport => ({
  flavorId: 1, catalogEntryType: "REAL", assignedNoteIds: [],
  ...overrides,
});

describe("GENERIC_NOTE_DEFINITIONS", () => {
  it("has exactly one definition per used category (24, matching the ADR-018 audit)", () => expect(GENERIC_NOTE_DEFINITIONS).toHaveLength(24));
  it("has unique slugs (FlavorNote.slug is globally unique in Prisma)", () => {
    const slugs = GENERIC_NOTE_DEFINITIONS.map(item => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("has unique knowledgeCategory keys (no category mapped twice)", () => {
    const categories = GENERIC_NOTE_DEFINITIONS.map(item => item.knowledgeCategory);
    expect(new Set(categories).size).toBe(categories.length);
  });
  it("does not reuse the 'mint'/'vanilla' slugs already taken by specific demo notes", () => {
    expect(GENERIC_NOTE_DEFINITIONS.some(item => item.slug === "mint")).toBe(false);
    expect(GENERIC_NOTE_DEFINITIONS.some(item => item.slug === "vanilla")).toBe(false);
  });
});

describe("buildNoteImportPlan - skip reasons", () => {
  it("skips a product with no matching Flavor row", () => {
    const plan = buildNoteImportPlan({ products: [product()], existingFlavorByCanonicalProductId: new Map(), existingNoteIdBySlug: new Map() });
    expect(plan.skipped).toEqual([{ canonicalProductId: "test-brand-flavor", reason: "NO_FLAVOR_FOUND" }]);
    expect(plan.assignmentsToCreate).toEqual([]);
  });
  it("skips a TEST catalogEntryType row without touching it", () => {
    const plan = buildNoteImportPlan({
      products: [product()],
      existingFlavorByCanonicalProductId: new Map([["test-brand-flavor", flavor({ catalogEntryType: "TEST" })]]),
      existingNoteIdBySlug: new Map(),
    });
    expect(plan.skipped).toEqual([{ canonicalProductId: "test-brand-flavor", reason: "TEST_ENTRY" }]);
  });
  it("skips a product with an empty dominantNoteIds list", () => {
    const plan = buildNoteImportPlan({
      products: [product({ dominantNoteIds: [] })],
      existingFlavorByCanonicalProductId: new Map([["test-brand-flavor", flavor()]]),
      existingNoteIdBySlug: new Map(),
    });
    expect(plan.skipped).toEqual([{ canonicalProductId: "test-brand-flavor", reason: "NO_DOMINANT_NOTES" }]);
  });
});

describe("buildNoteImportPlan - note creation and assignment", () => {
  it("plans creating a new generic note when the slug does not exist yet, plus an assignment", () => {
    const plan = buildNoteImportPlan({
      products: [product({ dominantNoteIds: ["FLORAL"] })],
      existingFlavorByCanonicalProductId: new Map([["test-brand-flavor", flavor()]]),
      existingNoteIdBySlug: new Map(),
    });
    expect(plan.notesToCreate).toEqual([{ slug: "floral", name: "floral", category: "FLORAL" }]);
    expect(plan.assignmentsToCreate).toEqual([{
      canonicalProductId: "test-brand-flavor", flavorId: 1, manufacturer: "Test Brand", displayName: "Flavor",
      knowledgeCategory: "FLORAL", noteSlug: "floral", noteType: "DOMINANT", intensity: 10,
    }]);
  });
  it("reuses an already-existing note instead of planning a duplicate creation", () => {
    const plan = buildNoteImportPlan({
      products: [product({ dominantNoteIds: ["FRUIT"] })],
      existingFlavorByCanonicalProductId: new Map([["test-brand-flavor", flavor()]]),
      existingNoteIdBySlug: new Map([["fruit", 58]]),
    });
    expect(plan.notesToCreate).toEqual([]);
    expect(plan.assignmentsToCreate).toEqual([expect.objectContaining({ noteSlug: "fruit" })]);
  });
  it("does not re-plan an assignment already present on the flavor (idempotent rerun)", () => {
    const plan = buildNoteImportPlan({
      products: [product({ dominantNoteIds: ["FRUIT"] })],
      existingFlavorByCanonicalProductId: new Map([["test-brand-flavor", flavor({ assignedNoteIds: [58] })]]),
      existingNoteIdBySlug: new Map([["fruit", 58]]),
    });
    expect(plan.assignmentsToCreate).toEqual([]);
    expect(plan.alreadyAssignedCount).toBe(1);
  });
  it("deduplicates a category listed twice in one product's dominantNoteIds", () => {
    const plan = buildNoteImportPlan({
      products: [product({ dominantNoteIds: ["FRUIT", "FRUIT"] })],
      existingFlavorByCanonicalProductId: new Map([["test-brand-flavor", flavor()]]),
      existingNoteIdBySlug: new Map(),
    });
    expect(plan.assignmentsToCreate).toHaveLength(1);
  });
  it("creates one shared note plan item even when two different products need the same category", () => {
    const plan = buildNoteImportPlan({
      products: [
        product({ canonicalProductId: "a", dominantNoteIds: ["FLORAL"] }),
        product({ canonicalProductId: "b", dominantNoteIds: ["FLORAL"] }),
      ],
      existingFlavorByCanonicalProductId: new Map([
        ["a", flavor({ flavorId: 1 })],
        ["b", flavor({ flavorId: 2 })],
      ]),
      existingNoteIdBySlug: new Map(),
    });
    expect(plan.notesToCreate).toEqual([{ slug: "floral", name: "floral", category: "FLORAL" }]);
    expect(plan.assignmentsToCreate).toHaveLength(2);
  });
  it("warns and skips a category with no generic-note definition (TOBACCO is a valid knowledge category, unused by the registry, deliberately not in GENERIC_NOTE_DEFINITIONS)", () => {
    const plan = buildNoteImportPlan({
      products: [product({ dominantNoteIds: ["TOBACCO"] })],
      existingFlavorByCanonicalProductId: new Map([["test-brand-flavor", flavor()]]),
      existingNoteIdBySlug: new Map(),
    });
    expect(plan.assignmentsToCreate).toEqual([]);
    expect(plan.warnings).toEqual([{ canonicalProductId: "test-brand-flavor", message: expect.stringContaining("TOBACCO") }]);
  });
});

describe("buildNoteImportPlan - real overdose-coffee data (ADR-018)", () => {
  it("reproduces the documented state: COFFEE already assigned, CREAMY needs a new dairy note", () => {
    const registryProfile = getProductFlavorProfile("overdose-coffee");
    expect(registryProfile).not.toBeNull();
    expect(registryProfile!.dominantNoteIds).toEqual(["COFFEE", "CREAMY"]);
    const plan = buildNoteImportPlan({
      products: [product({ canonicalProductId: "overdose-coffee", manufacturer: "Overdose", displayName: "Coffee", dominantNoteIds: registryProfile!.dominantNoteIds })],
      existingFlavorByCanonicalProductId: new Map([["overdose-coffee", flavor({ flavorId: 1, assignedNoteIds: [1, 2, 3, 4] })]]),
      existingNoteIdBySlug: new Map([["coffee", 1], ["roasted", 2], ["dark-chocolate", 3], ["dessert", 4]]),
    });
    expect(plan.alreadyAssignedCount).toBe(1);
    expect(plan.notesToCreate).toEqual([{ slug: "dairy", name: "dairy", category: "DAIRY" }]);
    expect(plan.assignmentsToCreate).toEqual([expect.objectContaining({ canonicalProductId: "overdose-coffee", knowledgeCategory: "CREAMY", noteSlug: "dairy" })]);
  });
});
