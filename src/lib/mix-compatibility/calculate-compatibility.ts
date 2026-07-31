import { analyzeIntensityBalance } from "./analyze-intensity-balance";
import { analyzeNoteCompatibility } from "./analyze-note-compatibility";
import { evaluateNumericRiskRules } from "./analyze-numeric-risk";
import { analyzeProfileBalance } from "./analyze-profile-balance";
import { analyzeProportions } from "./analyze-proportions";
import { COMPATIBILITY_WEIGHTS,INPUT_PROFILE_VERSION,MIX_COMPATIBILITY_VERSION,clampScore,round } from "./constants";
import { sortConflicts,sortFactors } from "./helpers";
import { calculateSummaryTags } from "./summary-tags";
import type { AnalysisBlock,MixCompatibilityInput,MixCompatibilityResult } from "./types";

export class MixCompatibilityInputError extends Error{constructor(message:string){super(message);this.name="MixCompatibilityInputError"}}
export function calculateMixCompatibility(input:MixCompatibilityInput):MixCompatibilityResult{
  if(input.mixProfile.metadata.calculationVersion!==INPUT_PROFILE_VERSION)throw new MixCompatibilityInputError(`Поддерживается только ${INPUT_PROFILE_VERSION}`);
  const components=[input.mixProfile.dominantComponent,...input.mixProfile.secondaryComponents];const ids=new Set(input.componentIntensities.map(item=>String(item.flavorId)));
  if(input.componentIntensities.some(item=>!Number.isFinite(item.intensity)||item.intensity<0||item.intensity>10)||components.some(component=>!ids.has(String(component.flavorId))))throw new MixCompatibilityInputError("Для каждого компонента нужна intensity от 0 до 10");
  const noteCompatibilityBase=analyzeNoteCompatibility(input.mixProfile.allNotes);
  // ADR-025: numeric (non-categorical) RISKY rules - a separate pass over per-component profile fields
  // (heatResistance/strength), not the note/category loop above. Merged into the SAME noteCompatibility
  // block (score, warnings, appliedRules) rather than a new top-level scored block, so COMPATIBILITY_WEIGHTS
  // and every existing consumer of the 4 named blocks stay untouched - see ADR-025 for the rationale.
  const numericRisk=evaluateNumericRiskRules(input.numericProfiles??[]);
  const noteCompatibility:AnalysisBlock=numericRisk.appliedRules.length===0?noteCompatibilityBase:{
    score:round(clampScore(noteCompatibilityBase.score+numericRisk.impact),1),
    positiveFactors:noteCompatibilityBase.positiveFactors,
    warnings:sortFactors([...noteCompatibilityBase.warnings,...numericRisk.warnings]),
    appliedRules:[...new Map([...noteCompatibilityBase.appliedRules,...numericRisk.appliedRules].map(rule=>[rule.ruleId,rule])).values()].sort((a,b)=>a.ruleId.localeCompare(b.ruleId,"en")),
    conflicts:noteCompatibilityBase.conflicts,
  };
  const profileBalance=analyzeProfileBalance(input.mixProfile);
  const intensityBalance=analyzeIntensityBalance(input);
  const proportionBalance=analyzeProportions(input);
  const compatibilityScore=round(clampScore(noteCompatibility.score*COMPATIBILITY_WEIGHTS.noteCompatibility+profileBalance.score*COMPATIBILITY_WEIGHTS.profileBalance+intensityBalance.score*COMPATIBILITY_WEIGHTS.intensityBalance+proportionBalance.score*COMPATIBILITY_WEIGHTS.proportionBalance),1);
  const positiveFactors=sortFactors([...noteCompatibility.positiveFactors,...profileBalance.positiveFactors,...intensityBalance.positiveFactors,...proportionBalance.positiveFactors]);
  const warnings=sortFactors([...noteCompatibility.warnings,...profileBalance.warnings,...intensityBalance.warnings,...proportionBalance.warnings]);
  const conflicts=sortConflicts([...noteCompatibility.conflicts,...profileBalance.conflicts,...intensityBalance.conflicts,...proportionBalance.conflicts]);
  return{compatibilityScore,noteCompatibility,profileBalance,intensityBalance,proportionBalance,positiveFactors,warnings,conflicts,summaryTags:calculateSummaryTags(input.mixProfile,profileBalance,intensityBalance),matchedNumericRisks:numericRisk.matchedNumericRisks,metadata:{calculationVersion:MIX_COMPATIBILITY_VERSION,inputProfileVersion:INPUT_PROFILE_VERSION,positiveRuleCount:positiveFactors.length,warningCount:warnings.length,conflictCount:conflicts.length}};
}
