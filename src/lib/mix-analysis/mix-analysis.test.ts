import { describe, expect, it } from "vitest";
import type { FlavorNoteCategory, FlavorProfile } from "../flavors/types";
import { calculateMixCompatibility } from "../mix-compatibility";
import { calculateMixProfile } from "../mix-profile";
import type { RecommendationComponentInput } from "../mix-recommendation";
import { calculateMixRecommendations } from "../mix-recommendation";
import { calculateMixAnalysis } from ".";

const profile = (values: Partial<FlavorProfile> = {}): FlavorProfile => ({ sweetness: 5, acidity: 3, bitterness: 2, creaminess: 3, cooling: 0, strength: 5, intensity: 6, heatResistance: 7, dryness: 3, juiciness: 5, freshness: 5, dessertLevel: 3, spiceLevel: 0, floralLevel: 0, herbalLevel: 0, smokyLevel: 0, naturalness: 6, persistence: 6, ...values });
let id = 1;
const component = (flavorId: string, percentage: number, slug: string, category: FlavorNoteCategory, values: Partial<FlavorProfile> = {}, dataConfidenceScore?: number): RecommendationComponentInput => ({ flavorId, brandName: "Test", flavorName: flavorId, flavorSlug: flavorId, percentage, profile: profile(values), notes: [{ noteId: id++, noteName: slug, noteSlug: slug, category, intensity: 10, noteType: "DOMINANT" }], dataConfidenceScore });
const analyze = (components: RecommendationComponentInput[]) => calculateMixAnalysis({ components });
const berryLavender = (berry: number, lavender: number) => [component("berry", berry, "blueberry", "BERRY", { intensity: 6 }), component("lavender", lavender, "lavender", "FLORAL", { intensity: 10, floralLevel: 10 })];
const coffeeCream = () => [component("coffee", 60, "coffee", "COFFEE", { intensity: 6, bitterness: 4 }), component("cream", 40, "cream", "DAIRY", { intensity: 5, creaminess: 9, dessertLevel: 8 })];
const coffeeCitrus = () => [component("coffee", 50, "coffee", "COFFEE", { intensity: 7 }), component("citrus", 50, "lemon", "CITRUS", { intensity: 7, acidity: 7, freshness: 7 })];
const colaMint = () => [component("cola", 80, "cola", "DRINK", { intensity: 8, sweetness: 8, spiceLevel: 5 }), component("mint", 20, "mint", "COOLING", { intensity: 8, cooling: 9, freshness: 10, herbalLevel: 7 })];

describe("Mix Analysis Service", () => {
  it("1. builds the complete pipeline", () => expect(analyze(coffeeCream())).toMatchObject({ mixProfile: { metadata: { calculationVersion: "mix-profile-v1" } }, compatibility: { metadata: { calculationVersion: "mix-compatibility-v1" } }, recommendations: { version: "mix-recommendation-v1" } }));
  it("2. passes the exact calculated profile onward", () => { const components = coffeeCream(); const result = analyze(components); expect(result.mixProfile).toEqual(calculateMixProfile(components)); });
  it("3. preserves Compatibility result", () => { const components = coffeeCitrus(); const result = analyze(components); expect(result.compatibility).toEqual(calculateMixCompatibility({ mixProfile: result.mixProfile, componentIntensities: components.map(item => ({ flavorId: item.flavorId, intensity: item.profile.intensity })) })); });
  it("4. preserves Recommendation result", () => { const components = coffeeCitrus(); const result = analyze(components); expect(result.recommendations).toEqual(calculateMixRecommendations({ components, mixProfile: result.mixProfile, compatibility: result.compatibility })); });
  it("5. does not mutate input", () => { const components = berryLavender(60, 40); const snapshot = structuredClone(components); analyze(components); expect(components).toEqual(snapshot); });
  it("6. is deterministic", () => { const components = coffeeCitrus(); expect(analyze(components)).toEqual(analyze(components)); });
  it("7. returns no changes for Berry 90/Lavender 10", () => { const result = analyze(berryLavender(90, 10)); expect(result.summary.status).toBe("NO_CHANGES_NEEDED"); expect(result.summary.hasSuggestedMixVariant).toBe(false); });
  it("8. returns significant adjustment for Berry 60/Lavender 40", () => { const result = analyze(berryLavender(60, 40)); expect(result.summary.hasSignificantAdjustments).toBe(true); expect(result.recommendations.recommendations.some(item => item.type === "DECREASE_COMPONENT" && item.componentIds.includes("lavender"))).toBe(true); });
  it("9. propagates INSUFFICIENT_DATA", () => expect(analyze(coffeeCream().map(item => ({ ...item, dataConfidenceScore: 10 }))).summary.status).toBe("INSUFFICIENT_DATA"));
  it("10. preserves absence of suggested variant", () => expect(analyze(coffeeCream()).recommendations.summary.suggestedMixVariant).toBeUndefined());
  it("11. exposes suggested variant", () => expect(analyze(berryLavender(60, 40)).recommendations.summary.suggestedMixVariant).toBeDefined());
  it("12. suggested variant totals 100", () => expect(analyze(berryLavender(60, 40)).recommendations.summary.suggestedMixVariant?.components.reduce((sum, item) => sum + item.suggestedPercentage, 0)).toBe(100));
  it("13. recommendation limit remains five", () => expect(analyze(berryLavender(60, 40)).recommendations.recommendations.length).toBeLessThanOrEqual(5));
  it("14. summary mirrors Recommendation Engine", () => { const result = analyze(coffeeCitrus()); expect(result.summary.recommendationCount).toBe(result.recommendations.recommendations.length); expect(result.summary.status).toBe(result.recommendations.status); });
  it("15. rescoring evaluates a proposed mix", () => expect(analyze(colaMint()).proposalComparison).toBeDefined());
  it("16. accepted proposal reduces the target risk", () => expect(analyze(colaMint()).proposalComparison).toMatchObject({ accepted: true, targetRiskReduced: true }));
  it("17. accepted proposal totals 100", () => expect(analyze(colaMint()).proposalComparison?.variant.components.reduce((sum, item) => sum + item.suggestedPercentage, 0)).toBe(100));
  it("18. proposal uses the same input confidence", () => { const result = analyze(colaMint()); expect(result.proposalComparison?.proposed.predictionConfidenceScore).toBe(result.proposalComparison?.current.predictionConfidenceScore); });
  it("19. proposal comparison is deterministic", () => expect(analyze(colaMint()).proposalComparison).toEqual(analyze(colaMint()).proposalComparison));
  it("20. rejected proposals carry a reason", () => { const result = analyze(berryLavender(60, 40)); if (result.proposalComparison && !result.proposalComparison.accepted) expect(result.proposalComparison.rejectionReasons.length).toBeGreaterThan(0); else expect(result.proposalComparison).toBeDefined(); });
});
