import type { FlavorNoteCategory } from "../flavors/types";
import type { MixProfileResult } from "../mix-profile";

export type AnalysisCategory="NOTE_COMPATIBILITY"|"PROFILE_BALANCE"|"INTENSITY_BALANCE"|"PROPORTION_BALANCE";
export type RuleType="positive"|"caution"|"conflict";
export type SummaryTag="SWEET"|"SOUR"|"CREAMY"|"COOLING"|"FRESH"|"DESSERT"|"DRINK"|"FRUITY"|"BERRY"|"TROPICAL"|"CITRUS"|"COFFEE"|"CHOCOLATE"|"NUTTY"|"SPICY"|"HERBAL"|"FLORAL"|"SMOKY"|"BALANCED"|"INTENSE"|"LIGHT";
export type ComponentIntensity={flavorId:number|string;intensity:number};
export type MixCompatibilityInput={mixProfile:MixProfileResult;componentIntensities:ComponentIntensity[]};
export type AppliedRule={ruleId:string;type:RuleType;impact:number;description:string};
export type AnalysisFactor={id:string;category:AnalysisCategory;title:string;description:string;impact:number;relatedNotes:string[];relatedComponents:Array<number|string>;ruleId:string};
export type MixConflict={id:string;severity:"LOW"|"MEDIUM"|"HIGH";title:string;description:string;relatedNotes:string[];relatedCharacteristics:string[];scoreImpact:number;ruleId:string};
export type AnalysisBlock={score:number;positiveFactors:AnalysisFactor[];warnings:AnalysisFactor[];appliedRules:AppliedRule[];conflicts:MixConflict[]};
export type MixCompatibilityResult={compatibilityScore:number;noteCompatibility:AnalysisBlock;profileBalance:AnalysisBlock;intensityBalance:AnalysisBlock;proportionBalance:AnalysisBlock;positiveFactors:AnalysisFactor[];warnings:AnalysisFactor[];conflicts:MixConflict[];summaryTags:SummaryTag[];metadata:{calculationVersion:"mix-compatibility-v1";inputProfileVersion:"mix-profile-v1";positiveRuleCount:number;warningCount:number;conflictCount:number}};
export type NoteSelector={slugs?:readonly string[];categories?:readonly FlavorNoteCategory[]};
export type NoteCompatibilityRule={id:string;type:RuleType;left:NoteSelector;right:NoteSelector;weight:number;title:string;technicalDescription:string;explanation:string};
