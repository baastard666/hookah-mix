import { NUMERIC_RISK_RULES } from "../flavor-knowledge";
import { applied, factor } from "./helpers";
import type { AnalysisFactor, AppliedRule, MatchedNumericRisk, NumericProfileInput } from "./types";

// ADR-025: deliberately its own function, not folded into analyzeNoteCompatibility's loop - the input
// shape is fundamentally different (a numeric profile field on two components, not a pair of note
// categories), and this keeps the existing categorical loop/tests completely untouched.
export type NumericRiskEvaluation = {
  readonly warnings: AnalysisFactor[];
  readonly appliedRules: AppliedRule[];
  readonly matchedNumericRisks: MatchedNumericRisk[];
  readonly impact: number;
};

const fieldLabel: Readonly<Record<string, string>> = { heatResistance: "жаростойкости", strength: "крепости" };

export const evaluateNumericRiskRules = (profiles: readonly NumericProfileInput[]): NumericRiskEvaluation => {
  const warnings: AnalysisFactor[] = [];
  const appliedRules: AppliedRule[] = [];
  const matchedNumericRisks: MatchedNumericRisk[] = [];
  let impact = 0;

  for (const rule of NUMERIC_RISK_RULES) {
    // ADR-025: a pair only counts when BOTH components actually have this field measured - a null on
    // either side is skipped entirely for this rule, never coerced to 0/an average (same null-safety
    // policy as the rest of the profile pipeline, ADR-015/017/023).
    let worst: { a: NumericProfileInput; b: NumericProfileInput; diff: number } | null = null;
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const va = profiles[i][rule.field];
        const vb = profiles[j][rule.field];
        if (va === null || vb === null) continue;
        const diff = Math.abs(va - vb);
        if (diff < rule.threshold) continue;
        if (!worst || diff > worst.diff) worst = { a: profiles[i], b: profiles[j], diff };
      }
    }
    if (!worst) continue;
    const valueA = worst.a[rule.field] as number;
    const valueB = worst.b[rule.field] as number;
    impact += rule.baseScore;
    const description = `Компоненты сильно расходятся по ${fieldLabel[rule.field] ?? rule.field}: ${valueA} против ${valueB} (порог |Δ|>=${rule.threshold}).`;
    appliedRules.push(applied(rule.ruleId, "caution", rule.baseScore, description));
    warnings.push(factor(rule.ruleId, "NUMERIC_RISK", "Числовой риск: сильное расхождение", description, rule.baseScore, [], [worst.a.flavorId, worst.b.flavorId]));
    matchedNumericRisks.push({ field: rule.field, componentAValue: valueA, componentBValue: valueB, ruleId: rule.ruleId });
  }

  return { warnings, appliedRules, matchedNumericRisks, impact };
};
