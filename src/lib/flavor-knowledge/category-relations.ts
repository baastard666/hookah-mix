import type { FlavorCategoryRelation, FlavorCategoryRelationType, FlavorNoteCategory } from "./types";

const relation = (
  left: FlavorNoteCategory,
  right: FlavorNoteCategory,
  type: FlavorCategoryRelationType,
  baseScore: number,
  ruleId: string,
  metadata?: Readonly<Record<string, unknown>>,
): FlavorCategoryRelation => ({ left, right, type, baseScore, ruleId, evidenceIds: ["evidence.internal.rules"], metadata });

// ADR-019: same shape as `relation`, but evidenceIds point at the aggregated-research evidence
// tier (matching the pair's HIGH/MEDIUM/LOW/single-product-marketing confidence) instead of the
// internal expert rule evidence used by every relation above.
const researched = (
  left: FlavorNoteCategory,
  right: FlavorNoteCategory,
  type: FlavorCategoryRelationType,
  baseScore: number,
  ruleId: string,
  confidence: "HIGH" | "MEDIUM" | "LOW" | "SINGLE_PRODUCT_MARKETING",
  sourceDescription: string,
): FlavorCategoryRelation => ({
  left, right, type, baseScore, ruleId,
  evidenceIds: [`evidence.aggregated-research.${confidence === "SINGLE_PRODUCT_MARKETING" ? "single-product-marketing" : confidence.toLowerCase()}`],
  metadata: { sourceDescription, aggregatedResearchConfidence: confidence },
});

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

  // ADR-019: 22 pairs from an external aggregated-research batch (29 submitted, 5 conflicted with
  // the internal-expert-rule relations above and were left out - see docs/adr/ADR-019, 2 exactly
  // duplicated existing relations and were left out too). Types/scores follow the same STRONG_MATCH
  // =0.7 / GOOD_MATCH=0.4 / COMPLEMENTARY_CONTRAST=0.25 / RISKY=-0.4 convention used above; only the
  // evidence weight (not baseScore) reflects the HIGH/MEDIUM/LOW confidence tier.
  researched("MINT", "BERRY", "COMPLEMENTARY_CONTRAST", 0.25, "category.mint-berry", "HIGH", "профильный блог/сообщество"),
  researched("MINT", "CITRUS", "STRONG_MATCH", 0.7, "category.mint-citrus", "HIGH", "обзорный агрегатор + готовый вкус"),
  researched("TEA", "BERRY", "GOOD_MATCH", 0.4, "category.tea-berry", "HIGH", "обзорный агрегатор + пользовательские отзывы"),
  researched("MINT", "FRUIT", "GOOD_MATCH", 0.4, "category.mint-fruit", "HIGH", "профильный блог + рецепты производителя"),
  researched("MINT", "TROPICAL", "GOOD_MATCH", 0.4, "category.mint-tropical", "HIGH", "профильный блог + официальный продукт"),
  researched("MINT", "CHOCOLATE", "COMPLEMENTARY_CONTRAST", 0.25, "category.mint-chocolate", "HIGH", "официальные вкусы + обзорный агрегатор (4 независимых бренда)"),
  researched("CREAMY", "TEA", "STRONG_MATCH", 0.7, "category.creamy-tea", "HIGH", "официальный продукт + обзорный агрегатор"),
  researched("TEA", "MINT", "GOOD_MATCH", 0.4, "category.tea-mint", "MEDIUM", "обзорный агрегатор"),
  researched("FLORAL", "TEA", "GOOD_MATCH", 0.4, "category.floral-tea", "MEDIUM", "сообщество + пользовательские отзывы"),
  researched("CREAMY", "BAKERY", "GOOD_MATCH", 0.4, "category.creamy-bakery", "MEDIUM", "официальный производитель + обзорный агрегатор"),
  researched("CREAMY", "CHOCOLATE", "STRONG_MATCH", 0.7, "category.creamy-chocolate", "HIGH", "готовые вкусы + обзорный агрегатор"),
  researched("CREAMY", "FRUIT", "COMPLEMENTARY_CONTRAST", 0.25, "category.creamy-fruit", "MEDIUM", "официальный продукт + пользовательские отзывы"),
  researched("CREAMY", "TROPICAL", "COMPLEMENTARY_CONTRAST", 0.25, "category.creamy-tropical", "MEDIUM", "официальный продукт + готовые композиции"),
  researched("MINT", "DESSERT", "COMPLEMENTARY_CONTRAST", 0.25, "category.mint-dessert", "MEDIUM", "готовые вкусы + обзорный агрегатор"),
  researched("CITRUS", "BERRY", "GOOD_MATCH", 0.4, "category.citrus-berry", "MEDIUM", "рецепты производителя"),
  researched("FLORAL", "MINT", "COMPLEMENTARY_CONTRAST", 0.25, "category.floral-mint", "LOW", "единичный пользовательский отзыв"),
  researched("FLORAL", "ALCOHOL", "COMPLEMENTARY_CONTRAST", 0.25, "category.floral-alcohol", "LOW", "единичный пользовательский отзыв"),
  // ADR-019 п.5: закрывает пробел, найденный в диагностике Sarma+Сливки (FLORAL+CREAMY не имел
  // никакой связи вообще - пара оставалась нейтральной несмотря на то, что у обоих компонентов
  // теперь есть реальные категории после ADR-018).
  researched("FLORAL", "CREAMY", "COMPLEMENTARY_CONTRAST", 0.25, "category.floral-creamy", "LOW", "единичный пользовательский отзыв"),
  // NEUTRAL - записано для provenance ("проверяли, оказалось нейтрально", а не "не проверяли"), но
  // не подключается через createKnowledgeCategoryRule: эта функция намеренно бросает исключение для
  // NEUTRAL (см. src/lib/mix-compatibility/knowledge-adapter.ts), так как NEUTRAL не создаёт правило.
  researched("CITRUS", "SPICE", "NEUTRAL", 0, "category.citrus-spice", "MEDIUM", "обзорный агрегатор, полярные отзывы"),
  researched("SPICE", "BERRY", "RISKY", -0.4, "category.spice-berry", "SINGLE_PRODUCT_MARKETING", "розничное описание одного продукта (Deus Vanilla Berries)"),
  researched("SPICE", "VANILLA", "RISKY", -0.4, "category.spice-vanilla", "SINGLE_PRODUCT_MARKETING", "розничное описание одного продукта (Deus Vanilla Berries)"),
  researched("COFFEE", "BERRY", "RISKY", -0.4, "category.coffee-berry", "SINGLE_PRODUCT_MARKETING", "розничное описание одного продукта (Deus Vanilla Berries)"),
];
