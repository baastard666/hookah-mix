import { describe, expect, it } from "vitest";
import type { ExpertMixIdentityStatus, ExpertMixRecordStatus } from "../expert-mix-knowledge";
import type { ManufacturerProfile, ProductLineProfile } from "../tobacco-profile";
import { createUnresolvedIdentityReport } from "./unresolved-identity-report";
import type { NormalizedMixComponentStagingRecord, NormalizedMixStagingRecord, NormalizedTobaccoStagingRecord } from "./types";

const raw = { sheet: "fixture", rowNumber: 1, cells: {} } as const;
const component = (overrides: Partial<NormalizedMixComponentStagingRecord> = {}): NormalizedMixComponentStagingRecord => ({ mixId: "mix-1", componentId: "component-1", position: 1, displayName: "Darkside Core Lemon", manufacturer: "Darkside", productLine: "Core", productName: "Lemon", explicitCanonicalProductId: null, identityStatus: "UNRESOLVED", canonicalProductId: null, manufacturerId: null, productLineId: null, percentage: 50, approximatePercentage: null, parts: null, grams: null, role: null, raw, ...overrides });
const catalog = (overrides: Partial<NormalizedTobaccoStagingRecord> = {}): NormalizedTobaccoStagingRecord => ({ stagingId: "catalog-1", displayName: "Darkside Core Lemon", manufacturer: "Darkside", productLine: "Core", productName: "Lemon", explicitCanonicalProductId: null, identityStatus: "RESOLVED", canonicalProductId: null, manufacturerId: null, productLineId: null, catalogFacts: [], observations: [], externalRatings: [], derivedCharacteristics: [], sources: [], raw, ...overrides });
const mix = (mixId: string, status: ExpertMixRecordStatus): NormalizedMixStagingRecord => ({ mixId, title: null, status, proportionType: "PERCENT", declaredTotalWeightGrams: null, ratioQuality: null, sourceUrl: null, internalAuthor: null, observation: null, rating: null, tags: [], raw });
const manufacturers: ManufacturerProfile[] = [{ manufacturerId: "darkside", manufacturer: "Darkside", aliases: ["DS"], dataConfidence: "HIGH", sourceTypes: [], notes: [] }];
const productLines: ProductLineProfile[] = [{ productLineId: "darkside-core", manufacturerId: "darkside", manufacturer: "Darkside", productLine: "Core", aliases: ["Darkside Core"], dataConfidence: "HIGH", sourceTypes: [], notes: [] }];
const report = (components: NormalizedMixComponentStagingRecord[], catalogItems: NormalizedTobaccoStagingRecord[], mixes: NormalizedMixStagingRecord[]) => createUnresolvedIdentityReport({ components, catalog: catalogItems, mixes, manufacturers, productLines });

describe("unresolved identity report", () => {
  it("groups components first and merges exact-normalized catalog identities", () => {
    const result = report([component()], [catalog({ manufacturer: " DARKSIDE ", productLine: "core", productName: " lemon " })], [mix("mix-1", "VERIFIED")]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]).toMatchObject({ groupId: "identity-group-0001", occurrenceCount: 2, componentOccurrenceCount: 1, catalogOccurrenceCount: 1 });
  });
  it.each([["UNRESOLVED", "VERIFIED", "P0"], ["MANUFACTURER_ONLY", "VERIFIED", "P1"], ["UNRESOLVED", "DRAFT", "P2"]] as const)("assigns %s/%s to %s", (identityStatus, mixStatus, priority) => expect(report([component({ identityStatus })], [], [mix("mix-1", mixStatus)]).groups[0]?.priority).toBe(priority));
  it("assigns catalog-only groups to P3", () => expect(report([], [catalog()], []).groups[0]?.priority).toBe("P3"));
  it("counts unique VERIFIED mixes", () => {
    const components = [component(), component({ componentId: "component-2" }), component({ mixId: "mix-2", componentId: "component-3" })];
    expect(report(components, [], [mix("mix-1", "VERIFIED"), mix("mix-2", "VERIFIED")]).groups[0]?.verifiedMixCount).toBe(2);
  });
  it("checks Registry and reports only exact normalized aliases", () => {
    const group = report([component({ manufacturer: "DS", productLine: "Darkside Core" })], [], [mix("mix-1", "DRAFT")]).groups[0];
    expect(group).toMatchObject({ manufacturerKnown: true, productLineKnown: true, hasExactAliasCandidates: true });
    expect(group?.exactAliasCandidates.map(candidate => candidate.kind)).toEqual(["MANUFACTURER", "PRODUCT_LINE"]);
  });
  it("lists missing fields in a fixed order", () => expect(report([component({ manufacturer: null, productLine: null, productName: null })], [], []).groups[0]?.missingFields).toEqual(["manufacturer", "productLine", "productName"]));
  it("is deterministic, conservative and does not return canonical IDs", () => {
    const input = [component({ identityStatus: "MANUFACTURER_ONLY" }), component({ componentId: "component-2", identityStatus: "UNRESOLVED" })];
    const first = report(input, [], [mix("mix-1", "VERIFIED")]);
    expect(first).toEqual(report(input, [], [mix("mix-1", "VERIFIED")]));
    expect(first.groups[0]).toMatchObject({ currentStatus: "UNRESOLVED", observedStatuses: ["UNRESOLVED", "MANUFACTURER_ONLY"] });
    expect(JSON.stringify(first)).not.toContain("canonicalProductId");
  });
  it("supports every identity status without mutating input", () => {
    const statuses: ExpertMixIdentityStatus[] = ["RESOLVED", "MANUFACTURER_ONLY", "UNRESOLVED", "AMBIGUOUS", "NOT_CHECKED"];
    const inputs = statuses.map((identityStatus, index) => component({ componentId: `c-${index}`, productName: `name-${index}`, identityStatus }));
    const before = structuredClone(inputs);
    expect(report(inputs, [], []).groups).toHaveLength(5);
    expect(inputs).toEqual(before);
  });
});
