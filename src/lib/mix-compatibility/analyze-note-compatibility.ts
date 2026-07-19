import { BASE_SCORES } from "./constants";
import { NOTE_COMPATIBILITY_RULES } from "./compatibility-rules";
import { applied,block,conflict,factor } from "./helpers";
import type { MixProfileNoteResult } from "../mix-profile";
import type { AnalysisBlock,NoteSelector } from "./types";

const matches=(note:MixProfileNoteResult,selector:NoteSelector)=>(selector.slugs?.includes(note.noteSlug)??false)||(selector.categories?.includes(note.category)??false);
export function analyzeNoteCompatibility(notes:readonly MixProfileNoteResult[]):AnalysisBlock{
  const positives=[],warnings=[],appliedRules=[],conflicts=[];let impact=0;
  for(const rule of NOTE_COMPATIBILITY_RULES){
    const pairs=notes.flatMap(left=>notes.filter(right=>right.noteSlug!==left.noteSlug&&matches(left,rule.left)&&matches(right,rule.right)).map(right=>({left,right,strength:Math.min(left.sharePercent,right.sharePercent)})));
    if(!pairs.length)continue;
    const match=pairs.sort((a,b)=>b.strength-a.strength||a.left.noteSlug.localeCompare(b.left.noteSlug,"en")||a.right.noteSlug.localeCompare(b.right.noteSlug,"en"))[0];
    const scale=Math.max(.25,Math.min(1,match.strength/20));const actual=rule.weight*scale;impact+=actual;
    appliedRules.push(applied(rule.id,rule.type,actual,rule.technicalDescription));
    const related=[match.left.noteSlug,match.right.noteSlug];
    const item=factor(rule.id,"NOTE_COMPATIBILITY",rule.title,rule.explanation,actual,related);
    if(rule.type==="positive")positives.push(item);else warnings.push(item);
    if(rule.type==="conflict")conflicts.push(conflict(rule.id,rule.title,rule.explanation,actual,related));
  }
  return block(BASE_SCORES.noteCompatibility,impact,positives,warnings,appliedRules,conflicts);
}
