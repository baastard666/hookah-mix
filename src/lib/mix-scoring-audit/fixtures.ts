import type { CanonicalMixComponentInput } from "../canonical-mix-scoring";
import { FLAVOR_PROFILE_FIELDS, type FlavorNoteCategory, type FlavorProfile } from "../flavors/types";
import type { GoldSetScenario } from "./types";

const emptyProfile = (): FlavorProfile => Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, null])) as FlavorProfile;
const measuredProfile = (values: Partial<FlavorProfile>): FlavorProfile => ({ ...Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, 5])) as FlavorProfile, ...values });
const note = (slug: string, category: FlavorNoteCategory) => ({ noteId: `gold:${slug}`, noteName: slug, noteSlug: slug, category, intensity: 10, noteType: "DOMINANT" as const });

// These are semantic fixtures only. Their numeric values are controlled inputs for engine invariants,
// never claims about a real product and never observed smoke ratings.
const component = (id: string, percentage: number, category: FlavorNoteCategory, profile: FlavorProfile, options: { manufacturer?: string; product?: string; canonicalProductId?: string; reliability?: number } = {}): CanonicalMixComponentInput => ({
  flavorId: id,
  brandName: options.manufacturer ?? "Gold Set",
  flavorName: options.product ?? id,
  flavorSlug: id,
  percentage,
  profile,
  notes: [note(id, category)],
  sourceProfileAvailable: true,
  sourceProfileReliabilityScore: options.reliability ?? 90,
  identity: options.canonicalProductId ? {
    sourceComponentId: id,
    rawManufacturer: options.manufacturer ?? "Gold Set",
    rawProductLine: null,
    rawProductName: options.product ?? id,
    canonicalProductId: options.canonicalProductId,
  } : undefined,
});

const jent = (id: "nastoika" | "currant" | "grape", percentage: number): CanonicalMixComponentInput => {
  const definitions = {
    nastoika: { product: "Настойка Заморская", line: "Alcohol", canonicalProductId: "jent-alcohol-nastoika-zamorskaya", notes: [note("citrus", "CITRUS"), note("herbal", "HERBAL"), note("berry", "BERRY"), note("alcohol", "ALCOHOL")] },
    currant: { product: "Currant WOW", line: "Classic", canonicalProductId: "jent-classic-currant-wow", notes: [note("currant", "BERRY"), note("sour", "SOUR")] },
    grape: { product: "Grape Me", line: "Classic", canonicalProductId: "jent-classic-grape-me", notes: [note("grape", "FRUIT"), note("mint", "MINT")] },
  } as const;
  const item = definitions[id];
  return {
    flavorId: item.canonicalProductId,
    brandName: "JENT",
    flavorName: item.product,
    flavorSlug: item.canonicalProductId,
    percentage,
    profile: emptyProfile(),
    notes: [...item.notes],
    sourceProfileAvailable: true,
    sourceProfileReliabilityScore: 60,
    identity: { sourceComponentId: `gold:${id}`, rawManufacturer: "JENT", rawProductLine: item.line, rawProductName: item.product, canonicalProductId: item.canonicalProductId },
  };
};

const richCoffee = (percentage: number) => component("rich-coffee", percentage, "COFFEE", measuredProfile({ sweetness: 3, acidity: 2, bitterness: 6, creaminess: 2, cooling: 0, freshness: 3, juiciness: 4, intensity: 7, heatResistance: 7 }), { manufacturer: "BlackBurn", product: "Tic Tac", canonicalProductId: "blackburn-tic-tac" });
const richCream = (percentage: number) => component("rich-cream", percentage, "DAIRY", measuredProfile({ sweetness: 7, acidity: 2, bitterness: 1, creaminess: 9, cooling: 0, freshness: 3, juiciness: 6, intensity: 5, heatResistance: 7 }), { manufacturer: "MustHave", product: "Sorbetto", canonicalProductId: "musthave-sorbetto" });

export const GOLD_SET_V1_SCENARIOS: readonly GoldSetScenario[] = [
  { id: "rich-compatible", title: "Rich-data compatible", scenarioClass: "RICH_COMPATIBLE", components: [richCoffee(55), richCream(45)] },
  { id: "rich-risky", title: "Rich-data risky", scenarioClass: "RICH_RISKY", components: [component("risky-coffee", 50, "COFFEE", measuredProfile({ cooling: 0, acidity: 8, bitterness: 8, intensity: 9 }), { manufacturer: "BlackBurn", product: "Tic Tac", canonicalProductId: "blackburn-tic-tac" }), component("risky-citrus", 50, "CITRUS", measuredProfile({ cooling: 0, acidity: 9, bitterness: 7, intensity: 9 }), { manufacturer: "MustHave", product: "Sorbetto", canonicalProductId: "musthave-sorbetto" })] },
  { id: "jent-nastoika-currant", title: "JENT: Настойка Заморская 40 + Currant WOW 60", scenarioClass: "SPARSE_COMPATIBLE", components: [jent("nastoika", 40), jent("currant", 60)] },
  { id: "jent-grape-currant", title: "JENT: Grape Me 40 + Currant WOW 60", scenarioClass: "SPARSE_COMPATIBLE", components: [jent("grape", 40), jent("currant", 60)] },
  { id: "sparse-no-relation", title: "Sparse exact identity without category relation", scenarioClass: "SPARSE_NO_RELATION", components: [jent("nastoika", 50), component("sparse-other", 50, "OTHER", emptyProfile(), { manufacturer: "MustHave", product: "Sorbetto", canonicalProductId: "musthave-sorbetto", reliability: 60 })] },
  { id: "mixed-coverage", title: "Mixed profile coverage", scenarioClass: "MIXED_COVERAGE", components: [richCream(60), jent("currant", 40)] },
  { id: "all-null-sensory", title: "All-null sensory fields", scenarioClass: "ALL_NULL", components: [jent("nastoika", 50), jent("currant", 50)] },
  { id: "measured-low", title: "Measured low values", scenarioClass: "LOW_MEASURED", components: [component("low-a", 50, "OTHER", measuredProfile({ sweetness: 2, acidity: 2, bitterness: 2, creaminess: 2, cooling: 2, freshness: 2, juiciness: 2 })), component("low-b", 50, "OTHER", measuredProfile({ sweetness: 2, acidity: 2, bitterness: 2, creaminess: 2, cooling: 2, freshness: 2, juiciness: 2 }))] },
  { id: "measured-extreme", title: "Measured extreme values", scenarioClass: "EXTREME_MEASURED", components: [component("extreme-a", 50, "FLORAL", measuredProfile({ floralLevel: 9, spiceLevel: 9, intensity: 9 })), component("extreme-b", 50, "SPICE", measuredProfile({ floralLevel: 9, spiceLevel: 9, intensity: 9 }))] },
  { id: "small-percentage", title: "Small percentage component", scenarioClass: "SMALL_PERCENTAGE", components: [richCream(95), component("small-accent", 5, "FLORAL", measuredProfile({ intensity: 3, floralLevel: 6 }))] },
  { id: "dominant-bright", title: "Dominant bright component", scenarioClass: "DOMINANT_COMPONENT", components: [component("dominant-bright", 80, "FRUIT", measuredProfile({ intensity: 10, sweetness: 8 })), richCream(20)] },
  { id: "equal-bright", title: "Equal bright components", scenarioClass: "EQUAL_BRIGHT", components: [component("equal-a", 50, "FRUIT", measuredProfile({ intensity: 9 })), component("equal-b", 50, "CITRUS", measuredProfile({ intensity: 9, acidity: 7 }))] },
  { id: "known-conflict", title: "Known category conflict", scenarioClass: "KNOWN_CONFLICT", components: [component("conflict-coffee", 50, "COFFEE", measuredProfile({ intensity: 7 })), component("conflict-cooling", 50, "COOLING", measuredProfile({ cooling: 9, intensity: 7 }))] },
  { id: "sparse-no-known-conflict", title: "No known conflict under sparse evidence", scenarioClass: "NO_KNOWN_CONFLICT", components: [jent("currant", 50), component("sparse-neutral", 50, "OTHER", emptyProfile(), { reliability: 60 })] },
  // The four variants retain the same two exact JENT identities. Only the available evidence is removed,
  // so the counterfactual isolates evidence semantics instead of conflating it with identity coverage.
  { id: "counterfactual-full", title: "Counterfactual full evidence", scenarioClass: "COUNTERFACTUAL", counterfactualGroup: "evidence-removal", components: [{ ...jent("nastoika", 50), profile: measuredProfile({ sweetness: 4, acidity: 6, bitterness: 2, creaminess: 2, cooling: 1, freshness: 6, juiciness: 7, intensity: 7, heatResistance: 7 }) }, { ...jent("currant", 50), profile: measuredProfile({ sweetness: 6, acidity: 7, bitterness: 2, creaminess: 1, cooling: 1, freshness: 6, juiciness: 7, intensity: 6, heatResistance: 7 }) }] },
  { id: "counterfactual-partial", title: "Counterfactual partial evidence", scenarioClass: "COUNTERFACTUAL", counterfactualGroup: "evidence-removal", components: [{ ...jent("nastoika", 50), profile: { ...emptyProfile(), intensity: 7 } }, { ...jent("currant", 50), profile: { ...emptyProfile(), intensity: 6 } }] },
  { id: "counterfactual-categories", title: "Counterfactual categories only", scenarioClass: "COUNTERFACTUAL", counterfactualGroup: "evidence-removal", components: [jent("nastoika", 50), jent("currant", 50)] },
  { id: "counterfactual-identity", title: "Counterfactual identity only", scenarioClass: "COUNTERFACTUAL", counterfactualGroup: "evidence-removal", components: [{ ...jent("nastoika", 50), notes: [], sourceProfileAvailable: false }, { ...jent("currant", 50), notes: [], sourceProfileAvailable: false }] },
];
