import type { FlavorNoteKnowledge } from "./types";

const note = (
  noteId: string,
  canonicalName: string,
  categoryIds: FlavorNoteKnowledge["categoryIds"],
  aliases: readonly string[],
  relatedNoteIds: readonly string[] = [],
): FlavorNoteKnowledge => ({
  noteId, canonicalName, categoryIds, aliases: [canonicalName, noteId, ...aliases], relatedNoteIds,
  tags: [...categoryIds.map(value => value.toLowerCase()), noteId], evidenceIds: ["evidence.editorial.taxonomy"],
});

export const NOTE_KNOWLEDGE: readonly FlavorNoteKnowledge[] = [
  note("blueberry", "Blueberry", ["BERRY"], ["черника"], ["raspberry", "blackberry", "lavender"]),
  note("raspberry", "Raspberry", ["BERRY"], ["малина"], ["blueberry", "blackberry", "cream"]),
  note("blackberry", "Blackberry", ["BERRY"], ["ежевика"], ["blueberry", "raspberry", "lavender"]),
  note("lavender", "Lavender", ["FLORAL"], ["лаванда"], ["blueberry", "blackberry", "tea"]),
  note("lilac", "Lilac", ["FLORAL"], ["сирень"], ["jasmine", "lavender"]),
  note("jasmine", "Jasmine", ["FLORAL"], ["жасмин"], ["lilac", "tea"]),
  note("mint", "Mint", ["MINT", "HERBAL", "FRESH"], ["мята"], ["cooling", "lemon"]),
  note("cooling", "Cooling", ["COOLING", "FRESH"], ["cold", "холод"], ["mint", "lemon"]),
  note("lemon", "Lemon", ["CITRUS", "SOUR", "FRESH"], ["лимон"], ["orange", "mint", "tea"]),
  note("orange", "Orange", ["CITRUS", "FRUIT"], ["апельсин"], ["lemon", "chocolate"]),
  note("coffee", "Coffee", ["COFFEE", "BEVERAGE"], ["кофе"], ["cream", "vanilla", "chocolate", "hazelnut"]),
  note("cream", "Cream", ["CREAMY", "DESSERT"], ["сливки", "dairy"], ["coffee", "vanilla", "chocolate"]),
  note("vanilla", "Vanilla", ["VANILLA", "DESSERT"], ["ваниль"], ["coffee", "cream", "bakery"]),
  note("chocolate", "Chocolate", ["CHOCOLATE", "DESSERT"], ["шоколад", "dark chocolate"], ["coffee", "cream", "hazelnut"]),
  note("hazelnut", "Hazelnut", ["NUT"], ["фундук"], ["coffee", "chocolate", "bakery"]),
  note("tobacco", "Tobacco", ["TOBACCO"], ["табак"], ["wood", "smoke"]),
  note("wood", "Wood", ["WOODY"], ["woody", "дерево"], ["tobacco", "smoke"]),
  note("smoke", "Smoke", ["SMOKY"], ["smoky", "дым"], ["tobacco", "wood"]),
  note("tea", "Tea", ["TEA", "BEVERAGE"], ["чай"], ["lemon", "jasmine", "lavender"]),
  note("bakery", "Bakery", ["BAKERY", "DESSERT"], ["выпечка"], ["vanilla", "hazelnut"]),
];
