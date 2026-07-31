// ADR-025: numeric (non-categorical) RISKY rules. Input here is a single numeric profile field on
// two components (e.g. heatResistance) plus a threshold - not a pair of FlavorNoteCategory values -
// so this is a genuinely different evidence shape from FlavorCategoryRelation/relation()/researched()/
// verifiedHistory() in category-relations.ts, kept in its own file for that reason.
export type NumericRiskField = "heatResistance" | "strength";
export type NumericRiskDirection = "diff";
export type NumericRiskRuleType = "RISKY";

export type NumericRiskRule = {
  readonly field: NumericRiskField;
  readonly threshold: number;
  readonly direction: NumericRiskDirection;
  readonly type: NumericRiskRuleType;
  readonly baseScore: number;
  readonly ruleId: string;
  readonly evidenceIds: readonly string[];
  readonly metadata: {
    // ADR-025: sample size and structural-break ratio are read directly off the recompute diagnostic
    // that produced this threshold, not re-derived here - see ADR-025 for the full histogram/analysis.
    readonly sampleSize: number;
    readonly structuralBreakRatio: number;
    readonly qualitativeSourceDescription: string;
  };
};

// ADR-025: this is a DIFFERENT evidence tier from researched()'s HIGH/MEDIUM/LOW/SINGLE_PRODUCT_MARKETING
// and verifiedHistory()'s HIGH/MEDIUM/LOW - those grade the strength of a claimed category-pair RELATION
// (is FRUIT+SOUR good, how sure are we). This tier instead grades a STATISTICAL THRESHOLD found by
// re-running the exact same numeric profile registry through a distribution/structural-break analysis,
// corroborated by a qualitative (non-quantitative) external mechanism description - never both a number
// AND a confidence label. Deliberately NOT reusing "HIGH"/"MEDIUM"/"LOW" here: doing so would visually
// suggest this is graded on the same ladder as researched()/verifiedHistory(), which it is not - there is
// no external quantitative source for either field (checked and confirmed absent, see ADR-025), so
// "confidence" in the researched()/verifiedHistory() sense doesn't apply. The evidenceId prefix
// "evidence.statistical-threshold" is the tier identifier instead.
const statisticalThreshold = (
  field: NumericRiskField,
  threshold: number,
  direction: NumericRiskDirection,
  type: NumericRiskRuleType,
  baseScore: number,
  ruleId: string,
  metadata: NumericRiskRule["metadata"],
): NumericRiskRule => ({
  field, threshold, direction, type, baseScore, ruleId,
  evidenceIds: [`evidence.statistical-threshold.${ruleId.replace(/^numeric\./, "")}`],
  metadata,
});

export const NUMERIC_RISK_RULES: readonly NumericRiskRule[] = [
  statisticalThreshold("heatResistance", 4, "diff", "RISKY", -0.4, "numeric.heat-resistance-diff", {
    sampleSize: 1176,
    structuralBreakRatio: 3.19,
    qualitativeSourceDescription: "жаростойкий+обычный табак в одной чаше — либо жаростойкий не раскрывается из-за нехватки жара, либо обычный сгорает (Smoke Market, Felix Shop, Кальян Хат)",
  }),
  statisticalThreshold("strength", 4, "diff", "RISKY", -0.4, "numeric.strength-diff", {
    sampleSize: 3486,
    structuralBreakRatio: 4.02,
    qualitativeSourceDescription: "сильный компонент забивает лёгкий; рекомендуется крепкий/жаростойкий табак наверх чаши, лёгкий — вниз (community-consensus)",
  }),
];
