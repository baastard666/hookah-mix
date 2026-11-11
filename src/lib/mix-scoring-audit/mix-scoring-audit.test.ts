import { describe, expect, it } from "vitest";
import { GOLD_SET_V1_SCENARIOS, auditGoldSet, distributionForAuditRecords, simulateScoringSemantics } from ".";

describe("Gold Set v1 scoring semantics audit", () => {
  const records = () => auditGoldSet(GOLD_SET_V1_SCENARIOS);
  it("contains a public-safe deterministic benchmark of diverse semantic cases", () => {
    expect(GOLD_SET_V1_SCENARIOS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(GOLD_SET_V1_SCENARIOS.map(item => item.scenarioClass)).size).toBeGreaterThanOrEqual(10);
    expect(JSON.stringify(GOLD_SET_V1_SCENARIOS)).not.toMatch(/privateUrl|sourceRow|workbookPath|evidenceId/i);
    expect(records()).toEqual(records());
  });
  it("keeps JENT sparse cases structurally scored but excludes unavailable blocks", () => {
    const jent = records().filter(item => item.id.startsWith("jent-"));
    expect(jent).toHaveLength(2);
    expect(jent.find(item => item.id === "jent-nastoika-currant")?.predictedQualityScore).toBe(7.8);
    expect(jent.find(item => item.id === "jent-grape-currant")?.predictedQualityScore).toBe(7.9);
    expect(jent.every(item => item.componentQualityScore === null && item.balanceScore === null)).toBe(true);
    expect(jent.every(item => item.decomposition.excludedBlocks.includes("componentQuality") && item.decomposition.excludedBlocks.includes("balance"))).toBe(true);
    expect(jent.every(item => !item.warnings.includes("profile.flat"))).toBe(true);
  });
  it("makes weight redistribution explicit without changing runtime scores", () => {
    const sparse = records().find(item => item.id === "jent-nastoika-currant")!;
    expect(sparse.decomposition.activeWeightTotal).toBe(.65);
    expect(sparse.decomposition.effectiveWeights.compatibility).toBeCloseTo(.3846, 4);
    expect(sparse.decomposition.effectiveWeights.proportions).toBeCloseTo(.3077, 4);
    expect(sparse.decomposition.effectiveWeights.risks).toBeCloseTo(.1538, 4);
    expect(sparse.decomposition.effectiveWeights.confirmations).toBeCloseTo(.1538, 4);
  });
  it("keeps measured low values distinct from unknown values", () => {
    const result = records();
    expect(result.find(item => item.id === "measured-low")?.warnings).toContain("profile.flat");
    expect(result.find(item => item.id === "all-null-sensory")?.warnings).not.toContain("profile.flat");
  });
  it("produces four research-only semantic simulations", () => {
    const simulations = simulateScoringSemantics(records(), []);
    expect(simulations.map(item => item.option)).toEqual(["A", "B", "C", "D"]);
    expect(simulations.find(item => item.option === "B")?.jentCases.every(item => !item.displayed)).toBe(true);
    expect(distributionForAuditRecords(records()).predictedQualityScore.mean).not.toBeNull();
  });
});
