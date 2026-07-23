import { ProductFlavorProfileError } from "./errors";
import { validateProductFlavorProfiles } from "./validation";
import type { ConfidenceLevel, EvidenceOrigin, FlavorDimensionValue, FlavorEvidence, ProductFlavorProfile } from "./types";

const CHECKED_AT = "2026-07-23";

const evidence = (type: EvidenceOrigin, title: string, reference?: string): FlavorEvidence => ({ type, title, ...(reference ? { reference } : {}), checkedAt: CHECKED_AT });
const manufacturer = (title: string, reference: string): FlavorEvidence => evidence("MANUFACTURER_CLAIM", title, reference);
const reviewAggregate = (title: string, reference: string): FlavorEvidence => evidence("REVIEW_AGGREGATE", title, reference);
const editorial = (title: string): FlavorEvidence => evidence("EDITORIAL_ASSESSMENT", title);
const dim = (value: number, confidence: ConfidenceLevel, dimEvidence: readonly FlavorEvidence[]): FlavorDimensionValue => ({ value, confidence, evidence: dimEvidence });

const profiles: readonly ProductFlavorProfile[] = [
  {
    canonicalProductId: "sapphire-crown-dried-plum",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("HTReviews: агрегированное описание вкуса Sapphire Crown Dried Plum — «сладкий, высушенный плод синей сливы»", "https://htreviews.org/tobaccos/sapphire-crown/main/dried-plum"),
        editorial("Числовое значение 0-10 выведено редакционно из словесного описания «сладкий... с легкой кислинкой»."),
      ]),
      sourness: dim(3, "MEDIUM", [
        reviewAggregate("HTReviews: описание указывает «легкую кислинку» у Sapphire Crown Dried Plum", "https://htreviews.org/tobaccos/sapphire-crown/main/dried-plum"),
        editorial("Низкое числовое значение отражает формулировку «легкая кислинка» (второстепенная нота, не доминирующая)."),
      ]),
    },
    dominantNoteIds: ["FRUIT"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sapphire-crown-go-bananas",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("HTReviews: агрегированное описание вкуса Sapphire Crown Go Bananas! — «натуральный банан с приятной сладостью»", "https://htreviews.org/tobaccos/sapphire-crown/main/go-bananas"),
        editorial("Числовое значение выведено редакционно из формулировки «приятная сладость» без указания на интенсивность."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "musthave-sorbetto",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        manufacturer("MUSTHAVE: официальное описание «насыщенным вкусом спелой клубники»", "https://musthave.ru/tabak-dlya-kalyana-musthave-klybnishnyi-sorbet/"),
        editorial("Числовое значение выведено редакционно из официального описания насыщенности клубничного вкуса."),
      ]),
      sourness: dim(3, "LOW", [
        reviewAggregate("HTReviews: сводное описание упоминает лёгкое терпкое послевкусие у клубничного сорбета MUSTHAVE", "https://htreviews.org/tobaccos/musthave/main/klubnichnyy-sorbet"),
        editorial("Низкая уверенность: официальное описание производителя не упоминает кислотность явно, источник вторичный."),
      ]),
      freshness: dim(6, "MEDIUM", [
        manufacturer("MUSTHAVE: официальное описание — «освежающий лёгкий десерт»", "https://musthave.ru/tabak-dlya-kalyana-musthave-klybnishnyi-sorbet/"),
        editorial("Числовое значение отражает прямое указание производителя на освежающий эффект сорбета."),
      ]),
      richness: dim(6, "MEDIUM", [
        manufacturer("MUSTHAVE: официальное описание — «насыщенным вкусом»", "https://musthave.ru/tabak-dlya-kalyana-musthave-klybnishnyi-sorbet/"),
        editorial("Числовое значение отражает заявленную производителем насыщенность вкуса при формулировке «лёгкий десерт»."),
      ]),
    },
    dominantNoteIds: ["BERRY", "CREAMY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "blackburn-na-rasslabone",
    dimensions: {
      sweetness: dim(8, "MEDIUM", [
        reviewAggregate("Розничные описания: банановое суфле с сушёным бананом и банановой жвачкой", "https://nn-kalyan.ru/tabak-dlya-kalyana-black-burn-na-rasslabone-bananovoe-sufle-feat-dzhigan-opisanie-miksy-otzyvy/"),
        editorial("Числовое значение отражает выраженную десертную сладость суфле, жвачки и сушёного банана."),
      ]),
      freshness: dim(1, "MEDIUM", [
        reviewAggregate("Розничные описания явно указывают на отсутствие холодящего эффекта у «На расслабоне»", "https://nn-kalyan.ru/tabak-dlya-kalyana-black-burn-na-rasslabone-bananovoe-sufle-feat-dzhigan-opisanie-miksy-otzyvy/"),
        editorial("Минимальное значение отражает прямое указание источника «без охлаждения»."),
      ]),
      richness: dim(7, "MEDIUM", [
        reviewAggregate("Розничные описания: сливочные ноты мороженого дополняют банановое суфле", "https://nn-kalyan.ru/tabak-dlya-kalyana-black-burn-na-rasslabone-bananovoe-sufle-feat-dzhigan-opisanie-miksy-otzyvy/"),
        editorial("Числовое значение отражает многослойность десертного профиля (суфле + жвачка + сливочные ноты)."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "DESSERT", "CREAMY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "blackburn-klyukvennyi-mors",
    dimensions: {
      sourness: dim(6, "LOW", [
        editorial("Независимое вкусовое описание не найдено. Оценка кислотности основана только на подтверждённом названии продукта «Клюквенный морс» — традиционном кисло-ягодном напитке; при появлении независимого источника оценку следует пересмотреть."),
      ]),
    },
    dominantNoteIds: ["BERRY", "BEVERAGE"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "blackburn-na-chille",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Розничное описание: «насыщенное сочетание спелого ананаса и кисло-сладкой маракуйи»", "https://hookah-voodoo.com/burn-black-dzhigan-na-chille-blekbern-dzhigan-tropicheskij-sok-100g"),
        editorial("Числовое значение отражает сладкую составляющую ананаса и маракуйи в формулировке «кисло-сладкая»."),
      ]),
      sourness: dim(6, "MEDIUM", [
        reviewAggregate("Отзывы: «кислинка чувствуется уверенная», сок с мякотью", "https://hookah-voodoo.com/burn-black-dzhigan-na-chille-blekbern-dzhigan-tropicheskij-sok-100g"),
        editorial("Числовое значение отражает явное указание на уверенную кислинку в пользовательских отзывах."),
      ]),
      richness: dim(6, "LOW", [
        reviewAggregate("Розничное описание: «сок с мякотью», насыщенное сочетание фруктов", "https://hookah-voodoo.com/burn-black-dzhigan-na-chille-blekbern-dzhigan-tropicheskij-sok-100g"),
        editorial("Низкая уверенность: указание на насыщенность носит общий рекламный характер."),
      ]),
    },
    dominantNoteIds: ["TROPICAL", "SOUR"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "musthave-blackberry",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Сводное описание: «сладкая спелая ежевика», раскрывается лёгкой сладостью", "https://htreviews.org/tobaccos/must-have/blackberry-17/"),
        editorial("Числовое значение отражает умеренную (не выраженную) сладость по формулировке «лёгкая сладость»."),
      ]),
      sourness: dim(4, "MEDIUM", [
        reviewAggregate("Сводное описание: терпкость и вкус ежевичных косточек на выдохе", "https://htreviews.org/tobaccos/must-have/blackberry-17/"),
        editorial("Числовое значение отражает вторичную, не доминирующую терпкую ноту."),
      ]),
    },
    dominantNoteIds: ["BERRY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "musthave-sour-berries",
    dimensions: {
      sourness: dim(7, "MEDIUM", [
        reviewAggregate("HTReviews: официальное описание «яркий микс кислых лесных ягод»", "https://htreviews.org/tobaccos/musthave/main/sour-berries"),
        editorial("Числовое значение отражает прямое указание на выраженную кислотность в названии и описании."),
      ]),
    },
    dominantNoteIds: ["BERRY", "SOUR"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "blackburn-tic-tac",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Розничные описания: вкус апельсиновых конфет Tic Tac — сладко-мятный", "https://hookah-voodoo.com/burn-black-tik-tak-apelsinovyj-tik-tak-100g"),
        editorial("Числовое значение отражает конфетную сладость, характерную для драже Tic Tac."),
      ]),
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Розничные описания: мятная свежесть как часть вкуса Tic Tac", "https://hookah-voodoo.com/burn-black-tik-tak-apelsinovyj-tik-tak-100g"),
        editorial("Числовое значение отражает явное упоминание мятной свежести в описании."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "MINT", "CANDY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "blackburn-ice-baby",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Розничные описания: «умеренно сладкий, умеренно кислый, умеренно свежий» ягодный сорбет с грейпфрутом", "https://hookah-voodoo.com/burn-black-guf-ice-baby-yagodnyj-sorbet-s-grejpfrutom-200g"),
        editorial("Числовое значение отражает формулировку «умеренно сладкий»."),
      ]),
      sourness: dim(5, "MEDIUM", [
        reviewAggregate("Розничные описания: лёгкая кислинка грейпфрута на выдохе", "https://hookah-voodoo.com/burn-black-guf-ice-baby-yagodnyj-sorbet-s-grejpfrutom-200g"),
        editorial("Числовое значение отражает формулировку «умеренно кислый»."),
      ]),
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Розничные описания: «лёгкая ледяная свежесть» дополняет ягодный сорбет", "https://hookah-voodoo.com/burn-black-guf-ice-baby-yagodnyj-sorbet-s-grejpfrutom-200g"),
        editorial("Числовое значение отражает прямое указание на ледяную свежесть."),
      ]),
    },
    dominantNoteIds: ["BERRY", "CITRUS", "COOLING"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "musthave-sour-tropic",
    dimensions: {
      sourness: dim(7, "MEDIUM", [
        manufacturer("MUSTHAVE: официальное описание «натуральный тропический коктейль с выразительной кислинкой»", "https://musthave.ru/tabak-dlya-kalyana-musthave-sour-tropic/"),
        editorial("Числовое значение отражает прямое указание производителя на выразительную кислинку."),
      ]),
    },
    dominantNoteIds: ["TROPICAL", "SOUR"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "musthave-sour-citrus",
    dimensions: {
      sweetness: dim(5, "MEDIUM", [
        reviewAggregate("Розничное описание: «апельсин придаёт сладость и сочность, смягчая кислую основу»", "https://mkv.allkalyans.com/product/tabak-musthave-sour-citrus-kislyy-tsitrus/"),
        editorial("Числовое значение отражает умеренную, смягчающую роль сладости апельсина в кислой основе."),
      ]),
      sourness: dim(7, "MEDIUM", [
        reviewAggregate("Розничное описание: «лайм добавляет свежую и бодрящую кислинку с лёгкой горчинкой цедры»", "https://mkv.allkalyans.com/product/tabak-musthave-sour-citrus-kislyy-tsitrus/"),
        editorial("Числовое значение отражает выраженную кислотность лайма и грейпфрута, заявленную как основа вкуса."),
      ]),
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Розничное описание: «лайм добавляет свежую... кислинку»", "https://mkv.allkalyans.com/product/tabak-musthave-sour-citrus-kislyy-tsitrus/"),
        editorial("Числовое значение отражает прямое указание на свежесть цитрусовых нот."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "SOUR"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sapphire-crown-pineapple-fanta",
    dimensions: {
      sweetness: dim(6, "LOW", [
        reviewAggregate("Отзывы: вкус напоминает ананасовый десерт, ананас ощущается на протяжении всей сессии", "https://irecommend.ru/content/tabak-sapphire-crown-0"),
        editorial("Низкая уверенность: описание источника краткое и не детализирует интенсивность сладости."),
      ]),
    },
    dominantNoteIds: ["TROPICAL", "DESSERT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "urban-soul-pineapple",
    dimensions: {},
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "nash-white-line-karamel-tsitrus",
    dimensions: {
      sweetness: dim(7, "LOW", [
        reviewAggregate("HTReviews: сводное описание — «карамель ощущается ярко, цитрус почти не чувствуется»", "https://htreviews.org/tobaccos/nash-nash/osnovnaia/karamel-tsitrus"),
        editorial("Низкая уверенность: описание получено через агрегированный поиск, отдельная проверка страницы источника не подтвердила текст напрямую."),
      ]),
    },
    dominantNoteIds: ["DESSERT", "CITRUS"],
    overallConfidence: "LOW",
  },
];

const issues = validateProductFlavorProfiles(profiles);
if (issues.length) throw new ProductFlavorProfileError("Product flavor profile registry is invalid.", issues);

const deepFreeze = <T>(item: T): Readonly<T> => {
  if (item !== null && typeof item === "object" && !Object.isFrozen(item)) {
    Object.freeze(item);
    Object.values(item as Record<string, unknown>).forEach(nested => deepFreeze(nested));
  }
  return item;
};

export const PRODUCT_FLAVOR_PROFILE_REGISTRY: readonly ProductFlavorProfile[] = deepFreeze([...profiles]);
