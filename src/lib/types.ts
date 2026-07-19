export type Note = { name: string; category: string; intensity: number; noteType: string };
export type FlavorData = { id: number; name: string; slug: string; description: string; brand: { name: string }; strength: number; heatResistance: number; intensity: number; sweetness: number; acidity: number; cooling: number; creaminess: number; bitterness: number; notes: Note[] };
export type MixInput = { flavor: FlavorData; percentage: number };
