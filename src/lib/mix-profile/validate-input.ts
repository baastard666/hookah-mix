import { FLAVOR_NOTE_TYPES, FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import { MAX_COMPONENTS, MIN_COMPONENTS, PERCENTAGE_TOLERANCE } from "./constants";
import type { MixProfileComponentInput } from "./types";

export type MixProfileValidationIssue = { path: string; message: string };
export type MixProfileValidationResult = { success: true; totalPercentage: number } | { success: false; totalPercentage: number; issues: MixProfileValidationIssue[] };

export class MixProfileValidationError extends Error {
  readonly issues: MixProfileValidationIssue[];
  constructor(issues: MixProfileValidationIssue[]) {
    super(issues.map(issue=>`${issue.path}: ${issue.message}`).join("; "));
    this.name = "MixProfileValidationError";
    this.issues = issues;
  }
}

export function validateMixProfileInput(components: readonly MixProfileComponentInput[]): MixProfileValidationResult {
  const issues: MixProfileValidationIssue[]=[];
  const totalPercentage=components.reduce((sum,component)=>sum+(Number.isFinite(component.percentage)?component.percentage:0),0);
  if(components.length<MIN_COMPONENTS)issues.push({path:"components",message:`Нужно минимум ${MIN_COMPONENTS} компонента`});
  if(components.length>MAX_COMPONENTS)issues.push({path:"components",message:`Допустимо не более ${MAX_COMPONENTS} компонентов`});
  if(Math.abs(totalPercentage-100)>PERCENTAGE_TOLERANCE)issues.push({path:"components.percentage",message:`Сумма должна быть 100%, получено ${totalPercentage}`});
  const flavorIds=new Set<string>();
  components.forEach((component,index)=>{
    const base=`components[${index}]`;
    const flavorKey=String(component.flavorId);
    if(flavorIds.has(flavorKey))issues.push({path:`${base}.flavorId`,message:"flavorId не должен повторяться"});
    flavorIds.add(flavorKey);
    if(!component.brandName.trim())issues.push({path:`${base}.brandName`,message:"Значение обязательно"});
    if(!component.flavorName.trim())issues.push({path:`${base}.flavorName`,message:"Значение обязательно"});
    if(!component.flavorSlug.trim())issues.push({path:`${base}.flavorSlug`,message:"Значение обязательно"});
    if(!Number.isFinite(component.percentage)||component.percentage<=0||component.percentage>=100)issues.push({path:`${base}.percentage`,message:"Должно быть конечным числом больше 0 и меньше 100"});
    for(const field of FLAVOR_PROFILE_FIELDS){const value=component.profile?.[field];if(!Number.isFinite(value)||value<0||value>10)issues.push({path:`${base}.profile.${field}`,message:"Должно быть конечным числом от 0 до 10"})}
    if(!component.notes.some(note=>note.noteType==="DOMINANT"))issues.push({path:`${base}.notes`,message:"Нужна минимум одна DOMINANT-нота"});
    const noteSlugs=new Set<string>();
    component.notes.forEach((note,noteIndex)=>{
      const noteBase=`${base}.notes[${noteIndex}]`;
      if(!note.noteSlug.trim())issues.push({path:`${noteBase}.noteSlug`,message:"Значение обязательно"});
      if(noteSlugs.has(note.noteSlug))issues.push({path:`${noteBase}.noteSlug`,message:"Нота не должна повторяться внутри Flavor"});
      noteSlugs.add(note.noteSlug);
      if(!Number.isFinite(note.intensity)||note.intensity<1||note.intensity>10)issues.push({path:`${noteBase}.intensity`,message:"Должно быть от 1 до 10"});
      if(!FLAVOR_NOTE_TYPES.includes(note.noteType as typeof FLAVOR_NOTE_TYPES[number]))issues.push({path:`${noteBase}.noteType`,message:"Недопустимый тип ноты"});
    });
  });
  return issues.length?{success:false,totalPercentage,issues}:{success:true,totalPercentage};
}

export function assertValidMixProfileInput(components: readonly MixProfileComponentInput[]): number {
  const validation=validateMixProfileInput(components);
  if(!validation.success)throw new MixProfileValidationError(validation.issues);
  return validation.totalPercentage;
}
