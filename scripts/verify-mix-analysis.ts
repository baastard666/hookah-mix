import type { FlavorNoteCategory, FlavorProfile } from "../src/lib/flavors/types";
import { calculateMixAnalysis } from "../src/lib/mix-analysis";
import type { RecommendationComponentInput } from "../src/lib/mix-recommendation";

const profile = (values: Partial<FlavorProfile> = {}): FlavorProfile => ({ sweetness: 5, acidity: 3, bitterness: 2, creaminess: 3, cooling: 0, strength: 5, intensity: 6, heatResistance: 7, dryness: 3, juiciness: 5, freshness: 5, dessertLevel: 3, spiceLevel: 0, floralLevel: 0, herbalLevel: 0, smokyLevel: 0, naturalness: 6, persistence: 6, ...values });
let noteId = 1;
const component = (id: string, percentage: number, slug: string, category: FlavorNoteCategory, values: Partial<FlavorProfile> = {}): RecommendationComponentInput => ({ flavorId: id, brandName: "Verify", flavorName: id, flavorSlug: id, percentage, profile: profile(values), notes: [{ noteId: noteId++, noteName: slug, noteSlug: slug, category, intensity: 10, noteType: "DOMINANT" }] });
const scenarios = [
  { name: "Berry 90 + Lavender 10", components: [component("berry", 90, "blueberry", "BERRY", { intensity: 6 }), component("lavender", 10, "lavender", "FLORAL", { intensity: 10, floralLevel: 10 })], check: (result: ReturnType<typeof calculateMixAnalysis>) => result.recommendations.status === "NO_CHANGES_NEEDED" && !result.recommendations.summary.suggestedMixVariant },
  { name: "Berry 60 + Lavender 40", components: [component("berry", 60, "blueberry", "BERRY", { intensity: 6 }), component("lavender", 40, "lavender", "FLORAL", { intensity: 10, floralLevel: 10 })], check: (result: ReturnType<typeof calculateMixAnalysis>) => result.recommendations.recommendations.some(item => item.type === "DECREASE_COMPONENT" && item.componentIds.includes("lavender") && item.action.type === "DECREASE_COMPONENT" && item.action.suggestedPercentageRange.max < 40) && result.recommendations.summary.suggestedMixVariant?.components.reduce((sum, item) => sum + item.suggestedPercentage, 0) === 100 },
  { name: "Coffee 60 + Cream 40", components: [component("coffee", 60, "coffee", "COFFEE", { intensity: 6 }), component("cream", 40, "cream", "DAIRY", { intensity: 5, creaminess: 9, dessertLevel: 8 })], check: (result: ReturnType<typeof calculateMixAnalysis>) => result.recommendations.status === "NO_CHANGES_NEEDED" },
  { name: "Coffee 50 + Citrus 50", components: [component("coffee", 50, "coffee", "COFFEE", { intensity: 7 }), component("citrus", 50, "lemon", "CITRUS", { intensity: 7, acidity: 7, freshness: 7 })], check: (result: ReturnType<typeof calculateMixAnalysis>) => result.summary.hasSignificantAdjustments && result.recommendations.recommendations.some(item => item.type === "DECREASE_COMPONENT" && item.componentIds.includes("citrus")) && !result.recommendations.recommendations.some(item => item.type === "REMOVE_COMPONENT") },
] as const;

try {
  for (const scenario of scenarios) {
    const result = calculateMixAnalysis({ components: scenario.components });
    if (!scenario.check(result)) throw new Error(`Analysis verification failed: ${scenario.name}`);
    console.log({ scenario: scenario.name, status: result.summary.status, compatibilityScore: result.compatibility.compatibilityScore, recommendations: result.recommendations.recommendations.map(item => item.type), suggestedVariant: result.recommendations.summary.suggestedMixVariant });
  }
} catch (error) { console.error(error); process.exitCode = 1; }
