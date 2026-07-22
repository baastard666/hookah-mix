import { describe, expect, it } from "vitest";
import type { FlavorNoteCategory as LegacyCategory, FlavorNoteType, FlavorProfile } from "../flavors/types";
import { validateKnowledgeRegistry, FLAVOR_KNOWLEDGE_REGISTRY } from "../flavor-knowledge";
import { calculateMixCompatibility } from "../mix-compatibility";
import { calculateMixProfile, type MixProfileNoteInput } from "../mix-profile";
import { calculateMixRecommendations, MixRecommendationInputError } from ".";
import type { MixRecommendationInput, RecommendationComponentInput } from ".";

const profile = (values: Partial<FlavorProfile> = {}): FlavorProfile => ({ sweetness: 5, acidity: 3, bitterness: 2, creaminess: 3, cooling: 0, strength: 5, intensity: 6, heatResistance: 7, dryness: 3, juiciness: 5, freshness: 5, dessertLevel: 3, spiceLevel: 0, floralLevel: 0, herbalLevel: 0, smokyLevel: 0, naturalness: 6, persistence: 6, ...values });
let noteSequence = 1;
const note = (slug: string, category: LegacyCategory, intensity = 10, noteType: FlavorNoteType = "DOMINANT"): MixProfileNoteInput => ({ noteId: `note-${noteSequence++}`, noteName: slug, noteSlug: slug, category, intensity, noteType });
const component = (id: string, percentage: number, notes: MixProfileNoteInput[], values: Partial<FlavorProfile> = {}, dataConfidenceScore?: number): RecommendationComponentInput => ({ flavorId: id, brandName: "Fixture", flavorName: id, flavorSlug: id, percentage, profile: profile(values), notes, dataConfidenceScore });
const input = (components: RecommendationComponentInput[]): MixRecommendationInput => {
  const mixProfile = calculateMixProfile(components);
  const compatibility = calculateMixCompatibility({ mixProfile, componentIntensities: components.map(item => ({ flavorId: item.flavorId, intensity: item.profile.intensity })) });
  return { components, mixProfile, compatibility };
};
const calculate = (components: RecommendationComponentInput[]) => calculateMixRecommendations(input(components));
const action = (result: ReturnType<typeof calculate>, type: string) => result.recommendations.find(item => item.type === type);
const reasons = (result: ReturnType<typeof calculate>) => result.recommendations.flatMap(item => item.reasons.map(reason => reason.code));

const berryLavender = (berryPercentage: number, lavenderPercentage: number) => [
  component("berry", berryPercentage, [note("blueberry", "BERRY")], { intensity: 6, sweetness: 6, acidity: 4, freshness: 6 }),
  component("lavender", lavenderPercentage, [note("lavender", "FLORAL")], { intensity: 10, floralLevel: 10, sweetness: 2 }),
];
const coffeeCream = () => [
  component("coffee", 60, [note("coffee", "COFFEE")], { intensity: 6, bitterness: 4, dessertLevel: 5, creaminess: 3 }),
  component("cream", 40, [note("cream", "DAIRY")], { intensity: 5, sweetness: 6, creaminess: 9, dessertLevel: 8 }),
];
const coffeeCitrus = () => [
  component("coffee", 50, [note("coffee", "COFFEE")], { intensity: 7, bitterness: 6 }),
  component("citrus", 50, [note("lemon", "CITRUS")], { intensity: 7, acidity: 7, freshness: 7 }),
];

describe("Recommendation Engine core scenarios", () => {
  it("1. Berry 90 + Lavender 10 does not force a lavender decrease", () => expect(calculate(berryLavender(90, 10)).recommendations.some(item => item.type === "DECREASE_COMPONENT" && item.componentIds.includes("lavender"))).toBe(false));
  it("2. Berry 90 + Lavender 10 treats lavender as a safe accent", () => expect(calculate(berryLavender(90, 10)).recommendations.some(item => item.action.type === "DECREASE_COMPONENT" && item.action.componentId === "lavender")).toBe(false));
  it("2a. Berry 90 + Lavender 10 does not require significant adjustment", () => expect(calculate(berryLavender(90, 10)).status).not.toBe("SIGNIFICANT_ADJUSTMENTS"));
  it("3. Berry 60 + Lavender 40 decreases lavender", () => expect(action(calculate(berryLavender(60, 40)), "DECREASE_COMPONENT")?.componentIds).toContain("lavender"));
  it("4. lavender decrease has HIGH priority", () => expect(action(calculate(berryLavender(60, 40)), "DECREASE_COMPONENT")?.priority).toBe("HIGH"));
  it("5. lavender range is below current percentage", () => {
    const recommendation = action(calculate(berryLavender(60, 40)), "DECREASE_COMPONENT");
    expect(recommendation?.action.type).toBe("DECREASE_COMPONENT");
    if (recommendation?.action.type === "DECREASE_COMPONENT") expect(recommendation.action.suggestedPercentageRange.max).toBeLessThan(40);
  });
  it("6. lavender uses DOMINANT_COMPONENT/FLORAL reason", () => expect(reasons(calculate(berryLavender(60, 40)))).toContain("FLORAL_OVERLOAD"));
  it("7. weak 3% component is increased or removed", () => {
    const result = calculate([component("base", 97, [note("berry", "BERRY")], { intensity: 7 }), component("weak", 3, [note("vanilla", "DESSERT")], { intensity: 3 })]);
    expect(result.recommendations.some(item => ["INCREASE_COMPONENT", "REMOVE_COMPONENT"].includes(item.type) && item.componentIds.includes("weak"))).toBe(true);
  });
  it("8. weak component is not increased and removed together", () => {
    const result = calculate([component("base", 97, [note("berry", "BERRY")]), component("weak", 3, [note("vanilla", "DESSERT")], { intensity: 3 })]);
    expect(result.recommendations.filter(item => item.componentIds.includes("weak") && ["INCREASE_COMPONENT", "REMOVE_COMPONENT"].includes(item.type))).toHaveLength(1);
  });
  it("9. two bright 50/50 components are rebalanced", () => {
    const result = calculate([component("a", 50, [note("a", "FRUIT")], { intensity: 9 }), component("b", 50, [note("b", "SPICE")], { intensity: 9 })]);
    expect(action(result, "REBALANCE_COMPONENTS")).toBeDefined(); expect(reasons(result)).toContain("MULTIPLE_COMPETING_BASES");
  });
  it("10. three equal components choose a clear base candidate", () => {
    const result = calculate([component("strong", 34, [note("coffee", "COFFEE")], { intensity: 9 }), component("mid", 33, [note("cream", "DAIRY")], { intensity: 5 }), component("light", 33, [note("vanilla", "DESSERT")], { intensity: 4 })]);
    const recommendation = action(result, "REBALANCE_COMPONENTS"); expect(recommendation?.action.type === "REBALANCE_COMPONENTS" && recommendation.action.primaryComponentId).toBe("strong");
  });
  it("11. equal ambiguous components have no artificial variant", () => {
    const result = calculate([component("a", 34, [note("a", "FRUIT")]), component("b", 33, [note("b", "FRUIT")]), component("c", 33, [note("c", "FRUIT")])]);
    expect(reasons(result)).toContain("NO_CLEAR_BASE"); expect(result.summary.suggestedMixVariant).toBeUndefined();
  });
  it("12. excessive sweetness decreases its main source", () => {
    const result = calculate([component("sweet", 70, [note("candy", "DESSERT")], { sweetness: 10, acidity: 1, freshness: 1, intensity: 7 }), component("soft", 30, [note("vanilla", "DESSERT")], { sweetness: 8, acidity: 1, freshness: 1 })]);
    expect(reasons(result)).toContain("EXCESSIVE_SWEETNESS"); expect(action(result, "DECREASE_COMPONENT")?.componentIds).toContain("sweet");
  });
  it("13. sweetness can add a safe contrast direction", () => {
    const result = calculate([component("sweet", 70, [note("candy", "DESSERT")], { sweetness: 10, acidity: 1, freshness: 1 }), component("soft", 30, [note("vanilla", "DESSERT")], { sweetness: 8, acidity: 1, freshness: 1 })]);
    expect(action(result, "ADD_NOTE_DIRECTION")?.categoryIds.some(id => ["SOUR", "CITRUS", "FRESH", "SPICE"].includes(id))).toBe(true);
  });
  it("14. extreme cooling decreases cooling source", () => {
    const result = calculate([component("mint", 60, [note("mint", "COOLING")], { cooling: 10, freshness: 10, intensity: 9 }), component("cold-fruit", 40, [note("fruit", "FRUIT")], { cooling: 10, freshness: 8 })]);
    expect(reasons(result)).toContain("EXCESSIVE_COOLING"); expect(action(result, "DECREASE_COMPONENT")?.componentIds).toContain("mint");
  });
  it("15. cooling overload never recommends MINT or COOLING", () => {
    const result = calculate([component("mint", 60, [note("mint", "COOLING")], { cooling: 10, intensity: 9 }), component("cold", 40, [note("fruit", "FRUIT")], { cooling: 10 })]);
    expect(result.recommendations.filter(item => item.type === "ADD_NOTE_DIRECTION").flatMap(item => item.categoryIds)).not.toEqual(expect.arrayContaining(["MINT", "COOLING"]));
  });
  it("16. floral overload suggests ACCENT role", () => {
    const recommendation = action(calculate(berryLavender(60, 40)), "DECREASE_COMPONENT");
    expect(recommendation?.action.type === "DECREASE_COMPONENT" && recommendation.action.suggestedRole).toBe("ACCENT");
  });
  it("17. bitter-sour conflict returns a recommendation", () => {
    const result = calculate([component("bitter", 50, [note("coffee", "COFFEE")], { bitterness: 8, acidity: 8, dryness: 5 }), component("sour", 50, [note("lemon", "CITRUS")], { bitterness: 8, acidity: 8 })]);
    expect(reasons(result)).toContain("BITTER_SOUR_CONFLICT");
  });
  it("18. bitter-sour softening avoids risky CREAMY", () => {
    const result = calculate([component("bitter", 50, [note("coffee", "COFFEE")], { bitterness: 8, acidity: 8 }), component("sour", 50, [note("lemon", "CITRUS")], { bitterness: 8, acidity: 8 })]);
    const directions = result.recommendations.filter(item => item.type === "ADD_NOTE_DIRECTION").flatMap(item => item.categoryIds); expect(directions).not.toContain("CREAMY");
  });
  it("19. excessive dryness proposes softening", () => {
    const result = calculate([component("dry", 60, [note("smoke", "SMOKY")], { dryness: 9, bitterness: 8 }), component("dry2", 40, [note("wood", "SMOKY")], { dryness: 8, bitterness: 8 })]);
    expect(reasons(result)).toContain("EXCESSIVE_DRYNESS"); expect(result.recommendations.some(item => item.type === "ADD_NOTE_DIRECTION" && item.categoryIds.some(id => ["CREAMY", "FRUIT", "FRESH"].includes(id)))).toBe(true);
  });
  it("20. balanced Coffee + Cream is preserved", () => {
    const result = calculate(coffeeCream()); expect(result.status).toBe("NO_CHANGES_NEEDED"); expect(action(result, "PRESERVE_CURRENT_MIX")).toBeDefined();
  });
  it("21. balanced mix has no invented decrease", () => expect(action(calculate(coffeeCream()), "DECREASE_COMPONENT")).toBeUndefined());
  it("22. Coffee + Citrus recommendation links knowledge rule", () => {
    const result = calculate(coffeeCitrus()); expect(result.recommendations.some(item => item.sourceRuleIds.includes("category.coffee-citrus"))).toBe(true);
  });
  it("23. Coffee + Citrus does not force removal", () => expect(action(calculate(coffeeCitrus()), "REMOVE_COMPONENT")).toBeUndefined());
  it("24. Smoky mix is never advised to add CANDY", () => {
    const result = calculate([component("dry", 60, [note("smoke", "SMOKY")], { dryness: 9, bitterness: 8 }), component("wood", 40, [note("wood", "SMOKY")], { dryness: 8, bitterness: 8 })]);
    expect(result.recommendations.flatMap(item => item.categoryIds)).not.toContain("CANDY");
  });
  it("25. low source confidence returns INSUFFICIENT_DATA", () => {
    const components = coffeeCream().map(item => ({ ...item, dataConfidenceScore: 10 })); const result = calculate(components); expect(result.status).toBe("INSUFFICIENT_DATA"); expect(action(result, "INSUFFICIENT_DATA")).toBeDefined();
  });
  it("26. low source confidence lowers recommendation confidence", () => {
    const high = calculate(berryLavender(60, 40)); const low = calculate(berryLavender(60, 40).map(item => ({ ...item, dataConfidenceScore: 35 }))); expect(low.recommendations[0].confidenceScore).toBeLessThan(high.recommendations[0].confidenceScore);
  });
});

describe("Recommendation validation and invariants", () => {
  it("27. empty input is controlled", () => expect(() => calculateMixRecommendations({ components: [], mixProfile: {} as MixRecommendationInput["mixProfile"], compatibility: {} as MixRecommendationInput["compatibility"] })).toThrow(MixRecommendationInputError));
  it("28. one component is rejected", () => {
    const valid = input(coffeeCream()); expect(() => calculateMixRecommendations({ ...valid, components: [valid.components[0]] })).toThrow(MixRecommendationInputError);
  });
  it("29. invalid total is rejected", () => {
    const valid = input(coffeeCream()); const components = valid.components.map((item, index) => ({ ...item, percentage: index ? 30 : 60 })); expect(() => calculateMixRecommendations({ ...valid, components })).toThrow(MixRecommendationInputError);
  });
  it("30. suggested variant totals 100", () => {
    const variant = calculate(berryLavender(60, 40)).summary.suggestedMixVariant; expect(variant?.components.reduce((sum, item) => sum + item.suggestedPercentage, 0)).toBe(100); expect(variant?.totalPercentage).toBe(100);
  });
  it("31. suggested variant has no negative percentage", () => expect(calculate(berryLavender(60, 40)).summary.suggestedMixVariant?.components.every(item => item.suggestedPercentage > 0)).toBe(true));
  it("32. maximum five recommendations", () => {
    const result = calculate([component("extreme", 60, [note("coffee", "COFFEE")], { sweetness: 10, acidity: 8, bitterness: 9, cooling: 10, dryness: 9, freshness: 1, intensity: 10 }), component("citrus", 40, [note("lemon", "CITRUS")], { sweetness: 9, acidity: 8, bitterness: 8, cooling: 10, dryness: 8, freshness: 1, intensity: 9 })]); expect(result.recommendations.length).toBeLessThanOrEqual(5);
  });
  it("33. recommendation IDs are unique", () => {
    const result = calculate(berryLavender(60, 40)); expect(new Set(result.recommendations.map(item => item.id)).size).toBe(result.recommendations.length);
  });
  it("34. no contradictory actions for a component", () => {
    const result = calculate([component("base", 97, [note("base", "FRUIT")]), component("weak", 3, [note("weak", "DESSERT")], { intensity: 3 })]); const actions = result.recommendations.filter(item => item.componentIds.includes("weak") && ["INCREASE_COMPONENT", "DECREASE_COMPONENT", "REMOVE_COMPONENT"].includes(item.type)); expect(actions.length).toBeLessThanOrEqual(1);
  });
  it("35. component order does not change result", () => {
    const components = berryLavender(60, 40); expect(calculate(components)).toEqual(calculate([...components].reverse()));
  });
  it("36. identical input is deterministic", () => {
    const value = input(coffeeCitrus()); expect(calculateMixRecommendations(value)).toEqual(calculateMixRecommendations(value));
  });
  it("37. input is not mutated", () => {
    const value = input(berryLavender(60, 40)); const snapshot = structuredClone(value); calculateMixRecommendations(value); expect(value).toEqual(snapshot);
  });
  it("38. all confidence and impact scores are in 0..100", () => {
    const result = calculate(berryLavender(60, 40)); expect(result.recommendations.every(item => item.confidenceScore >= 0 && item.confidenceScore <= 100 && item.impactScore >= 0 && item.impactScore <= 100)).toBe(true);
  });
  it("39. Mix Profile result is unchanged", () => {
    const value = input(coffeeCream()); const snapshot = structuredClone(value.mixProfile); calculateMixRecommendations(value); expect(value.mixProfile).toEqual(snapshot);
  });
  it("40. Compatibility score is unchanged", () => {
    const value = input(coffeeCitrus()); const score = value.compatibility.compatibilityScore; calculateMixRecommendations(value); expect(value.compatibility.compatibilityScore).toBe(score);
  });
  it("41. Knowledge Registry remains valid", () => expect(validateKnowledgeRegistry(FLAVOR_KNOWLEDGE_REGISTRY).success).toBe(true));
  it("42. result exposes stable version", () => expect(calculate(coffeeCream()).version).toBe("mix-recommendation-v1"));
  it("43. chooses the nearest decrease boundary instead of the midpoint", () => {
    const result = calculate([component("cola", 80, [note("cola", "DRINK")], { intensity: 8 }), component("mint", 20, [note("mint", "COOLING")], { intensity: 8, cooling: 9 })]);
    expect(result.summary.suggestedMixVariant?.components).toEqual(expect.arrayContaining([expect.objectContaining({ componentId: "cola", currentPercentage: 80, suggestedPercentage: 75 })]));
  });
});
