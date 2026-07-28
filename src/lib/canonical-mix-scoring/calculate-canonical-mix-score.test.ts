import { describe, expect, it } from "vitest";
import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import type { FlavorProfile, FlavorProfileField } from "../flavors/types";
import type { MixCompatibilityResult } from "../mix-compatibility";
import { calculateCanonicalMixScore } from "./calculate-canonical-mix-score";
import type { EffectiveParameter, PreparedCanonicalComponent, PreparedCanonicalMix } from "./types";

// Minimal, hand-built fixtures that bypass prepareCanonicalMix/buildEffectiveTobaccoProfile on purpose:
// that resolver always cascades a null secondary field to a real fallback number (ADR-015 does not change
// that), so it can never actually exercise componentQuality()'s own null-handling. These fixtures put
// PreparedCanonicalComponent.profile directly under test.
const profile = (overrides: Partial<FlavorProfile> = {}): FlavorProfile => ({
  ...Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, 5])) as FlavorProfile,
  ...overrides,
});

const emptyCompatibility: MixCompatibilityResult = {
  compatibilityScore: 8,
  noteCompatibility: { score: 8, positiveFactors: [], warnings: [], appliedRules: [], conflicts: [] },
  profileBalance: { score: 8, positiveFactors: [], warnings: [], appliedRules: [], conflicts: [] },
  intensityBalance: { score: 8, positiveFactors: [], warnings: [], appliedRules: [], conflicts: [] },
  proportionBalance: { score: 8, positiveFactors: [], warnings: [], appliedRules: [], conflicts: [] },
  positiveFactors: [],
  warnings: [],
  conflicts: [],
  summaryTags: [],
  metadata: { calculationVersion: "mix-compatibility-v1", inputProfileVersion: "mix-profile-v1", positiveRuleCount: 0, warningCount: 0, conflictCount: 0 },
};

const component = (id: string, percentage: number, componentProfile: FlavorProfile): PreparedCanonicalComponent => {
  const parameters = Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, { value: componentProfile[field] ?? 0, source: "SOURCE_PROFILE", reliabilityScore: 80, profileId: id } as EffectiveParameter])) as Record<FlavorProfileField, EffectiveParameter>;
  return {
    flavorId: id, brandName: "Test", flavorName: id, flavorSlug: id, percentage, profile: componentProfile,
    notes: [{ noteId: `note:${id}`, noteName: id, noteSlug: id, category: "OTHER", intensity: 5, noteType: "DOMINANT" }],
    catalogStatus: "FOUND", profileStatus: "CONFIRMED",
    sourceComponentIds: [id],
    resolution: { status: "RESOLVED", decisionId: null, canonicalProductId: id, canonicalManufacturer: "Test", canonicalProductLine: null, canonicalProductName: id, matchedAlias: null, matchMethod: "CANONICAL_ID", confidence: "HIGH" },
    effectiveProfile: { profile: componentProfile, notes: [], strengthLevel5: 3, parameters, profileId: id, profileSource: "SOURCE_PROFILE", profileReliability: "HIGH", profileReliabilityScore: 80, usedFallback: false, recommendedRole: null, confirmedPercentageRange: null, provenance: [] },
    proportionConfirmed: true, independentEvidenceCount: 2,
  };
};

const scoreFor = (components: readonly PreparedCanonicalComponent[]): number | null => {
  const preparedMix: PreparedCanonicalMix = {
    components, warnings: [], rawComponentCount: components.length, effectiveComponentCount: components.length, totalPercentage: 100,
    componentResolutions: components.map(item => ({
      sourceComponentId: item.flavorId as string, percentage: item.percentage,
      rawIdentity: { manufacturer: item.brandName, productLine: null, productName: item.flavorName },
      normalizedIdentity: { manufacturer: item.brandName, productLine: "", productName: item.flavorName },
      resolution: item.resolution, sourceRow: null, debugReasons: [],
    })),
  };
  return calculateCanonicalMixScore({ preparedMix, compatibility: emptyCompatibility }).scoreBreakdown.componentQuality;
};

const allNull = (overrides: Partial<FlavorProfile> = {}): FlavorProfile => ({
  ...Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, null])) as FlavorProfile,
  ...overrides,
});

const fullScoreFor = (components: readonly PreparedCanonicalComponent[]) => {
  const preparedMix: PreparedCanonicalMix = {
    components, warnings: [], rawComponentCount: components.length, effectiveComponentCount: components.length, totalPercentage: 100,
    componentResolutions: components.map(item => ({
      sourceComponentId: item.flavorId as string, percentage: item.percentage,
      rawIdentity: { manufacturer: item.brandName, productLine: null, productName: item.flavorName },
      normalizedIdentity: { manufacturer: item.brandName, productLine: "", productName: item.flavorName },
      resolution: item.resolution, sourceRow: null, debugReasons: [],
    })),
  };
  return calculateCanonicalMixScore({ preparedMix, compatibility: emptyCompatibility });
};

describe("calculateCanonicalMixScore componentQuality (ADR-015)", () => {
  it("вычисляет обычное среднее из 5 слагаемых, когда все поля измерены", () => {
    // (naturalness=5 + persistence=5 + heatResistance=5 + juiciness=5 + (10-|intensity(5)-7|)=8) / 5 = 5.6
    const result = scoreFor([component("a", 50, profile()), component("b", 50, profile())]);
    expect(result).toBeCloseTo(5.6, 1);
  });

  it("исключает null naturalness/persistence из среднего вместо подстановки 0", () => {
    // При исключении naturalness/persistence остаются heatResistance=5, juiciness=5, (10-|5-7|)=8 -> (5+5+8)/3 = 6
    const withNulls = profile({ naturalness: null, persistence: null });
    const result = scoreFor([component("a", 50, withNulls), component("b", 50, withNulls)]);
    expect(result).toBeCloseTo(6, 1);
  });

  it("не даёт NaN и не путает частично null с полностью null", () => {
    const onlyNaturalnessNull = profile({ naturalness: null });
    const result = scoreFor([component("a", 100, onlyNaturalnessNull)]);
    // (persistence=5 + heatResistance=5 + juiciness=5 + (10-|5-7|)=8) / 4 = 5.75
    expect(result).toBeCloseTo(5.75, 1);
    expect(Number.isNaN(result)).toBe(false);
  });

  it("исключает компонент без единого измеренного поля из среднего по миксу, а не считает его нулём (ADR-023)", () => {
    // Компонент "b" целиком fallback: если бы он считался нулём, среднее было бы ниже реального (5+5+8)/5=5.6*0.5.
    const result = scoreFor([component("a", 50, profile()), component("b", 50, allNull())]);
    expect(result).toBeCloseTo(5.6, 1);
  });

  it("возвращает null, если ни один компонент не измерил ни одного поля (ADR-023)", () => {
    const result = scoreFor([component("a", 50, allNull()), component("b", 50, allNull())]);
    expect(result).toBeNull();
  });
});

describe("calculateCanonicalMixScore predictedQualityScore renormalization (ADR-023)", () => {
  it("исключает componentQuality из веса и перевешивает остальные, когда данных нет вовсе", () => {
    const withData = fullScoreFor([component("a", 50, profile()), component("b", 50, profile())]);
    const withoutData = fullScoreFor([component("a", 50, allNull()), component("b", 50, allNull())]);
    expect(withoutData.scoreBreakdown.componentQuality).toBeNull();
    expect(withoutData.scoreBreakdown.balance).toBeNull();
    // Все прочие компоненты одинаковы (compatibility/proportions/risks/confirmations из одного и того же
    // emptyCompatibility) - предсказанная оценка должна совпасть с их взвешенным средним без componentQuality/balance.
    const remaining = { compatibility: 8, proportions: 8, risks: 10, confirmations: withoutData.scoreBreakdown.confirmations };
    const weights = { compatibility: 0.25, proportions: 0.2, risks: 0.1, confirmations: 0.1 };
    const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
    const expected = Math.round(((remaining.compatibility * weights.compatibility + remaining.proportions * weights.proportions + remaining.risks * weights.risks + remaining.confirmations * weights.confirmations) / totalWeight + Number.EPSILON) * 10) / 10;
    expect(withoutData.scoreBreakdown.risks).toBe(10);
    expect(withoutData.scoreBreakdown.compatibility).toBe(8);
    expect(withoutData.scoreBreakdown.proportions).toBe(8);
    expect(withoutData.predictedQualityScore).toBeCloseTo(expected, 1);
    expect(withoutData.predictedQualityScore).not.toBe(withData.predictedQualityScore);
  });
});
