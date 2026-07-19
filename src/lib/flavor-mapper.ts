import type { FlavorData } from "./types";
type RawFlavor = { id:number;name:string;slug:string;description:string;strength:number;heatResistance:number;intensity:number;sweetness:number;acidity:number;cooling:number;creaminess:number;bitterness:number;brand:{name:string};notes:{intensity:number;noteType:string;flavorNote:{name:string;category:string}}[] };
export function mapFlavor(f:RawFlavor):FlavorData{return {...f,notes:f.notes.map(n=>({name:n.flavorNote.name,category:n.flavorNote.category,intensity:n.intensity,noteType:n.noteType}))}}
export const flavorInclude={brand:true,notes:{include:{flavorNote:true}}} as const;
