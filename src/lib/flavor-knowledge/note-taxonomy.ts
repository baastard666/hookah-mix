import type { FlavorNoteCategory as LegacyFlavorNoteCategory } from "../flavors/types";
import type { FlavorNoteCategory, FlavorNoteCategoryDefinition } from "./types";

const category = (
  id: FlavorNoteCategory,
  parentId?: FlavorNoteCategory,
  relatedCategoryIds: readonly FlavorNoteCategory[] = [],
  tags: readonly string[] = [],
): FlavorNoteCategoryDefinition => ({ id, parentId, relatedCategoryIds, tags });

export const NOTE_TAXONOMY: readonly FlavorNoteCategoryDefinition[] = [
  category("FRUIT", undefined, ["FRESH", "SOUR"], ["fruit"]),
  category("BERRY", "FRUIT", ["FLORAL", "CREAMY"], ["berry", "fruit"]),
  category("CITRUS", "FRUIT", ["FRESH", "SOUR", "TEA"], ["citrus", "fresh"]),
  category("TROPICAL", "FRUIT", ["COOLING", "CREAMY"], ["tropical", "fruit"]),
  category("FLORAL", undefined, ["BERRY", "TEA"], ["floral"]),
  category("HERBAL", undefined, ["MINT", "TEA"], ["herbal"]),
  category("MINT", "HERBAL", ["COOLING", "FRESH"], ["mint", "fresh"]),
  category("COOLING", undefined, ["MINT", "FRESH", "TROPICAL"], ["cooling"]),
  category("SPICE", undefined, ["TEA", "FRUIT", "BAKERY"], ["spice"]),
  category("DESSERT", undefined, ["CREAMY", "VANILLA", "BAKERY", "CANDY", "CHOCOLATE"], ["dessert"]),
  category("CREAMY", "DESSERT", ["VANILLA", "COFFEE", "BERRY"], ["creamy"]),
  category("VANILLA", "DESSERT", ["CREAMY", "COFFEE", "BAKERY"], ["vanilla"]),
  category("BEVERAGE", undefined, ["TEA", "COFFEE", "ALCOHOL"], ["beverage"]),
  category("TEA", "BEVERAGE", ["CITRUS", "FLORAL", "HERBAL", "SPICE"], ["tea"]),
  category("COFFEE", "BEVERAGE", ["CREAMY", "VANILLA", "CHOCOLATE", "NUT"], ["coffee"]),
  category("NUT", undefined, ["CHOCOLATE", "COFFEE", "BAKERY"], ["nut"]),
  category("BAKERY", "DESSERT", ["VANILLA", "NUT", "SPICE"], ["bakery"]),
  category("CANDY", "DESSERT", ["FRUIT", "SOUR"], ["candy"]),
  category("CHOCOLATE", "DESSERT", ["NUT", "CREAMY", "COFFEE"], ["chocolate"]),
  category("ALCOHOL", "BEVERAGE", ["FRUIT", "SPICE"], ["alcohol", "beverage"]),
  category("WOODY", undefined, ["TOBACCO", "SMOKY"], ["woody"]),
  category("SMOKY", undefined, ["TOBACCO", "WOODY"], ["smoky"]),
  category("TOBACCO", undefined, ["WOODY", "SMOKY", "FRUIT"], ["tobacco"]),
  category("SOUR", undefined, ["CITRUS", "FRUIT", "CANDY"], ["sour"]),
  category("FRESH", undefined, ["FRUIT", "CITRUS", "MINT", "COOLING"], ["fresh"]),
];

const LEGACY_CATEGORY_MAP: Readonly<Partial<Record<LegacyFlavorNoteCategory, FlavorNoteCategory>>> = {
  FRUIT: "FRUIT", BERRY: "BERRY", CITRUS: "CITRUS", DESSERT: "DESSERT", DRINK: "BEVERAGE",
  SPICE: "SPICE", FLORAL: "FLORAL", HERBAL: "HERBAL", COOLING: "COOLING", NUT: "NUT",
  COFFEE: "COFFEE", CHOCOLATE: "CHOCOLATE", DAIRY: "CREAMY", TROPICAL: "TROPICAL", SMOKY: "SMOKY",
};

export const toKnowledgeCategory = (categoryId: LegacyFlavorNoteCategory): FlavorNoteCategory | undefined =>
  LEGACY_CATEGORY_MAP[categoryId];
