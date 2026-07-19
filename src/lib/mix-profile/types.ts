import type { FlavorNoteCategory, FlavorNoteType, FlavorProfile } from "../flavors/types";

export type MixProfileNoteInput = {
  noteId: number | string;
  noteName: string;
  noteSlug: string;
  category: FlavorNoteCategory;
  intensity: number;
  noteType: FlavorNoteType | string;
};

export type MixProfileComponentInput = {
  flavorId: number | string;
  brandName: string;
  flavorName: string;
  flavorSlug: string;
  percentage: number;
  profile: FlavorProfile;
  notes: MixProfileNoteInput[];
};

export type ComponentInfluence = Pick<MixProfileComponentInput,"flavorId"|"brandName"|"flavorName"|"flavorSlug"|"percentage"> & {
  influenceScore: number;
  influenceShare: number;
  rank: number;
};

export type DominanceLevel = "CLEAR" | "MODERATE" | "BALANCED";
export type NoteSource = Pick<MixProfileComponentInput,"flavorId"|"brandName"|"flavorName"|"percentage"> & {
  sourceContribution: number;
  sourceNoteType: FlavorNoteType;
  sourceNoteIntensity: number;
};

export type MixProfileNoteResult = {
  noteIds: Array<number|string>;
  noteName: string;
  noteSlug: string;
  category: FlavorNoteCategory;
  contributionScore: number;
  sharePercent: number;
  sources: NoteSource[];
};

export type MixProfileResult = {
  profile: FlavorProfile;
  dominantComponent: ComponentInfluence;
  secondaryComponents: ComponentInfluence[];
  dominanceLevel: DominanceLevel;
  dominantNotes: MixProfileNoteResult[];
  secondaryNotes: MixProfileNoteResult[];
  backgroundNotes: MixProfileNoteResult[];
  allNotes: MixProfileNoteResult[];
  metadata: { componentCount: number; totalPercentage: number; calculationVersion: "mix-profile-v1" };
};
