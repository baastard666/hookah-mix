/** Public copy is deliberately kept apart from engine enums and registry slugs. */
export const CATEGORY_RELATION_LABELS = Object.freeze({
  STRONG_MATCH: "Вкусовые направления хорошо поддерживают друг друга.",
  GOOD_MATCH: "Вкусовые направления сочетаются в текущих пропорциях.",
  COMPLEMENTARY_CONTRAST: "Контрастные вкусовые направления дополняют друг друга.",
  NEUTRAL: "Направления не дают выраженного эффекта друг для друга.",
  RISKY: "Сочетание требует осторожности.",
  CONFLICT: "Вкусовые направления могут конфликтовать.",
});

export const PUBLIC_TECHNICAL_LABELS = Object.freeze({
  "mint generic": "Мята",
  "cooling generic": "Холод",
  "berry generic": "Ягоды",
  "fruit generic": "Фрукты",
});

export const humanizeCategoryRelation = (value: string): string =>
  CATEGORY_RELATION_LABELS[value as keyof typeof CATEGORY_RELATION_LABELS] ?? "Вкусовые направления учитываются отдельно.";
