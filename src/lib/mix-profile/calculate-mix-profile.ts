import { MIX_PROFILE_CALCULATION_VERSION } from "./constants";
import { calculateComponentInfluence, getDominanceLevel } from "./calculate-component-influence";
import { calculateNoteContributions, classifyNotes } from "./calculate-note-contributions";
import { calculateWeightedProfile } from "./calculate-weighted-profile";
import type { MixProfileComponentInput, MixProfileResult } from "./types";
import { assertValidMixProfileInput } from "./validate-input";

export function calculateMixProfile(components:readonly MixProfileComponentInput[]):MixProfileResult{
  const totalPercentage=assertValidMixProfileInput(components);
  const profile=calculateWeightedProfile(components);
  const influences=calculateComponentInfluence(components);
  const allNotes=calculateNoteContributions(components);
  const groups=classifyNotes(allNotes);
  return{profile,dominantComponent:influences[0],secondaryComponents:influences.slice(1),dominanceLevel:getDominanceLevel(influences[0].influenceShare),...groups,allNotes,metadata:{componentCount:components.length,totalPercentage,calculationVersion:MIX_PROFILE_CALCULATION_VERSION}};
}
