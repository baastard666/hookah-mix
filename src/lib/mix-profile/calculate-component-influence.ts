import { resolveIntensity } from "../flavors/types";
import { roundTo } from "./constants";
import type { ComponentInfluence, DominanceLevel, MixProfileComponentInput } from "./types";

type RawInfluence={component:MixProfileComponentInput;score:number};
// ADR-017: intensity may be null ("not measured") - resolveIntensity supplies the neutral fallback so an
// unmeasured component is never treated as having zero intensity in dominance ranking/scoring.
const compare=(a:RawInfluence,b:RawInfluence):number=>b.score-a.score||b.component.percentage-a.component.percentage||resolveIntensity(b.component.profile.intensity)-resolveIntensity(a.component.profile.intensity)||a.component.flavorSlug.localeCompare(b.component.flavorSlug,"en")||String(a.component.flavorId).localeCompare(String(b.component.flavorId),"en");

export function calculateComponentInfluence(components:readonly MixProfileComponentInput[]):ComponentInfluence[]{
  const raw=components.map(component=>{const strongest=Math.max(...component.notes.filter(note=>note.noteType==="DOMINANT").map(note=>note.intensity));return{component,score:component.percentage*(0.6+resolveIntensity(component.profile.intensity)/20)*(0.7+strongest/30)}}).sort(compare);
  const total=raw.reduce((sum,item)=>sum+item.score,0);
  return raw.map(({component,score},index)=>({flavorId:component.flavorId,brandName:component.brandName,flavorName:component.flavorName,flavorSlug:component.flavorSlug,percentage:component.percentage,influenceScore:roundTo(score,2),influenceShare:roundTo(score/total*100,1),rank:index+1}));
}

export function getDominanceLevel(share:number):DominanceLevel{return share>=50?"CLEAR":share>=40?"MODERATE":"BALANCED"}
