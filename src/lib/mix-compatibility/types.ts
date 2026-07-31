import { resolveIntensity } from "../flavors/types";
import type { FlavorNoteCategory } from "../flavors/types";
import type { MixProfileResult } from "../mix-profile";
import type { NumericRiskField } from "../flavor-knowledge";

export type AnalysisCategory="NOTE_COMPATIBILITY"|"PROFILE_BALANCE"|"INTENSITY_BALANCE"|"PROPORTION_BALANCE"|"NUMERIC_RISK";
export type RuleType="positive"|"caution"|"conflict";
export type SummaryTag="SWEET"|"SOUR"|"CREAMY"|"COOLING"|"FRESH"|"DESSERT"|"DRINK"|"FRUITY"|"BERRY"|"TROPICAL"|"CITRUS"|"COFFEE"|"CHOCOLATE"|"NUTTY"|"SPICY"|"HERBAL"|"FLORAL"|"SMOKY"|"BALANCED"|"INTENSE"|"LIGHT";
export type ComponentIntensity={flavorId:number|string;intensity:number};
// ADR-025: heatResistance/strength per component, straight off the same effective (post-fallback,
// null-preserving per ADR-023) profile used everywhere else - null means "not measured for this
// component", never coerced to 0/average (see evaluateNumericRiskRules, which skips a pair rather than
// guessing when either side is null). Optional on MixCompatibilityInput so every existing call site that
// predates ADR-025 keeps compiling and behaving exactly as before (no numeric rule ever fires without it).
export type NumericProfileInput={flavorId:number|string;heatResistance:number|null;strength:number|null};
export type MatchedNumericRisk={readonly field:NumericRiskField;readonly componentAValue:number;readonly componentBValue:number;readonly ruleId:string};
export type MixCompatibilityInput={mixProfile:MixProfileResult;componentIntensities:ComponentIntensity[];numericProfiles?:readonly NumericProfileInput[]};
// ADR-017: re-exported under this module's own name for call sites already using it; see
// resolveIntensity in ../flavors/types for the shared rationale (needed here, not just intensity
// balance, because mix-recommendation/mix-profile also depend on a definite number per component).
export const resolveComponentIntensity=resolveIntensity;
export type AppliedRule={ruleId:string;type:RuleType;impact:number;description:string};
export type AnalysisFactor={id:string;category:AnalysisCategory;title:string;description:string;impact:number;relatedNotes:string[];relatedComponents:Array<number|string>;ruleId:string};
export type MixConflict={id:string;severity:"LOW"|"MEDIUM"|"HIGH";title:string;description:string;relatedNotes:string[];relatedCharacteristics:string[];scoreImpact:number;ruleId:string};
export type AnalysisBlock={score:number;positiveFactors:AnalysisFactor[];warnings:AnalysisFactor[];appliedRules:AppliedRule[];conflicts:MixConflict[]};
export type MixCompatibilityResult={compatibilityScore:number;noteCompatibility:AnalysisBlock;profileBalance:AnalysisBlock;intensityBalance:AnalysisBlock;proportionBalance:AnalysisBlock;positiveFactors:AnalysisFactor[];warnings:AnalysisFactor[];conflicts:MixConflict[];summaryTags:SummaryTag[];matchedNumericRisks:readonly MatchedNumericRisk[];metadata:{calculationVersion:"mix-compatibility-v1";inputProfileVersion:"mix-profile-v1";positiveRuleCount:number;warningCount:number;conflictCount:number}};
export type NoteSelector={slugs?:readonly string[];categories?:readonly FlavorNoteCategory[]};
export type NoteCompatibilityRule={id:string;type:RuleType;left:NoteSelector;right:NoteSelector;weight:number;title:string;technicalDescription:string;explanation:string};
