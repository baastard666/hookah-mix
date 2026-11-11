import { describe, expect, it } from "vitest";
import { calculateMixAnalysis } from "../mix-analysis";
import { GOLD_SET_V1_SCENARIOS } from "../mix-scoring-audit";
import { calculatePredictionReadiness } from ".";

const readinessFor = (scenarioId: string) => {
  const scenario = GOLD_SET_V1_SCENARIOS.find(item => item.id === scenarioId);
  if (!scenario) throw new Error(`Unknown fixture ${scenarioId}`);
  const analysis = calculateMixAnalysis({ components: scenario.components });
  return { analysis, readiness: calculatePredictionReadiness({ canonicalMix: analysis.canonicalMix, componentQuality: analysis.scoring.scoreBreakdown.componentQuality, balance: analysis.scoring.scoreBreakdown.balance, verifiedSmokeAvailable: false }) };
};

describe("evidence-aware prediction readiness", () => {
  it("keeps sparse JENT internal scores unchanged but suppresses public quality", () => {
    const { analysis, readiness } = readinessFor("jent-nastoika-currant");
    expect(analysis.scoring.predictedQualityScore).toBe(7.8);
    expect(analysis.compatibility.compatibilityScore).toBe(8);
    expect(readiness).toMatchObject({ status: "INSUFFICIENT", sensoryEvidenceCoverage: 0 });
  });
  it("does not treat exact identity as sensory evidence", () => {
    const { analysis, readiness } = readinessFor("counterfactual-identity");
    expect(analysis.canonicalMix.componentResolutions.every(item => item.resolution.status === "RESOLVED")).toBe(true);
    expect(readiness.status).toBe("INSUFFICIENT");
    expect(readiness.sensoryEvidenceCoverage).toBe(0);
  });
  it("marks fully measured components READY", () => {
    const { readiness } = readinessFor("rich-compatible");
    expect(readiness).toMatchObject({ status: "READY", sensoryEvidenceCoverage: 100, scoreEvidenceCoverage: 100 });
  });
  it("uses LIMITED for partial sensory evidence when critical score blocks exist", () => {
    const { readiness } = readinessFor("counterfactual-partial");
    expect(readiness).toMatchObject({ status: "LIMITED", sensoryEvidenceCoverage: expect.any(Number) });
    expect(readiness.sensoryEvidenceCoverage).toBeGreaterThan(0);
    expect(readiness.sensoryEvidenceCoverage).toBeLessThan(50);
  });
  it("never raises readiness when sensory measurements are removed", () => {
    const full = readinessFor("counterfactual-full").readiness;
    const partial = readinessFor("counterfactual-partial").readiness;
    const empty = readinessFor("counterfactual-categories").readiness;
    expect(full.sensoryEvidenceCoverage).toBeGreaterThan(partial.sensoryEvidenceCoverage);
    expect(partial.sensoryEvidenceCoverage).toBeGreaterThan(empty.sensoryEvidenceCoverage);
    expect(["INSUFFICIENT", "LIMITED", "READY"].indexOf(full.status)).toBeGreaterThan(["INSUFFICIENT", "LIMITED", "READY"].indexOf(empty.status));
  });
});
