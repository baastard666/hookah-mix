import { FLAVOR_PROFILE_FIELDS, type FlavorProfile } from "../flavors/types";
import { roundTo } from "./constants";
import type { MixProfileComponentInput } from "./types";

export function calculateWeightedProfile(components: readonly MixProfileComponentInput[]): FlavorProfile {
  return Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field=>[field,Math.max(0,Math.min(10,roundTo(components.reduce((sum,component)=>sum+component.profile[field]*component.percentage/100,0),1))) ])) as FlavorProfile;
}
