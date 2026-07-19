import type { FlavorData } from "./types";
type RawFlavor = Omit<FlavorData,"notes"> & {notes:{intensity:number;noteType:FlavorData["notes"][number]["noteType"];flavorNote:{name:string;slug:string;category:FlavorData["notes"][number]["category"]}}[] };
export function mapFlavor(f:RawFlavor):FlavorData{return {...f,notes:f.notes.map(n=>({name:n.flavorNote.name,slug:n.flavorNote.slug,category:n.flavorNote.category,intensity:n.intensity,noteType:n.noteType}))}}
export const flavorInclude={brand:true,notes:{include:{flavorNote:true}}} as const;
