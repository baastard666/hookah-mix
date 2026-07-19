import type { FlavorCategoryRelation, FlavorCategoryRelationType, FlavorNoteCategory } from "./types";

const relation = (
  left: FlavorNoteCategory,
  right: FlavorNoteCategory,
  type: FlavorCategoryRelationType,
  baseScore: number,
  ruleId: string,
  metadata?: Readonly<Record<string, unknown>>,
): FlavorCategoryRelation => ({ left, right, type, baseScore, ruleId, evidenceIds: ["evidence.internal.rules"], metadata });

export const CATEGORY_RELATIONS: readonly FlavorCategoryRelation[] = [
  relation("FRUIT", "CITRUS", "STRONG_MATCH", 0.7, "category.fruit-citrus"),
  relation("DESSERT", "CREAMY", "STRONG_MATCH", 0.7, "category.dessert-creamy"),
  relation("COFFEE", "CREAMY", "STRONG_MATCH", 0.7, "category.coffee-creamy"),
  relation("TOBACCO", "WOODY", "STRONG_MATCH", 0.7, "category.tobacco-woody"),
  relation("CHOCOLATE", "NUT", "STRONG_MATCH", 0.7, "category.chocolate-nut"),
  relation("BAKERY", "VANILLA", "STRONG_MATCH", 0.7, "category.bakery-vanilla"),
  relation("BERRY", "FLORAL", "GOOD_MATCH", 0.4, "category.berry-floral"),
  relation("BERRY", "CREAMY", "GOOD_MATCH", 0.4, "category.berry-creamy"),
  relation("TROPICAL", "COOLING", "GOOD_MATCH", 0.4, "category.tropical-cooling"),
  relation("FRUIT", "FRESH", "GOOD_MATCH", 0.4, "category.fruit-fresh"),
  relation("TEA", "CITRUS", "GOOD_MATCH", 0.4, "category.tea-citrus"),
  relation("ALCOHOL", "FRUIT", "GOOD_MATCH", 0.4, "category.alcohol-fruit"),
  relation("SPICE", "TEA", "GOOD_MATCH", 0.4, "category.spice-tea"),
  relation("VANILLA", "COFFEE", "GOOD_MATCH", 0.4, "category.vanilla-coffee", { alsoProvidesContrast: true }),
  relation("DESSERT", "SOUR", "COMPLEMENTARY_CONTRAST", 0.25, "category.dessert-sour"),
  relation("FRUIT", "SPICE", "COMPLEMENTARY_CONTRAST", 0.25, "category.fruit-spice"),
  relation("TOBACCO", "FRUIT", "COMPLEMENTARY_CONTRAST", 0.25, "category.tobacco-fruit"),
  relation("COFFEE", "CITRUS", "RISKY", -0.4, "category.coffee-citrus"),
  relation("FLORAL", "SMOKY", "RISKY", -0.5, "category.floral-smoky"),
  relation("FLORAL", "COOLING", "RISKY", -0.4, "category.floral-cooling"),
  relation("SOUR", "CREAMY", "RISKY", -0.4, "category.sour-creamy", { conditionalContrastAtModerateAcidity: true }),
  relation("HERBAL", "DESSERT", "RISKY", -0.4, "category.herbal-dessert"),
  relation("MINT", "CREAMY", "RISKY", -0.5, "category.mint-creamy"),
  relation("CANDY", "SMOKY", "CONFLICT", -0.8, "category.candy-smoky"),
];
