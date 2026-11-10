import type { ProductFlavorProfile } from "./types";

// Batch 1A deliberately records only evidence-backed directions. No numeric dimension is
// inferred from a product name, a line, or a retailer tag; absent values remain null in Prisma.
export const PRODUCT_FLAVOR_PROFILES_BATCH_7: readonly ProductFlavorProfile[] = [
  { canonicalProductId: "jent-classic-currant-wow", dimensions: {}, dominantNoteIds: ["BERRY", "SOUR"], overallConfidence: "LOW" },
  { canonicalProductId: "jent-classic-grape-me", dimensions: {}, dominantNoteIds: ["FRUIT", "MINT"], overallConfidence: "LOW" },
  { canonicalProductId: "jent-alcohol-nastoika-zamorskaya", dimensions: {}, dominantNoteIds: ["CITRUS", "HERBAL", "BERRY", "ALCOHOL"], overallConfidence: "LOW" },
  { canonicalProductId: "jent-alcohol-lesnaya-nalivka", dimensions: {}, dominantNoteIds: ["BERRY", "WOODY", "ALCOHOL"], overallConfidence: "LOW" },
  { canonicalProductId: "jent-classic-zabava", dimensions: {}, dominantNoteIds: ["FRUIT", "BERRY"], overallConfidence: "LOW" },
  { canonicalProductId: "jent-herbal-follar", dimensions: {}, dominantNoteIds: ["HERBAL", "FLORAL", "BERRY"], overallConfidence: "LOW" },
  { canonicalProductId: "jent-alcohol-air", dimensions: {}, dominantNoteIds: ["ALCOHOL", "WOODY", "CITRUS"], overallConfidence: "LOW" },
  { canonicalProductId: "jent-classic-baba-au-savarin", dimensions: {}, dominantNoteIds: ["DESSERT", "ALCOHOL", "BAKERY"], overallConfidence: "LOW" },
  { canonicalProductId: "musthave-green-tonic", dimensions: {}, dominantNoteIds: ["FRUIT", "CITRUS", "HERBAL", "BEVERAGE"], overallConfidence: "LOW" },
  { canonicalProductId: "musthave-greendizer", dimensions: {}, dominantNoteIds: ["FRUIT", "CITRUS", "SOUR"], overallConfidence: "LOW" },
  { canonicalProductId: "sebero-gid-amsterdam", dimensions: {}, dominantNoteIds: [], overallConfidence: "LOW" },
  { canonicalProductId: "sebero-gid-lissabon", dimensions: {}, dominantNoteIds: [], overallConfidence: "LOW" },
  { canonicalProductId: "spectrum-mix-line-tsvetochnyi-miks", dimensions: {}, dominantNoteIds: ["FLORAL"], overallConfidence: "LOW" },
];
