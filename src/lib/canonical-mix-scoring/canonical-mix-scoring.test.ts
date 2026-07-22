import { describe, expect, it } from "vitest";
import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import type { FlavorProfile } from "../flavors/types";
import { createSyntheticExpertMixWorkbookBuffer, importExpertMixKnowledgeBuffer } from "../expert-mix-knowledge-import";
import { calculateMixAnalysis } from "../mix-analysis";
import {
  auditTobaccoIdentityDecisions,
  P0_IDENTITY_DECISIONS_BATCH_1,
  P0_IDENTITY_DECISIONS_BATCH_2,
  P0_IDENTITY_DECISIONS_BATCH_3,
  P0_IDENTITY_DECISIONS_BATCH_4,
  P0_IDENTITY_DECISIONS_BATCH_5,
  P0_IDENTITY_DECISIONS_BATCH_6,
  P1_IDENTITY_DECISIONS_BATCH_1,
  TOBACCO_IDENTITY_DECISIONS,
} from "../tobacco-identity-decisions";
import { buildEffectiveTobaccoProfile } from "./build-effective-tobacco-profile";
import { calculateMixConfidence } from "./calculate-mix-confidence";
import { prepareCanonicalMix } from "./prepare-canonical-mix";
import { resolveMixComponentIdentity } from "./resolve-mix-component-identity";
import { toPublicCanonicalMixScoringResult } from "./public-mapper";
import type { CanonicalMixComponentInput, EffectiveProfileCandidate } from "./types";
import { createCanonicalMixScoringAudit } from "./workbook-audit";

const profile = (overrides: Partial<FlavorProfile> = {}): FlavorProfile => ({
  ...Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, 5])) as FlavorProfile,
  ...overrides,
});

type FixtureOptions = {
  readonly line?: string | null;
  readonly sourceId?: string;
  readonly profile?: FlavorProfile;
  readonly sourceProfileAvailable?: boolean;
  readonly profileCandidates?: readonly EffectiveProfileCandidate[];
  readonly proportionConfirmed?: boolean;
  readonly evidenceCount?: number;
};

const component = (manufacturer: string, productName: string, percentage: number, options: FixtureOptions = {}): CanonicalMixComponentInput => ({
  flavorId: options.sourceId ?? `${manufacturer}:${productName}`,
  brandName: manufacturer,
  flavorName: productName,
  flavorSlug: `${manufacturer}-${productName}`.toLocaleLowerCase("ru-RU").replace(/[^\p{L}\p{N}]+/gu, "-"),
  percentage,
  profile: options.profile ?? profile(),
  notes: [{ noteId: `note:${manufacturer}:${productName}`, noteName: productName, noteSlug: productName.toLocaleLowerCase("ru-RU").replace(/[^\p{L}\p{N}]+/gu, "-"), category: "OTHER", intensity: 5, noteType: "DOMINANT" }],
  identity: {
    sourceComponentId: options.sourceId ?? `${manufacturer}:${productName}`,
    rawManufacturer: manufacturer,
    rawProductLine: options.line ?? null,
    rawProductName: productName,
  },
  sourceProfileAvailable: options.sourceProfileAvailable,
  profileCandidates: options.profileCandidates,
  proportionConfirmed: options.proportionConfirmed,
  independentEvidenceCount: options.evidenceCount,
});

const sorbet = (percentage: number, options: FixtureOptions = {}) => component("MustHave", "Клубничный сорбет", percentage, options);
const ticTac = (percentage: number, options: FixtureOptions = {}) => component("BlackBurn", "Tic Tac", percentage, options);
const unknown = (percentage: number, options: FixtureOptions = {}) => component("не указан", "Освежающий мохито", percentage, options);

describe("canonical component resolution", () => {
  it("resolves exact source identity and preserves raw identity", () => {
    const result = resolveMixComponentIdentity(sorbet(50));
    expect(result.rawIdentity).toEqual({ manufacturer: "MustHave", productLine: null, productName: "Клубничный сорбет" });
    expect(result.resolution).toMatchObject({ status: "RESOLVED", canonicalProductId: "musthave-sorbetto", canonicalProductName: "Sorbetto", matchMethod: "EXACT_SOURCE_IDENTITY" });
  });

  it("uses an exact manufacturer-constrained alias without fuzzy matching", () => {
    const result = resolveMixComponentIdentity(component("BlackBurn", "Tik Tak", 50));
    expect(result.resolution).toMatchObject({ status: "RESOLVED", canonicalProductId: "blackburn-tic-tac", matchedAlias: "Tik Tak", matchMethod: "EXACT_ALIAS" });
  });

  it.each([["Черника"], ["Vanilla"]])("preserves Sebero / %s as ambiguous", productName => {
    const result = resolveMixComponentIdentity(component("Sebero", productName, 50));
    expect(result.resolution).toMatchObject({ status: "AMBIGUOUS", canonicalProductId: null, canonicalProductLine: null });
  });

  it("preserves an evidence-backed manufacturer-only decision", () => {
    const result = resolveMixComponentIdentity(component("MustHave", "Ананас", 50));
    expect(result.resolution).toMatchObject({ status: "MANUFACTURER_ONLY", canonicalProductId: null, canonicalManufacturer: "Musthave" });
  });

  it("does not guess an unresolved identity", () => {
    const result = resolveMixComponentIdentity(unknown(50));
    expect(result.resolution).toMatchObject({ status: "UNRESOLVED", canonicalProductId: null, canonicalManufacturer: null, matchMethod: "EXACT_SOURCE_IDENTITY" });
  });

  it("does not merge equal names from different product lines without evidence", () => {
    const mix = prepareCanonicalMix([
      component("Darkside", "Blueberry", 50, { line: "Core", sourceId: "darkside-core-blueberry" }),
      component("Darkside", "Blueberry", 50, { line: "Base", sourceId: "darkside-base-blueberry" }),
    ]);
    expect(mix.effectiveComponentCount).toBe(2);
    expect(mix.warnings).toEqual([]);
    expect(mix.componentResolutions.every(item => item.resolution.canonicalProductId === null)).toBe(true);
  });

  it("does not merge equal product names from different manufacturers", () => {
    const mix = prepareCanonicalMix([
      component("BlackBurn", "Банановое суфле", 50),
      component("Sarma", "Банановое суфле", 50),
    ]);
    expect(mix.components.map(item => item.resolution.canonicalProductId)).toEqual(["blackburn-na-rasslabone", "sarma-classic-bananovoe-sufle"]);
    expect(mix.effectiveComponentCount).toBe(2);
    expect(mix.warnings).toEqual([]);
  });
});

describe("effective profile precedence", () => {
  it("uses a supplied canonical product profile for a resolved component", () => {
    const input = sorbet(50, {
      profile: profile({ sweetness: 2 }),
      profileCandidates: [{ type: "CANONICAL_PRODUCT_PROFILE", profileId: "canonical:musthave-sorbetto", profile: { sweetness: 7 }, reliabilityScore: 90 }],
    });
    const effective = buildEffectiveTobaccoProfile(input, resolveMixComponentIdentity(input));
    expect(effective.parameters.sweetness).toEqual({ value: 7, source: "CANONICAL_PRODUCT_PROFILE", reliabilityScore: 90, profileId: "canonical:musthave-sorbetto" });
  });

  it("does not let a low-reliability canonical candidate override a stronger aggregate", () => {
    const input = sorbet(50, {
      profileCandidates: [
        { type: "CANONICAL_PRODUCT_PROFILE", profileId: "canonical-low", profile: { sweetness: 9 }, reliabilityScore: 20 },
        { type: "EXTERNAL_AGGREGATE", profileId: "aggregate", profile: { sweetness: 6 }, reliabilityScore: 60 },
      ],
    });
    const effective = buildEffectiveTobaccoProfile(input, resolveMixComponentIdentity(input));
    expect(effective.parameters.sweetness).toMatchObject({ value: 6, source: "EXTERNAL_AGGREGATE", profileId: "aggregate" });
  });

  it("uses user smoke data before preliminary and source profiles", () => {
    const input = sorbet(50, {
      profile: profile({ sweetness: 2 }),
      profileCandidates: [
        { type: "PRELIMINARY_PROFILE", profileId: "preliminary", profile: { sweetness: 6 }, reliabilityScore: 30 },
        { type: "USER_SMOKE", profileId: "smoke-1", profile: { sweetness: 9 }, reliabilityScore: 95 },
      ],
    });
    const effective = buildEffectiveTobaccoProfile(input, resolveMixComponentIdentity(input));
    expect(effective.profile.sweetness).toBe(9);
    expect(effective.parameters.sweetness).toEqual({ value: 9, source: "USER_SMOKE", reliabilityScore: 95, profileId: "smoke-1" });
  });

  it("uses external aggregate before preliminary catalog data", () => {
    const input = sorbet(50, {
      profileCandidates: [
        { type: "PRELIMINARY_PROFILE", profileId: "catalog", profile: { acidity: 8 }, reliabilityScore: 90 },
        { type: "EXTERNAL_AGGREGATE", profileId: "aggregate", profile: { acidity: 3 }, reliabilityScore: 60 },
      ],
    });
    const effective = buildEffectiveTobaccoProfile(input, resolveMixComponentIdentity(input));
    expect(effective.parameters.acidity).toMatchObject({ value: 3, source: "EXTERNAL_AGGREGATE", profileId: "aggregate" });
  });

  it("does not turn a manufacturer profile into a product profile for manufacturer-only data", () => {
    const input = component("MustHave", "Ананас", 50, { sourceProfileAvailable: false });
    const effective = buildEffectiveTobaccoProfile(input, resolveMixComponentIdentity(input));
    expect(effective.usedFallback).toBe(true);
    expect(new Set(Object.values(effective.parameters).map(item => item.source))).toEqual(new Set(["NEUTRAL_FALLBACK"]));
  });

  it("uses source data for ambiguous products and neutral fallback when source data is absent", () => {
    const withSource = component("Sebero", "Черника", 50, { profile: profile({ sweetness: 8 }) });
    const withoutSource = component("Sebero", "Черника", 50, { sourceProfileAvailable: false });
    expect(buildEffectiveTobaccoProfile(withSource, resolveMixComponentIdentity(withSource)).parameters.sweetness.source).toBe("SOURCE_PROFILE");
    expect(buildEffectiveTobaccoProfile(withoutSource, resolveMixComponentIdentity(withoutSource)).parameters.sweetness).toMatchObject({ value: 5, source: "NEUTRAL_FALLBACK" });
  });

  it("does not invent a confirmed percentage range", () => {
    const input = sorbet(50, { profileCandidates: [{ type: "PRELIMINARY_PROFILE", profile: { sweetness: 4 }, reliabilityScore: 30 }] });
    expect(buildEffectiveTobaccoProfile(input, resolveMixComponentIdentity(input)).confirmedPercentageRange).toBeNull();
  });
});

describe("canonical aggregation and scoring integration", () => {
  it("aggregates exact and alias forms of one canonical product", () => {
    const mix = prepareCanonicalMix([
      ticTac(20, { sourceId: "tic-exact" }),
      component("BlackBurn", "Tik Tak", 30, { sourceId: "tic-alias" }),
      sorbet(50, { sourceId: "sorbet" }),
    ]);
    expect(mix).toMatchObject({ rawComponentCount: 3, effectiveComponentCount: 2, totalPercentage: 100 });
    expect(mix.components[0]).toMatchObject({ flavorId: "blackburn-tic-tac", percentage: 50, sourceComponentIds: ["tic-alias", "tic-exact"] });
    expect(mix.warnings).toEqual([{ code: "DUPLICATE_CANONICAL_COMPONENT", canonicalProductId: "blackburn-tic-tac", sourceComponentIds: ["tic-alias", "tic-exact"] }]);
  });

  it("does not award a different predicted score for duplicated aliases", () => {
    const duplicated = calculateMixAnalysis({ components: [ticTac(20), component("BlackBurn", "Tik Tak", 30), sorbet(50)] });
    const consolidated = calculateMixAnalysis({ components: [ticTac(50), sorbet(50)] });
    expect(duplicated.scoring.predictedQualityScore).toBe(consolidated.scoring.predictedQualityScore);
    expect(duplicated.mixProfile.profile).toEqual(consolidated.mixProfile.profile);
  });

  it("keeps predicted and verified smoke scores separate", () => {
    const result = calculateMixAnalysis({ components: [ticTac(50), sorbet(50)], verifiedSmokeScore: 9.4 });
    expect(result.scoring.verifiedSmokeScore).toBe(9.4);
    expect(result.scoring.isVerifiedSmokeScore).toBe(true);
    expect(result.scoring.predictedQualityScore).not.toBe(result.scoring.verifiedSmokeScore);
    expect(result.scoring.predictionConfidence.finalConfidenceLabel).toBe("Подтверждённая");
  });

  it("returns finite bounded scores and the centralized breakdown", () => {
    const result = calculateMixAnalysis({ components: [ticTac(50), sorbet(50)] });
    expect(result.scoring.version).toBe("canonical-mix-scoring-v1");
    expect(result.scoring.predictedQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.predictedQualityScore).toBeLessThanOrEqual(10);
    expect(Object.values(result.scoring.scoreBreakdown).every(value => Number.isFinite(value) && value >= 0 && value <= 10)).toBe(true);
    expect(result.recommendations.recommendations.flatMap(item => item.componentIds).every(id => ["blackburn-tic-tac", "musthave-sorbetto"].includes(String(id)))).toBe(true);
  });

  it("keeps ambiguous and unresolved mixes calculable while lowering confidence", () => {
    const resolved = calculateMixAnalysis({ components: [ticTac(50), sorbet(50)] });
    const uncertain = calculateMixAnalysis({ components: [component("Sebero", "Vanilla", 50), unknown(50)] });
    expect(Number.isFinite(uncertain.scoring.predictedQualityScore)).toBe(true);
    expect(uncertain.scoring.predictionConfidence.score).toBeLessThan(resolved.scoring.predictionConfidence.score);
    expect(uncertain.scoring.componentResolutions.map(item => item.resolution.status)).toEqual(["AMBIGUOUS", "UNRESOLVED"]);
  });

  it("weights a small unresolved share less than a large unresolved share", () => {
    const small = calculateMixConfidence(prepareCanonicalMix([ticTac(95), unknown(5)]));
    const large = calculateMixConfidence(prepareCanonicalMix([ticTac(50), unknown(50)]));
    expect(small.identityCoverage).toBe(95);
    expect(large.identityCoverage).toBe(50);
    expect(small.score).toBeGreaterThan(large.score);
  });

  it("is deterministic and does not mutate its input", () => {
    const input = [ticTac(45), sorbet(55)];
    const before = structuredClone(input);
    const first = calculateMixAnalysis({ components: input });
    const second = calculateMixAnalysis({ components: input });
    expect(second).toEqual(first);
    expect(input).toEqual(before);
  });

  it("removes private tracing fields from the public scoring contract", () => {
    const result = calculateMixAnalysis({ components: [ticTac(50), sorbet(50)] });
    const serialized = JSON.stringify(toPublicCanonicalMixScoringResult(result.scoring));
    for (const token of ["decisionId", "rawIdentity", "sourceRow", "debugReasons", "sourceUrl", "evidence", "author"]) expect(serialized).not.toContain(token);
  });
});

describe("registry and workbook integration", () => {
  it("does not alter the v0.3.2 authoritative registry", () => {
    const statuses = TOBACCO_IDENTITY_DECISIONS.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.decision.status]: (counts[item.decision.status] ?? 0) + 1 }), {});
    expect(TOBACCO_IDENTITY_DECISIONS).toHaveLength(96);
    expect(statuses).toEqual({ RESOLVED: 86, MANUFACTURER_ONLY: 1, AMBIGUOUS: 7, UNRESOLVED: 2 });
    expect(auditTobaccoIdentityDecisions(TOBACCO_IDENTITY_DECISIONS).filter(item => item.severity === "ERROR")).toEqual([]);
  });

  it("preserves the exact P1 and P0 batch order", () => {
    const expected = [
      ...P1_IDENTITY_DECISIONS_BATCH_1,
      ...P0_IDENTITY_DECISIONS_BATCH_1,
      ...P0_IDENTITY_DECISIONS_BATCH_2,
      ...P0_IDENTITY_DECISIONS_BATCH_3,
      ...P0_IDENTITY_DECISIONS_BATCH_4,
      ...P0_IDENTITY_DECISIONS_BATCH_5,
      ...P0_IDENTITY_DECISIONS_BATCH_6,
    ];
    expect(TOBACCO_IDENTITY_DECISIONS).toEqual(expected);
  });

  it("scores verified mixes from a synthetic workbook deterministically and privacy-safely", async () => {
    const imported = await importExpertMixKnowledgeBuffer(await createSyntheticExpertMixWorkbookBuffer());
    const first = createCanonicalMixScoringAudit(imported);
    const second = createCanonicalMixScoringAudit(imported);
    expect(second).toEqual(first);
    expect(first.processedMixes).toBeGreaterThan(0);
    expect(first.sourceComponents).toBe(imported.components.filter(component => imported.mixes.some(mix => mix.mixId === component.mixId && mix.status === "VERIFIED")).length);
    expect(first.effectiveComponents).toBeLessThanOrEqual(first.sourceComponents);
    expect(first.sourceComponents - first.effectiveComponents).toBe(first.mergedDuplicateComponents);
    expect(first.scoringErrors).toEqual([]);
    expect(first.sumPreservationErrors).toEqual([]);
    expect(first.componentPreservationErrors).toEqual([]);
    expect(first.privacyViolations).toEqual([]);
    expect(Object.keys(first.breakdownDistribution)).toEqual(["compatibility", "proportions", "componentQuality", "balance", "risks", "confirmations"]);
    expect(first.fallbackProfileComponents).toBe(first.effectiveComponents);
  });

  it("keeps contrasting synthetic scenarios distinguishable without score-range adjustments", () => {
    const balanced = calculateMixAnalysis({ components: [
      component("Test A", "Coffee", 45, { profile: profile({ intensity: 7, sweetness: 4, acidity: 4, creaminess: 5 }), sourceProfileAvailable: true }),
      component("Test B", "Cream", 55, { profile: profile({ intensity: 6, sweetness: 6, acidity: 3, creaminess: 8 }), sourceProfileAvailable: true }),
    ] });
    const conflicting = calculateMixAnalysis({ components: [
      component("Test A", "Bitter", 50, { profile: profile({ intensity: 9, bitterness: 9, acidity: 9, dryness: 9 }), sourceProfileAvailable: true }),
      component("Test B", "Sour", 50, { profile: profile({ intensity: 9, bitterness: 8, acidity: 10, dryness: 8 }), sourceProfileAvailable: true }),
    ] });
    const poorProportions = calculateMixAnalysis({ components: [
      component("Test A", "Base", 95, { profile: profile({ intensity: 10 }), sourceProfileAvailable: true }),
      component("Test B", "Trace", 5, { profile: profile({ intensity: 2 }), sourceProfileAvailable: true }),
    ] });
    expect(new Set([balanced.scoring.predictedQualityScore, conflicting.scoring.predictedQualityScore, poorProportions.scoring.predictedQualityScore]).size).toBeGreaterThan(1);
    expect(conflicting.scoring.scoreBreakdown.risks).toBeLessThan(balanced.scoring.scoreBreakdown.risks);
    expect(poorProportions.scoring.scoreBreakdown.proportions).toBeLessThan(balanced.scoring.scoreBreakdown.proportions);
  });
});
