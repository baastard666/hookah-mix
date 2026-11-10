const transliteration: Readonly<Record<string, string>> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export const toAsciiKebab = (value: string): string => value.normalize("NFKD").toLocaleLowerCase("ru-RU").split("").map(character => transliteration[character] ?? character).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "mix";

export const createMixCatalogSlug = (title: string, recipeId: string): string => {
  const suffix = recipeId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${toAsciiKebab(title)}-${suffix}`;
};
