import ExcelJS from "exceljs";

export const createSyntheticExpertMixWorkbookBuffer = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const tobacco = workbook.addWorksheet("ОСНОВНАЯ_БАЗА");
  tobacco.addRows([
    ["brand", "product_line", "product_name", "canonical_product_id", "description", "strength", "tags", "source_url", "author", "observation", "rating", "rating_scale", "sample_size", "preliminary_value", "preliminary_confidence"],
    ["Darkside", "Core", "Supernova", "darkside-core-supernova", "Холодный профиль", "MEDIUM", "холод; цитрус", "https://private.example/darkside", "Internal Reviewer", "Холод ощущался сильно", 4.7, 5, 120, 7, "LOW"],
    ["Dogma", null, "Крымская лаванда", null, "Каталожное описание", "MEDIUM", "цветочный; травяной", null, null, "На выдохе лаванда", null, null, null, null, null],
    ["НАШ", null, "Лаванда", null, null, null, "цветочный", null, null, null, null, null, null, null, null],
    ["Unknown Brand", null, "Лимон", null, null, null, "цитрус", null, null, null, null, null, null, null, null],
    ["Darkside", null, "Mango", null, null, null, "тропический", null, null, null, null, null, null, 8, "HIGH"],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    ["Darkside", "Core", "Supernova", "darkside-core-supernova", "Duplicate candidate", null, "холод", null, null, null, null, null, null, null, null],
  ]);
  const mixes = workbook.addWorksheet("Mixes_Internal");
  mixes.addRows([
    ["mix_id", "title", "status", "proportion_type", "total_weight", "source_url", "author", "observation", "rating", "rating_scale", "sample_size", "tags"],
    ["mix-100", "Валидный 60/40", "VERIFIED", "PERCENT", null, "https://private.example/mix", "Private Channel", "Малина доминировала", 8, 10, 1, "ягодный"],
    ["mix-99", "Округление", "VERIFIED", "PERCENT", null, null, null, null, null, null, null, null],
    ["mix-120", "Невалидные проценты", "VERIFIED", "PERCENT", null, null, null, null, null, null, null, null],
    ["mix-grams", "Граммы", "VERIFIED", "UNKNOWN", 18, null, null, null, null, null, null, null],
    ["mix-parts", "Части", "DRAFT", "PARTS", null, null, null, null, null, null, null, null],
    ["mix-order", "Порядок", "DRAFT", "ORDER_ONLY", null, null, null, null, null, null, null, null],
    ["mix-unknown", "Неизвестно", "PARTIALLY_VERIFIED", "UNKNOWN", null, null, null, null, null, null, null, null],
    ["mix-duplicate", "Дубль состава", "DRAFT", "PERCENT", null, null, null, null, null, null, null, null],
    ["mix-no-status", "Нет статуса", null, "UNKNOWN", null, null, null, null, null, null, null, null],
    ["mix-invalid-number", "Неверное число", "DRAFT", "PERCENT", null, null, null, null, null, null, null, null],
  ]);
  const components = workbook.addWorksheet("Mix_Components");
  components.addRows([
    ["mix_id", "position", "brand", "product_line", "product_name", "canonical_product_id", "percentage", "approximate_percentage", "parts", "grams", "role"],
    ["mix-100", 1, "Dogma", null, "Крымская лаванда", null, 60, null, null, null, "BASE"], ["mix-100", 2, "НАШ", null, "Лаванда", null, 40, null, null, null, "ACCENT"],
    ["mix-99", 1, "Darkside", "Core", "Supernova", null, 49, null, null, null, null], ["mix-99", 2, "Dogma", null, "Крымская лаванда", null, 50, null, null, null, null],
    ["mix-120", 1, "Darkside", "Core", "Supernova", null, 60, null, null, null, null], ["mix-120", 2, "Dogma", null, "Крымская лаванда", null, 60, null, null, null, null],
    ["mix-grams", 1, "Dogma", null, "Крымская лаванда", null, null, null, null, 10, null], ["mix-grams", 2, "НАШ", null, "Лаванда", null, null, null, null, 9, null],
    ["mix-parts", 1, "Dogma", null, "Крымская лаванда", null, null, null, 2, null, null], ["mix-parts", 2, "НАШ", null, "Лаванда", null, null, null, 1, null, null],
    ["mix-order", 1, "Dogma", null, "Крымская лаванда", null, null, null, null, null, null], ["mix-order", 2, "НАШ", null, "Лаванда", null, null, null, null, null, null],
    ["mix-unknown", 1, "Unknown Brand", null, "Лимон", null, null, null, null, null, null],
    ["mix-duplicate", 1, "Dogma", null, "Крымская лаванда", null, 60, null, null, null, null], ["mix-duplicate", 2, "НАШ", null, "Лаванда", null, 40, null, null, null, null],
    ["mix-no-status", 1, "НАШ", null, "Лаванда", null, null, null, null, null, null],
    ["mix-invalid-number", 1, "Dogma", null, "Крымская лаванда", null, "abc", null, null, null, null],
    ["missing-mix", 1, "Dogma", null, "Крымская лаванда", null, 100, null, null, null, null],
  ]);
  const appTobacco = workbook.addWorksheet("App_Tobacco"); appTobacco.addRows([["name", "derived"], ["Public card", "yes"]]); appTobacco.mergeCells("A3:B3"); appTobacco.getCell("A3").value = "Merged derived note";
  const appMixes = workbook.addWorksheet("App_Mixes", { state: "hidden" }); appMixes.addRows([["mix", "formula"], ["Public mix", { formula: "=1+1", result: 2 }]]);
  const archive = workbook.addWorksheet("Archive", { state: "veryHidden" }); archive.addRows([["old"], ["ignored"]]);
  const bytes = await workbook.xlsx.writeBuffer();
  return Buffer.from(bytes as unknown as Uint8Array);
};
