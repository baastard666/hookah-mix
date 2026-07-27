import { resolveIntensity } from "../flavors/types";
import type { FlavorNoteCategory, FlavorNoteType } from "../flavors/types";
import { NOTE_TYPE_WEIGHTS, roundTo } from "./constants";
import type { MixProfileComponentInput, MixProfileNoteResult, NoteSource } from "./types";

type RawSource=NoteSource&{noteId:number|string;noteName:string;noteSlug:string;category:FlavorNoteCategory;rawContribution:number;flavorSlug:string};
const sourceCompare=(a:RawSource,b:RawSource)=>b.rawContribution-a.rawContribution||a.flavorSlug.localeCompare(b.flavorSlug,"en")||String(a.flavorId).localeCompare(String(b.flavorId),"en");

export function calculateNoteContributions(components:readonly MixProfileComponentInput[]):MixProfileNoteResult[]{
  const grouped=new Map<string,RawSource[]>();
  for(const component of components)for(const note of component.notes){
    const rawContribution=component.percentage/100*resolveIntensity(component.profile.intensity)*note.intensity*NOTE_TYPE_WEIGHTS[note.noteType as FlavorNoteType];
    const source:RawSource={flavorId:component.flavorId,brandName:component.brandName,flavorName:component.flavorName,percentage:component.percentage,sourceContribution:roundTo(rawContribution,2),sourceNoteType:note.noteType as FlavorNoteType,sourceNoteIntensity:note.intensity,noteId:note.noteId,noteName:note.noteName,noteSlug:note.noteSlug,category:note.category,rawContribution,flavorSlug:component.flavorSlug};
    grouped.set(note.noteSlug,[...(grouped.get(note.noteSlug)??[]),source]);
  }
  const rawNotes=[...grouped.entries()].map(([noteSlug,sources])=>{const sorted=[...sources].sort(sourceCompare);return{noteSlug,sources:sorted,total:sources.reduce((sum,source)=>sum+source.rawContribution,0),representative:sorted[0]}});
  const totalContribution=rawNotes.reduce((sum,note)=>sum+note.total,0);
  return rawNotes.map(({noteSlug,sources,total,representative})=>({noteIds:[...new Set(sources.map(source=>source.noteId))].sort((a,b)=>String(a).localeCompare(String(b),"en")),noteName:representative.noteName,noteSlug,category:representative.category,contributionScore:roundTo(total,2),sharePercent:roundTo(total/totalContribution*100,1),sources:sources.map(({flavorId,brandName,flavorName,percentage,sourceContribution,sourceNoteType,sourceNoteIntensity})=>({flavorId,brandName,flavorName,percentage,sourceContribution,sourceNoteType,sourceNoteIntensity})),componentFlavorIds:[...new Set(sources.map(source=>source.flavorId))].sort((a,b)=>String(a).localeCompare(String(b),"en"))})).sort((a,b)=>b.contributionScore-a.contributionScore||a.noteSlug.localeCompare(b.noteSlug,"en"));
}

export function classifyNotes(allNotes:readonly MixProfileNoteResult[]):Pick<import("./types").MixProfileResult,"dominantNotes"|"secondaryNotes"|"backgroundNotes">{
  const dominantNotes=allNotes.filter((note,index)=>index===0||note.sharePercent>=20).slice(0,3);
  const dominantSlugs=new Set(dominantNotes.map(note=>note.noteSlug));
  const secondaryNotes=allNotes.filter(note=>!dominantSlugs.has(note.noteSlug)&&note.sharePercent>=8).slice(0,5);
  const secondarySlugs=new Set(secondaryNotes.map(note=>note.noteSlug));
  const backgroundNotes=allNotes.filter(note=>!dominantSlugs.has(note.noteSlug)&&!secondarySlugs.has(note.noteSlug)&&note.contributionScore>0).slice(0,5);
  return{dominantNotes:[...dominantNotes],secondaryNotes:[...secondaryNotes],backgroundNotes:[...backgroundNotes]};
}
