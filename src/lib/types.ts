import type { FlavorNoteCategory, FlavorNoteType, FlavorProfile, FlavorProfileSource, FlavorProfileStatus } from "./flavors/types";
export type Note = { name: string; slug: string; category: FlavorNoteCategory; intensity: number; noteType: FlavorNoteType };
export type FlavorData = FlavorProfile & { id: number; name: string; slug: string; description: string; brand: { name: string }; profileStatus: FlavorProfileStatus; profileSource: FlavorProfileSource; notes: Note[] };
export type MixInput = { flavor: FlavorData; percentage: number };
