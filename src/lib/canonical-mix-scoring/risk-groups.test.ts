import { describe, expect, it } from "vitest";
import type { AnalysisFactor, MixCompatibilityResult } from "../mix-compatibility";
import { groupCompatibilityRisks } from "./risk-groups";

const warning = (ruleId: string, impact: number, componentId: string): AnalysisFactor => ({ id: ruleId, category: "PROPORTION_BALANCE", title: ruleId, description: ruleId, impact, relatedNotes: [], relatedComponents: [componentId], ruleId });
const compatibility = (warnings: AnalysisFactor[]): MixCompatibilityResult => ({
  compatibilityScore: 7, noteCompatibility: { score: 7, positiveFactors: [], warnings: [], appliedRules: [], conflicts: [] }, profileBalance: { score: 7, positiveFactors: [], warnings: [], appliedRules: [], conflicts: [] }, intensityBalance: { score: 7, positiveFactors: [], warnings: [], appliedRules: [], conflicts: [] }, proportionBalance: { score: 7, positiveFactors: [], warnings, appliedRules: [], conflicts: [] },
  positiveFactors: [], warnings, conflicts: [], summaryTags: [], metadata: { calculationVersion: "mix-compatibility-v1", inputProfileVersion: "mix-profile-v1", positiveRuleCount: 0, warningCount: warnings.length, conflictCount: 0 },
});

describe("canonical risk grouping", () => {
  it("groups flags with the same deterministic cause", () => expect(groupCompatibilityRisks(compatibility([warning("intensity.overdominant", -.8, "cola"), warning("proportion.bright-large.cola", -.6, "cola")]))).toHaveLength(1));
  it("does not group unrelated risks", () => expect(groupCompatibilityRisks(compatibility([warning("intensity.overdominant", -.8, "cola"), warning("profile.extreme-cooling", -.7, "mint")]))).toHaveLength(2));
  it("preserves the highest severity", () => expect(groupCompatibilityRisks(compatibility([warning("intensity.overdominant", -.8, "cola"), warning("proportion.bright-large.cola", -.6, "cola")]))[0].severity).toBe("HIGH"));
  it("preserves all reasons and rule IDs", () => expect(groupCompatibilityRisks(compatibility([warning("intensity.overdominant", -.8, "cola"), warning("proportion.bright-large.cola", -.6, "cola")]))[0].ruleIds).toEqual(["intensity.overdominant", "proportion.bright-large.cola"]));
  it("is deterministic", () => { const input = compatibility([warning("intensity.overdominant", -.8, "cola"), warning("proportion.bright-large.cola", -.6, "cola")]); expect(groupCompatibilityRisks(input)).toEqual(groupCompatibilityRisks(input)); });
});
