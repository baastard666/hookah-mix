import type { FlavorNoteCategory } from "./types";

// ADR-024: single source of truth for human-readable category names - moved here from
// src/app/result/recommendation-presentation.ts so src/lib modules (mix-result-presentation) can
// reuse it without importing from src/app, which would invert this project's lib->app layering.
export const categoryLabels: Record<FlavorNoteCategory, string> = { BERRY: "Ягоды", FRUIT: "Фрукты", CITRUS: "Цитрус", TROPICAL: "Тропики", FLORAL: "Цветы", HERBAL: "Травы", MINT: "Мята", COOLING: "Холод", SPICE: "Специи", DESSERT: "Десерт", CREAMY: "Сливочность", VANILLA: "Ваниль", BEVERAGE: "Напиток", TEA: "Чай", COFFEE: "Кофе", NUT: "Орех", BAKERY: "Выпечка", CANDY: "Конфеты", CHOCOLATE: "Шоколад", ALCOHOL: "Алкогольное направление", WOODY: "Древесность", SMOKY: "Дымность", TOBACCO: "Табачность", SOUR: "Кислое направление", FRESH: "Свежесть" };
