import { describe, expect, it } from "vitest";
import { MIX_SCORE_WEIGHTS } from "../canonical-mix-scoring";
import { FLAVOR_PROFILE_FIELDS, type FlavorProfile } from "../flavors/types";
import { calculateMixAnalysis } from "../mix-analysis";
import type { MixAnalysis } from "../mix-analyzer";
import type { CanonicalMixComponentInput } from "../canonical-mix-scoring";
import { buildMixResultPresentation, deduplicateRecommendations, localizeTasteTag } from ".";

const profile = (overrides: Partial<FlavorProfile> = {}): FlavorProfile => ({ ...Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, 5])) as FlavorProfile, ...overrides });
const component = (manufacturer: string, name: string, percentage: number, options: { line?: string | null; profile?: FlavorProfile; note?: string; category?: CanonicalMixComponentInput["notes"][number]["category"]; sourceProfileAvailable?: boolean } = {}): CanonicalMixComponentInput => ({
  flavorId: `${manufacturer}:${name}`, brandName: manufacturer, flavorName: name, flavorSlug: `${manufacturer}-${name}`.toLocaleLowerCase("ru-RU").replace(/[^\p{L}\p{N}]+/gu, "-"), percentage,
  profile: options.profile ?? profile(), notes: [{ noteId: `note:${name}`, noteName: options.note ?? name, noteSlug: (options.note ?? name).toLocaleLowerCase("ru-RU").replace(/[^\p{L}\p{N}]+/gu, "-"), category: options.category ?? "OTHER", intensity: 8, noteType: "DOMINANT" }],
  identity: { sourceComponentId: `${manufacturer}:${name}`, rawManufacturer: manufacturer, rawProductLine: options.line ?? null, rawProductName: name }, sourceProfileAvailable: options.sourceProfileAvailable,
});
const resolved = () => [component("BlackBurn", "Tic Tac", 50, { note: "mint", category: "COOLING" }), component("MustHave", "Клубничный сорбет", 50, { note: "dessert", category: "DESSERT" })];
const legacy = (overrides: Partial<MixAnalysis> = {}): MixAnalysis => ({ compatibilityScore: 8, strength: 5, sweetness: 5, acidity: 5, freshness: 5, creaminess: 5, bitterness: 5, dominantFlavor: "Тест", dominantNotes: [], backgroundNotes: [], conflicts: [], overheatingRisk: "низкий", description: "", proportionRecommendations: [], heatRecommendations: ["Текущий режим жара подходит."], ...overrides });
const present = (components = resolved(), smoke?: number | null, legacyOverrides: Partial<MixAnalysis> = {}) => buildMixResultPresentation({ analysis: calculateMixAnalysis({ components, verifiedSmokeScore: smoke }), legacyAnalysis: legacy(legacyOverrides), preparation: { bowlType: "фанел", coalCount: 3, warmupMinutes: 6 } });

describe("mix result public presentation", () => {
  it("1. labels the engine score as predicted", () => expect(present().predictedScore.title).toBe("Прогнозная оценка"));
  it("2. explains that a smoke score is absent", () => expect(present().verifiedSmoke).toMatchObject({ value: null, description: "Реальный покур ещё не добавлен." }));
  it("3. keeps a verified smoke score separate", () => expect(present(resolved(), 8.9).verifiedSmoke).toMatchObject({ title: "Оценка после покура", value: 8.9 }));
  it("4. exposes exactly six breakdown entries", () => expect(present().breakdown).toHaveLength(6));
  it("5. exposes the exact engine breakdown and weighted result", () => {
    const analysis = calculateMixAnalysis({ components: resolved() });
    const result = buildMixResultPresentation({ analysis, legacyAnalysis: legacy(), preparation: { bowlType: "фанел", coalCount: 3, warmupMinutes: 6 } });
    expect(Object.fromEntries(result.breakdown.map(item => [item.key, item.value]))).toEqual(analysis.scoring.scoreBreakdown);
    const weighted = Object.entries(MIX_SCORE_WEIGHTS).reduce((sum, [key, weight]) => sum + analysis.scoring.scoreBreakdown[key as keyof typeof analysis.scoring.scoreBreakdown] * weight, 0);
    expect(analysis.scoring.predictedQualityScore).toBe(Math.round((weighted + Number.EPSILON) * 10) / 10);
  });
  it("6. explains confidence from actual coverage", () => expect(present().confidence.summary).toContain("компонента распознаны точно"));
  it("7. explains data quality with at most three reasons", () => expect(present().dataQuality.reasons.length).toBeLessThanOrEqual(3));
  it("8. reports a fully resolved composition", () => expect(present().resolution).toMatchObject({ total: 2, resolved: 2, ambiguous: 0, unresolved: 0 }));
  it("9. reports an ambiguous component without guessing it", () => {
    const result = present([component("Sebero", "Vanilla", 50), resolved()[0]]);
    expect(result.resolution.ambiguous).toBe(1); expect(result.resolution.components.some(item => item.status.includes("несколько canonical-вариантов"))).toBe(true);
  });
  it("10. reports an unresolved component", () => {
    const result = present([component("не указан", "Освежающий мохито", 50), resolved()[0]]);
    expect(result.resolution.unresolved).toBe(1); expect(result.resolution.summary).toContain("требуют уточнения");
  });
  it("11. contains a public resolution summary", () => expect(present().resolution.summary).toContain("2 из 2"));
  it.each([["coffee", "кофе"], ["cream", "сливки"], ["roasted", "обжаренные ноты"], ["dessert", "десертные ноты"]])("12. localizes %s", (source, expected) => expect(localizeTasteTag(source)).toBe(expected));
  it("13. safely humanizes an unknown machine tag", () => expect(localizeTasteTag("green_apple-note")).toBe("green apple note"));
  it("14. gives every heat risk a reason and action", () => {
    const result = buildMixResultPresentation({ analysis: calculateMixAnalysis({ components: resolved() }), legacyAnalysis: legacy({ overheatingRisk: "высокий" }), preparation: { bowlType: "Cosmo Bowl Turkish", coalCount: 4, warmupMinutes: 8 } });
    expect(result.risks[0]).toMatchObject({ title: "Перегрев", level: "Высокий" }); expect(result.risks[0].reason).toContain("четыре угля"); expect(result.risks[0].recommendation).toContain("три угля");
  });
  it("15. omits the risk collection when no risks exist", () => {
    const analysis = calculateMixAnalysis({ components: resolved() });
    const safe = { ...analysis, compatibility: { ...analysis.compatibility, conflicts: [], warnings: [] } };
    const result = buildMixResultPresentation({ analysis: safe, legacyAnalysis: legacy(), preparation: { bowlType: "фанел", coalCount: 3, warmupMinutes: 6 } });
    expect(result.risks).toEqual([]);
  });
  it("16. deduplicates semantically identical recommendations", () => {
    const analysis = calculateMixAnalysis({ components: [component("BlackBurn", "Tic Tac", 80, { profile: profile({ intensity: 10, cooling: 10 }) }), component("MustHave", "Клубничный сорбет", 20)] });
    const visible = analysis.recommendations.recommendations.filter(item => !["PRESERVE_CURRENT_MIX", "INSUFFICIENT_DATA"].includes(item.type));
    expect(visible.length).toBeGreaterThan(0);
    expect(deduplicateRecommendations({ ...analysis.recommendations, recommendations: [...visible, visible[0]] })).toHaveLength(visible.length);
  });
  it("17. does not expose private tracing fields", () => {
    const serialized = JSON.stringify(present());
    for (const token of ["decisionId", "sourceRow", "debugReasons", "sourceRuleIds", "knowledgeClaimIds", "sourceUrl", "evidenceUrl", "author", "C:\\"]) expect(serialized).not.toContain(token);
  });
  it("18. never returns NaN or Infinity", () => expect(JSON.stringify(present())).not.toMatch(/NaN|Infinity/));
  it("19. is deterministic", () => expect(present()).toEqual(present()));
  it("20. changes its confidence explanation for uncertain identity", () => {
    const certain = present(); const uncertain = present([component("не указан", "Освежающий мохито", 50), resolved()[0]]);
    expect(uncertain.confidence.summary).not.toBe(certain.confidence.summary); expect(uncertain.confidence.summary).toContain("1 из 2");
  });
  it("21. does not return raw English taste tags in the public profile", () => {
    const result = present([component("BlackBurn", "Tic Tac", 50, { note: "coffee", category: "COFFEE" }), component("MustHave", "Клубничный сорбет", 50, { note: "cream", category: "DAIRY" })]);
    expect(result.profile.dominantNotes).toEqual(expect.arrayContaining(["кофе", "сливки"])); expect(JSON.stringify(result.profile)).not.toMatch(/\b(coffee|cream)\b/);
  });
});

const colaMint = (): CanonicalMixComponentInput[] => {
  const cola = component("Test Kitchen", "Cola", 80, { note: "cola", category: "DRINK", profile: profile({ intensity: 8, sweetness: 8, spiceLevel: 5, freshness: 4 }) });
  const mint = component("Element", "Мята", 20, { note: "mint", category: "COOLING", profile: profile({ intensity: 8, cooling: 9, freshness: 10, herbalLevel: 7 }) });
  return [
    { ...cola, catalogStatus: "FOUND", sourceProfileStatus: "DRAFT", profileCandidates: [{ type: "PRELIMINARY_PROFILE", profile: {}, reliabilityScore: 30, recommendedRole: "SUPPORT" }], notes: [...cola.notes, { noteId: "spice", noteName: "spice", noteSlug: "spice", category: "SPICE", intensity: 6, noteType: "SECONDARY" }] },
    { ...mint, catalogStatus: "FOUND", sourceProfileStatus: "DRAFT", notes: [...mint.notes, { noteId: "herbal", noteName: "herbal", noteSlug: "herbal", category: "HERBAL", intensity: 5, noteType: "SECONDARY" }] },
  ];
};

describe("v0.3.3 corrective public presentation", () => {
  const corrective = () => present(colaMint(), null, { overheatingRisk: "низкий", heatRecommendations: [] });
  it("22. distinguishes catalog presence from canonical resolution", () => expect(corrective().resolution.components[0]).toMatchObject({ catalogStatus: "Товар найден в каталоге", status: expect.stringContaining("canonical-сопоставление") }));
  it("23. shows preliminary profile separately", () => expect(corrective().resolution.components.every(item => item.profileStatus.includes("предварительный профиль"))).toBe(true));
  it("24. preserves cola and mint in the public profile", () => expect(corrective().profile.dominantNotes).toEqual(["кола", "мята"]));
  it("25. does not replace mint with spice", () => { const result = corrective(); expect(result.profile.summary).toContain("Кола + мята"); expect(result.profile.dominantNotes).not.toContain("специи"); });
  it("26. exposes an actual dominant/base role for the 80% component", () => expect(corrective().resolution.components[0].actualMixRole).toBe("основа и доминирующий компонент"));
  it("27. exposes mint as cooling support", () => expect(corrective().resolution.components[1].actualMixRole).toBe("поддержка и холодящий компонент"));
  it("27a. keeps the catalog role separate from the actual role", () => expect(corrective().resolution.components[0]).toMatchObject({ actualMixRole: "основа и доминирующий компонент", recommendedCatalogRole: "поддержка" }));
  it("28. labels the risk score as resistance", () => expect(corrective().breakdown.find(item => item.key === "risks")?.label).toBe("Устойчивость к рискам"));
  it("29. does not deny risks when a high flag exists", () => expect(corrective().breakdown.find(item => item.key === "risks")?.explanation).not.toContain("не выявлено"));
  it("30. groups dominance warnings into one public risk", () => expect(corrective().risks.filter(item => item.title.includes("доминирование"))).toHaveLength(1));
  it("31. accepted proposal is the minimal 80 to 75 change", () => expect(corrective().suggestedVariant?.components).toEqual(expect.arrayContaining([expect.objectContaining({ currentPercentage: 80, suggestedPercentage: 75 })])));
  it("32. accepted proposal has a deterministic rescore", () => { const result = corrective(); expect(result.proposalComparison?.proposed.predictedQualityScore).toBeGreaterThanOrEqual(result.proposalComparison?.current.predictedQualityScore ?? 10); expect(result).toEqual(corrective()); });
  it("33. low reliability uses honest precision", () => expect(corrective().profile.metrics.every(metric => metric.displayValue.startsWith("около"))).toBe(true));
  it("34. renames componentQuality", () => expect(corrective().breakdown.find(item => item.key === "componentQuality")?.label).toBe("Потенциал компонентов"));
  it("35. labels stored preparation parameters", () => expect(corrective().preparation.sourceLabel).toBe("Параметры исходного рецепта"));
  it("36. contains no raw internal taste tags", () => expect(JSON.stringify(corrective().profile)).not.toMatch(/\b(cola|mint|spice|herbal|cooling)\b/));
  it("37. builds a concise deterministic summary", () => { const result = corrective(); expect(result.summary.text).toContain("Test Kitchen Cola"); expect(result.summary.primaryAction).toContain("75%"); });
  it("38. keeps public output private", () => expect(JSON.stringify(corrective())).not.toMatch(/decisionId|sourceRow|debugReasons|sourceUrl|evidenceUrl|author|C:\\/));
  it("39. labels a real neutral fallback separately", () => { const fallback = component("Unknown", "Mystery", 50, { sourceProfileAvailable: false }); const result = present([fallback, resolved()[0]]); expect(result.resolution.components.some(item => item.profileStatus.includes("предварительный профиль"))).toBe(true); });
});
