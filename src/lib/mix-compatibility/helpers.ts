import { clampScore,round } from "./constants";
import type { AnalysisBlock,AnalysisCategory,AnalysisFactor,AppliedRule,MixConflict } from "./types";

export const factor=(ruleId:string,category:AnalysisCategory,title:string,description:string,impact:number,relatedNotes:string[]=[],relatedComponents:Array<number|string>=[]):AnalysisFactor=>({id:`factor.${ruleId}`,category,title,description,impact:round(impact,2),relatedNotes:[...relatedNotes].sort(),relatedComponents:[...relatedComponents].sort((a,b)=>String(a).localeCompare(String(b),"en")),ruleId});
export const applied=(ruleId:string,type:AppliedRule["type"],impact:number,description:string):AppliedRule=>({ruleId,type,impact:round(impact,2),description});
export const conflict=(ruleId:string,title:string,description:string,impact:number,relatedNotes:string[]=[],relatedCharacteristics:string[]=[]):MixConflict=>({id:`conflict.${ruleId}`,severity:Math.abs(impact)>=1?"HIGH":Math.abs(impact)>=.6?"MEDIUM":"LOW",title,description,relatedNotes:[...relatedNotes].sort(),relatedCharacteristics:[...relatedCharacteristics].sort(),scoreImpact:round(impact,2),ruleId});
const unique=<T extends {id:string}>(items:T[])=>[...new Map(items.map(item=>[item.id,item])).values()];
export const sortFactors=(items:AnalysisFactor[])=>unique(items).sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact)||a.ruleId.localeCompare(b.ruleId,"en"));
const severity={HIGH:0,MEDIUM:1,LOW:2};
export const sortConflicts=(items:MixConflict[])=>unique(items).sort((a,b)=>severity[a.severity]-severity[b.severity]||a.ruleId.localeCompare(b.ruleId,"en"));
export const block=(base:number,rawImpact:number,positiveFactors:AnalysisFactor[],warnings:AnalysisFactor[],appliedRules:AppliedRule[],conflicts:MixConflict[]=[]):AnalysisBlock=>({score:round(clampScore(base+rawImpact),1),positiveFactors:sortFactors(positiveFactors),warnings:sortFactors(warnings),appliedRules:[...new Map(appliedRules.map(rule=>[rule.ruleId,rule])).values()].sort((a,b)=>a.ruleId.localeCompare(b.ruleId,"en")),conflicts:sortConflicts(conflicts)});
