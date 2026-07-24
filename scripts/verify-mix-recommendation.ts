import type { FlavorNoteCategory, FlavorNoteType, FlavorProfile } from "../src/lib/flavors/types";
import { calculateMixCompatibility, resolveComponentIntensity } from "../src/lib/mix-compatibility";
import { calculateMixProfile, type MixProfileNoteInput } from "../src/lib/mix-profile";
import { calculateMixRecommendations, type RecommendationComponentInput } from "../src/lib/mix-recommendation";

const profile = (values: Partial<FlavorProfile> = {}): FlavorProfile => ({ sweetness: 5, acidity: 3, bitterness: 2, creaminess: 3, cooling: 0, strength: 5, intensity: 6, heatResistance: 7, dryness: 3, juiciness: 5, freshness: 5, dessertLevel: 3, spiceLevel: 0, floralLevel: 0, herbalLevel: 0, smokyLevel: 0, naturalness: 6, persistence: 6, ...values });
let noteId = 1;
const note = (slug: string, category: FlavorNoteCategory, intensity = 10, noteType: FlavorNoteType = "DOMINANT"): MixProfileNoteInput => ({ noteId: noteId++, noteName: slug, noteSlug: slug, category, intensity, noteType });
const component = (id: string, percentage: number, notes: MixProfileNoteInput[], values: Partial<FlavorProfile> = {}): RecommendationComponentInput => ({ flavorId: id, brandName: "Verify", flavorName: id, flavorSlug: id, percentage, profile: profile(values), notes });

const scenarios: ReadonlyArray<{ name: string; components: RecommendationComponentInput[] }> = [
  { name: "Berry 90 + Lavender 10", components: [component("berry", 90, [note("blueberry", "BERRY")], { intensity: 6 }), component("lavender", 10, [note("lavender", "FLORAL")], { intensity: 10, floralLevel: 10 })] },
  { name: "Berry 60 + Lavender 40", components: [component("berry", 60, [note("blueberry", "BERRY")], { intensity: 6 }), component("lavender", 40, [note("lavender", "FLORAL")], { intensity: 10, floralLevel: 10 })] },
  { name: "Coffee 60 + Cream 40", components: [component("coffee", 60, [note("coffee", "COFFEE")], { intensity: 6, bitterness: 4, dessertLevel: 5 }), component("cream", 40, [note("cream", "DAIRY")], { intensity: 5, sweetness: 6, creaminess: 9, dessertLevel: 8 })] },
  { name: "Coffee 50 + Citrus 50", components: [component("coffee", 50, [note("coffee", "COFFEE")], { intensity: 7, bitterness: 6 }), component("citrus", 50, [note("lemon", "CITRUS")], { intensity: 7, acidity: 7, freshness: 7 })] },
  { name: "Very sweet", components: [component("sweet", 70, [note("candy", "DESSERT")], { sweetness: 10, acidity: 1, freshness: 1 }), component("vanilla", 30, [note("vanilla", "DESSERT")], { sweetness: 8, acidity: 1, freshness: 1 })] },
  { name: "Very cooling", components: [component("mint", 60, [note("mint", "COOLING")], { intensity: 9, cooling: 10, freshness: 10 }), component("cold-fruit", 40, [note("fruit", "FRUIT")], { cooling: 10, freshness: 8 })] },
  { name: "Competing 50/50", components: [component("bright-a", 50, [note("fruit", "FRUIT")], { intensity: 9 }), component("bright-b", 50, [note("spice", "SPICE")], { intensity: 9 })] },
];

try {
  for (const scenario of scenarios) {
    const mixProfile = calculateMixProfile(scenario.components);
    const compatibility = calculateMixCompatibility({ mixProfile, componentIntensities: scenario.components.map(item => ({ flavorId: item.flavorId, intensity: resolveComponentIntensity(item.profile.intensity) })) });
    const result = calculateMixRecommendations({ components: scenario.components, mixProfile, compatibility });
    const variantTotal = result.summary.suggestedMixVariant?.components.reduce((sum, item) => sum + item.suggestedPercentage, 0);
    if (result.recommendations.length === 0 || (variantTotal !== undefined && variantTotal !== 100)) throw new Error(`Invalid recommendation result for ${scenario.name}`);
    console.log({
      scenario: scenario.name,
      status: result.status,
      recommendations: result.recommendations.map(item => ({ id: item.id, type: item.type, priority: item.priority, confidence: item.confidenceScore, action: item.action, reasonCodes: item.reasons.map(reason => reason.code) })),
      suggestedMixVariant: result.summary.suggestedMixVariant,
    });
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
