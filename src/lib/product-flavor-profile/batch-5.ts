import { dim, editorial, reviewAggregate } from "./evidence-helpers";
import type { ProductFlavorProfile } from "./types";

export const PRODUCT_FLAVOR_PROFILES_BATCH_5: readonly ProductFlavorProfile[] = [
  {
    canonicalProductId: "fake-mumbai-tea",
    dimensions: {
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Официальная крепость указана как средняя, пользовательские оценки подтверждают среднюю крепость", "https://htreviews.org/tobaccos/fake/main/mumbai-tea"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса. Описания вкуса «Mumbai Tea» бренда Chabacco, встретившиеся в том же поиске, намеренно не использованы — это отдельный продукт другого производителя."),
      ]),
    },
    dominantNoteIds: ["TEA", "SPICE", "CREAMY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "hook-granatovyi",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «освежающий сладкий аромат нектара граната», лёгкая сладкая клубничная нота", "https://htreviews.org/tobaccos/hook-by-chabacco/main/granatovyy"),
        editorial("Числовое значение отражает прямое указание на сладкий характер нектара граната."),
      ]),
      sourness: dim(4, "MEDIUM", [
        reviewAggregate("Официальное описание: «лёгкая терпкость и приятные кислые нотки»", "https://htreviews.org/tobaccos/hook-by-chabacco/main/granatovyy"),
        editorial("Числовое значение отражает вторичную, не доминирующую кислотность."),
      ]),
      freshness: dim(5, "MEDIUM", [
        reviewAggregate("Официальное описание: «освежающий» аромат с заметной, но не долгой прохладой в начале", "https://htreviews.org/tobaccos/hook-by-chabacco/main/granatovyy"),
        editorial("Числовое значение отражает умеренную, не доминирующую охлаждающую нотку."),
      ]),
      strength: dim(6, "MEDIUM", [
        reviewAggregate("Официальная крепость этого вкуса — средне-крепкая", "https://htreviews.org/tobaccos/hook-by-chabacco/main/granatovyy"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "SOUR", "FRESH"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "hook-inzhirnyi",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «сладкий медовый аромат спелого инжира с лёгкими древесными нотами»", "https://htreviews.org/tobaccos/hook-by-chabacco/main/inzhirnyy"),
        editorial("Числовое значение отражает прямое указание на выраженную медовую сладость спелого инжира."),
      ]),
      strength: dim(6, "MEDIUM", [
        reviewAggregate("Официальная крепость этого вкуса — средне-крепкая", "https://htreviews.org/tobaccos/hook-by-chabacco/main/inzhirnyy"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "WOODY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "jam-granatovyi-sok",
    dimensions: {
      sourness: dim(6, "MEDIUM", [
        reviewAggregate("Отзывы: «уверенная кислинка с ароматом и вкусом гранатового сока», терпкий кисло-сладкий характер", "https://hookah-voodoo.com/smes-jam-granatovyj-sok-250g"),
        editorial("Числовое значение отражает прямое указание на выраженную, доминирующую кислотность гранатового сока."),
      ]),
      sweetness: dim(4, "MEDIUM", [
        reviewAggregate("Отзывы: «кисло-сладкий вкус терпкого гранатового сока»", "https://hookah-voodoo.com/smes-jam-granatovyj-sok-250g"),
        editorial("Низкое числовое значение отражает вторичный, не доминирующий характер сладости на фоне кислотности."),
      ]),
      strength: dim(2, "LOW", [
        reviewAggregate("Бренд JAM в целом классифицируется как «лёгкая» линейка без никотинового удара", "https://htreviews.org/tobaccos/jam"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "SOUR"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "jam-konfety-s-ananasom",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «яркий аромат ананасовых конфет», вкус в точности повторяет запах", "https://htreviews.org/tobaccos/jam/jam-main/konfety-s-ananasom"),
        editorial("Числовое значение отражает прямое указание на выраженную конфетную сладость."),
      ]),
      intensity: dim(3, "MEDIUM", [
        reviewAggregate("Отзывы: вкус точно попадает в образ, но «не хватает интенсивности»", "https://htreviews.org/tobaccos/jam/jam-main/konfety-s-ananasom"),
        editorial("Низкое числовое значение отражает прямое указание отзывов на невыраженность, ненасыщенность вкуса."),
      ]),
      strength: dim(2, "LOW", [
        reviewAggregate("Бренд JAM в целом классифицируется как «лёгкая» линейка без никотинового удара", "https://htreviews.org/tobaccos/jam"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда; отзывы на конкретный вкус расходятся вплоть до «крепость абсолютно нулевая»."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "CANDY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "jam-krasnaya-smorodina",
    dimensions: {
      sourness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «ягодный микс со вкусом красной смородины» с терпким привкусом веточек и листьев", "https://htreviews.org/tobaccos/jam/jam-main/krasnaya-smorodina"),
        editorial("Числовое значение отражает прямое указание на терпкость и травянистые ноты веточек смородины."),
      ]),
      strength: dim(2, "MEDIUM", [
        reviewAggregate("Официально и по оценкам пользователей — лёгкая крепость (указано напрямую на странице этого вкуса)", "https://htreviews.org/tobaccos/jam/jam-main/krasnaya-smorodina"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса, а не только на уровне бренда."),
      ]),
    },
    dominantNoteIds: ["BERRY", "SOUR"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "mattpear-ginger-feel",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Отзывы: «неожиданный древесный вкус, резкий и сладкий одновременно», хорошо запоминается", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/blog/article/23"),
        editorial("Числовое значение отражает прямое указание на выраженную, но не доминирующую сладость."),
      ]),
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Отзывы: «по-настоящему острый вкус — сладкий, свежий, древесный», приятный пряный имбирь с лёгкой резкостью", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/blog/article/23"),
        editorial("Числовое значение отражает прямое указание на свежий, острый характер имбиря."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Крепость этого вкуса указана как средняя", "https://www.uglistuff.ru/tabak-mattpear-50g-ginger-feelimbir/"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["SPICE", "WOODY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "nash-black-line-arbuz",
    dimensions: {
      strength: dim(6, "MEDIUM", [
        reviewAggregate("Спецификация конкретной позиции: «Крепость табака: Средняя»", "https://smolandshop.com/shop/tabak-nash/tabak-nash-hard/"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса; линейка Black Line в целом описана как заметно крепкая на 100% бёрли, что согласуется со значением выше средней точки шкалы."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "FRESH"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "peter-ralf-dolce-de-lechee",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Отзывы: «нежный сливочный вкус и карамельная сладость», напоминает вафельные трубочки со сгущённым молоком", "https://hookah-voodoo.com/peter-ralf-dolce-de-lechee-karamel-50g"),
        editorial("Числовое значение отражает прямое указание на выраженную сливочно-карамельную сладость."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Крепость указана как средняя (5 из 10)", "https://hookah-voodoo.com/peter-ralf-dolce-de-lechee-karamel-50g"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["DESSERT", "CREAMY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sarma-360-ogurechnyi-limonad",
    dimensions: {
      freshness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «освежающее сочетание огуречной свежести и лимонной кислинки»", "https://xn--80adiofecevfafgteden4poa.xn--p1ai/product/tabak-dlya-kalyana-sarma-360-krepkaya-ogurechnyy-limonad-200gr"),
        editorial("Числовое значение отражает прямое указание на выраженную огуречную свежесть."),
      ]),
      sourness: dim(4, "MEDIUM", [
        reviewAggregate("Официальное описание упоминает «лимонную кислинку»; отзывы расходятся в оценке выраженности огурца", "https://xn--80adiofecevfafgteden4poa.xn--p1ai/product/tabak-dlya-kalyana-sarma-360-krepkaya-ogurechnyy-limonad-200gr"),
        editorial("Умеренное числовое значение отражает вторичный, не всегда отчётливый кислый лимонный компонент."),
      ]),
      strength: dim(7, "LOW", [
        reviewAggregate("Источник описывает именно вариант «Крепкая Сарма 360» этого вкуса, где линейка использует «только американский лист Берли с яркими, но не перенасыщенными ароматами»", "https://xn--80adiofecevfafgteden4poa.xn--p1ai/product/tabak-dlya-kalyana-sarma-360-krepkaya-ogurechnyy-limonad-200gr"),
        editorial("Низкая уверенность: canonical-решение не различает подварианты «Крепкая»/«Лёгкая» линейки 360 как отдельные продукты, поэтому нет полной уверенности, что источник описывает именно ту физическую позицию, к которой привязан этот canonicalProductId."),
      ]),
    },
    dominantNoteIds: ["FRESH", "CITRUS"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sarma-classic-bananovoe-sufle",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Отзывы: «банан ощущается на всём протяжении, аромат курится ярко», сливочно-банановый аромат после вскрытия пачки", "https://htreviews.org/htr155479"),
        editorial("Числовое значение отражает прямое указание на выраженную сладость спелого банана и сливочного суфле."),
      ]),
      strength: dim(5, "LOW", [
        reviewAggregate("Линейка «Классическая Сарма» описана как линейка комфортной средней крепости", "https://hookahhouse.ru/company/news/obzor_tabak_sarma_dlya_kalyana_top_vkusy_lineyki_otzyvy_i_zabivka/"),
        editorial("Низкая уверенность: значение перенесено с уровня линейки, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "CREAMY", "DESSERT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "severnyi-krepkii-oreshek",
    dimensions: {
      sweetness: dim(5, "MEDIUM", [
        reviewAggregate("Официальное описание: «насыщенный, слегка сладковатый аромат лесного ореха», нежная сладость ядра", "https://htreviews.org/tobaccos/severnyy/main/krepkiy-oreshek"),
        editorial("Числовое значение отражает формулировку «слегка сладковатый» — сладость умеренная, не доминирующая."),
      ]),
      strength: dim(7, "MEDIUM", [
        reviewAggregate("Крепость указана напрямую: «Крепкая (7/10)»", "https://tabak-pochtoy.org/product/tabak-severnyj-krepkij-oreshek-250g/"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
      heatResistance: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «в меру жаростойкий, при перегреве легко восстанавливается»", "https://tabak-pochtoy.org/product/tabak-severnyj-krepkij-oreshek-250g/"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["NUT", "CHOCOLATE"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "severnyi-sekvoiya",
    dimensions: {
      intensity: dim(8, "MEDIUM", [
        reviewAggregate("Отзыв: «вкус хвои довольно приятный», рекомендация использовать в миксах — «сильный табак, который может перебивать другие вкусы»", "https://htreviews.org/tobaccos/severnyy/main/sekvoyya"),
        editorial("Числовое значение отражает прямое указание отзыва на выраженный, доминирующий характер вкуса хвои."),
      ]),
      strength: dim(6, "LOW", [
        reviewAggregate("Бренд Северный в целом описан как «крепость выше средней»", "https://kalyan-expert.ru/tabak-dlya-kalyana-severniy.html"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
    },
    dominantNoteIds: ["WOODY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "smoke-angels-firestarter",
    dimensions: {
      sweetness: dim(5, "MEDIUM", [
        reviewAggregate("Отзывы: «огненный вкус жвачки с корицей», сладкий аромат с пряным жгучим послевкусием", "https://htreviews.org/tobaccos/smoke-angels/osnovnaia/firestarter"),
        editorial("Числовое значение отражает прямое указание на сладкий, но не доминирующий характер жвачки на фоне жгучей корицы."),
      ]),
      freshness: dim(5, "MEDIUM", [
        reviewAggregate("Отзывы: «освежающий эффект», жгучая корица с нотами жвачки, «больше похоже на мяту»", "https://htreviews.org/tobaccos/smoke-angels/osnovnaia/firestarter"),
        editorial("Числовое значение отражает прямое указание на освежающий, ментоловый компонент послевкусия."),
      ]),
      strength: dim(5, "LOW", [
        reviewAggregate("Бренд Smoke Angels в целом описан как табак средней крепости, курится мягко без резкости", "https://nn-kalyan.ru/smoke-angels-opisanie-vkusy-miksy-otzyvy/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
    },
    dominantNoteIds: ["SPICE", "CANDY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "take-pineapple",
    dimensions: {
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Официальная крепость линейки Take — средняя (5 из 10); источник прямо указывает, что вся линейка «сделана по единой рецептуре, меняется только ароматическая добавка»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_take_top_vkusov_otzyvy_krepost_zabivka/"),
        editorial("Средняя, а не низкая уверенность: в отличие от типичного случая переиспользования бренд-уровня, источник прямо утверждает, что база и крепость едины для всей линейки по построению рецептуры, а не варьируются между вкусами. Собственного текстового описания вкуса Pineapple/Ananas не найдено — вкус отсутствует в проиндексированном списке HTReviews и не описан в доступных розничных карточках."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "MEDIUM",
  },
];
