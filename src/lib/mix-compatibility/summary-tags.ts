import type { MixProfileResult } from "../mix-profile";
import { SUMMARY_TAG_LIMIT,SUMMARY_TAG_ORDER } from "./constants";
import type { AnalysisBlock,SummaryTag } from "./types";

export function calculateSummaryTags(result:MixProfileResult,profileBalance:AnalysisBlock,intensityBalance:AnalysisBlock):SummaryTag[]{
  const tags=new Set<SummaryTag>(),p=result.profile,notes=result.dominantNotes;
  // ADR-015: secondary fields (creaminess, cooling, dessertLevel, spiceLevel, herbalLevel, floralLevel, smokyLevel)
  // may be null ("not measured") - the tag is simply not added, it is never treated as "measured and low".
  if(p.sweetness>=6.5)tags.add("SWEET");if(p.acidity>=6.5)tags.add("SOUR");if(p.creaminess!==null&&p.creaminess>=6)tags.add("CREAMY");if(p.cooling!==null&&p.cooling>=6)tags.add("COOLING");if(p.freshness>=6)tags.add("FRESH");if(p.dessertLevel!==null&&p.dessertLevel>=6)tags.add("DESSERT");if(p.spiceLevel!==null&&p.spiceLevel>=6)tags.add("SPICY");if(p.herbalLevel!==null&&p.herbalLevel>=6)tags.add("HERBAL");if(p.floralLevel!==null&&p.floralLevel>=6)tags.add("FLORAL");if(p.smokyLevel!==null&&p.smokyLevel>=6)tags.add("SMOKY");if(p.intensity>=7.5)tags.add("INTENSE");if(p.intensity<=4)tags.add("LIGHT");if(profileBalance.score>=8&&intensityBalance.score>=8)tags.add("BALANCED");
  for(const note of notes){if(note.category==="DRINK")tags.add("DRINK");if(note.category==="FRUIT")tags.add("FRUITY");if(note.category==="BERRY")tags.add("BERRY");if(note.category==="TROPICAL")tags.add("TROPICAL");if(note.category==="CITRUS")tags.add("CITRUS");if(note.category==="COFFEE")tags.add("COFFEE");if(note.category==="CHOCOLATE")tags.add("CHOCOLATE");if(note.category==="NUT")tags.add("NUTTY");if(note.category==="DESSERT")tags.add("DESSERT")}
  return SUMMARY_TAG_ORDER.filter(tag=>tags.has(tag)).slice(0,SUMMARY_TAG_LIMIT);
}
