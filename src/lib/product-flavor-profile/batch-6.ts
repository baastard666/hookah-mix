import { dim, editorial, reviewAggregate } from "./evidence-helpers";
import type { ProductFlavorProfile } from "./types";

export const PRODUCT_FLAVOR_PROFILES_BATCH_6: readonly ProductFlavorProfile[] = [
  {
    canonicalProductId: "urban-soul-strawberry",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «сладкая классическая клубника с нотками кислинки»", "https://htreviews.org/tobaccos/urban-soul/urban-soul-main/strawberry"),
        editorial("Числовое значение отражает прямое указание на классический сладкий характер клубники."),
      ]),
      sourness: dim(3, "MEDIUM", [
        reviewAggregate("Официальное описание: «с нотками кислинки»", "https://htreviews.org/tobaccos/urban-soul/urban-soul-main/strawberry"),
        editorial("Низкое числовое значение отражает вторичную, не доминирующую кислинку на фоне сладости."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Официальная крепость — средняя, по оценкам пользователей — средне-лёгкая", "https://htreviews.org/tobaccos/urban-soul/urban-soul-main/strawberry"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса. Отзывы на смесь «Strawberry Kiwi Grapefruit», встретившиеся в том же поиске, намеренно не использованы — это другой, многокомпонентный вкус."),
      ]),
    },
    dominantNoteIds: ["BERRY", "FRUIT", "SOUR"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "musthave-apple-drops",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «сочный натуральный вкус сладких свежих яблочных леденцов», умеренная конфетная сладость", "https://musthave.ru/tabak-dlya-kalyana-musthave-apple-drops/"),
        editorial("Числовое значение отражает прямое указание на выраженную конфетную сладость."),
      ]),
      sourness: dim(3, "MEDIUM", [
        reviewAggregate("Официальное описание: «лёгкая терпкость» на фоне сока зелёных яблок", "https://musthave.ru/tabak-dlya-kalyana-musthave-apple-drops/"),
        editorial("Низкое числовое значение отражает вторичную, не доминирующую терпкость."),
      ]),
      freshness: dim(5, "MEDIUM", [
        reviewAggregate("Официальное описание: «лёгкое охлаждение придаёт освежающий характер»", "https://musthave.ru/tabak-dlya-kalyana-musthave-apple-drops/"),
        editorial("Числовое значение отражает умеренную, не доминирующую охлаждающую нотку."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Крепость указана напрямую как средняя для этого конкретного вкуса", "https://htreviews.org/tobaccos/musthave/main/apple-drops"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "CANDY", "COOLING"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sapphire-crown-pumpkin-raf",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «сладость карамели», сладковато-мускатные оттенки тыквы", "https://htreviews.org/tobaccos/sapphire-crown/main/pumpkin-raf"),
        editorial("Числовое значение отражает прямое указание на карамельно-мускатную сладость."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Спецификация конкретной позиции: «Крепость табака: Средняя»", "https://xn--80adi1cd.xn--p1ai/smesi/sapphire-crown/sc-100/sapphire-crown-pumpkin-raf-tykvennyy-raf-100gr.html"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["COFFEE", "CREAMY", "DESSERT"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sapphire-crown-sunny-peach",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «нежный, притягательный аромат спелого персика», в целом приятный сладкий персик", "https://htreviews.org/tobaccos/sapphire-crown/main/sunny-peach"),
        editorial("Числовое значение отражает прямое указание на выраженную сладость спелого персика."),
      ]),
      sourness: dim(3, "MEDIUM", [
        reviewAggregate("Официальное описание: «лёгкая терпкость в послевкусии», лёгкая горчинка косточки при курении", "https://htreviews.org/tobaccos/sapphire-crown/main/sunny-peach"),
        editorial("Низкое числовое значение отражает вторичную, не доминирующую терпкость."),
      ]),
      strength: dim(5, "LOW", [
        reviewAggregate("Табак Sapphire Crown в целом описан как имеющий среднюю крепость (смесь Virginia и Burley)", "https://worldhookahmarket.com/product/sapphire-crown-200-gr-sunny-peach/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "SOUR"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-yuzu-honey",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: сочетание «японского цитруса юдзу со сладостью мёда»", "https://htreviews.org/tobaccos/sapphire-crown/main/yuzu-honey"),
        editorial("Числовое значение отражает прямое указание на медовую сладость."),
      ]),
      sourness: dim(5, "MEDIUM", [
        reviewAggregate("Официальное описание: вкус построен на «контрасте цитрусовой кислотности юдзу» со сладкими медовыми нотами", "https://htreviews.org/tobaccos/sapphire-crown/main/yuzu-honey"),
        editorial("Числовое значение отражает прямое указание на равнозначную по значимости цитрусовую кислотность."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Официальная крепость — средняя, по оценкам пользователей — средне-лёгкая", "https://htreviews.org/tobaccos/sapphire-crown/main/yuzu-honey"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "DESSERT"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "deus-perfume-black-afgano",
    dimensions: {
      strength: dim(7, "MEDIUM", [
        reviewAggregate("Крепость указана напрямую: «7 из 10 (крепкий)», рекомендован опытным курильщикам", "https://hookah-voodoo.com/deus-perfume-black-afgano-40g"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
      intensity: dim(8, "MEDIUM", [
        reviewAggregate("Официальное описание: многослойная композиция — «смолисто-дымный, тёмный и загадочный» аромат с нотами каннабиса, смол, дерева, кофейной горечи, уда и ладана", "https://hookah-voodoo.com/deus-perfume-black-afgano-40g"),
        editorial("Высокое числовое значение отражает прямое указание на насыщенную, многослойную композицию вкуса."),
      ]),
    },
    dominantNoteIds: ["WOODY", "SMOKY", "HERBAL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "element-earth-wildberry-mors",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «мощный аромат лесных ягод, сладость ягодного напитка на первом плане», черника даёт тёмную, округлую сладость", "https://smoxygen.com/products/element-wildberry-mors-water-hookah-tobacco"),
        editorial("Числовое значение отражает прямое указание на выраженную сладость ягодного морса."),
      ]),
      sourness: dim(4, "MEDIUM", [
        reviewAggregate("Официальное описание: красная смородина добавляет «свежую, естественную терпкость, которая уравновешивает сладость»", "https://smoxygen.com/products/element-wildberry-mors-water-hookah-tobacco"),
        editorial("Числовое значение отражает вторичную, уравновешивающую кислую составляющую."),
      ]),
      juiciness: dim(5, "MEDIUM", [
        reviewAggregate("Официальное описание: малина «добавляет сочности (juiciness) и слегка джемовую середину»", "https://smoxygen.com/products/element-wildberry-mors-water-hookah-tobacco"),
        editorial("Числовое значение отражает прямое указание источника на сочность вкуса."),
      ]),
      strength: dim(6, "LOW", [
        reviewAggregate("Линейка «Земля» описана как имеющая крепость чуть выше средней, на основе листа Берли", "https://ivankalyanshop.ru/blog-obzor-element-ogon"),
        editorial("Низкая уверенность: значение перенесено с уровня линейки, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
    },
    dominantNoteIds: ["BERRY", "FRUIT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sarma-360-dzhin",
    dimensions: {
      strength: dim(6, "MEDIUM", [
        reviewAggregate("Официальная крепость этого вкуса — средне-крепкая, по оценкам пользователей — средняя", "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360/dzhin"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["ALCOHOL", "HERBAL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sarma-360-gornaya-lavanda",
    dimensions: {
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «цветы лаванды с утончённой свежестью»", "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360/gornaya-lavanda"),
        editorial("Числовое значение отражает прямое указание на утончённую, не доминирующую свежесть."),
      ]),
      strength: dim(6, "MEDIUM", [
        reviewAggregate("Официальная крепость этого вкуса — средне-крепкая, по оценкам пользователей — средняя", "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360/gornaya-lavanda"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["FLORAL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sarma-360-light-shampanskoe",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «лёгкое сладкое игристое вино»", "https://htreviews.org/tobaccos/sarma/legkaya-sarma-360/shampanskoye"),
        editorial("Числовое значение отражает прямое указание на сладкий характер напитка."),
      ]),
      strength: dim(2, "MEDIUM", [
        reviewAggregate("Официальная крепость этого вкуса — лёгкая, по оценкам пользователей — лёгкая", "https://htreviews.org/tobaccos/sarma/legkaya-sarma-360/shampanskoye"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["ALCOHOL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sarma-360-persik",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «румяный персик с мягкой медовой сладостью»", "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360/persik"),
        editorial("Числовое значение отражает прямое указание на мягкую медовую сладость персика. Отзыв в списке вкусов линейки прямо называет этот вкус «фруктовым, а не сочным профилем», поэтому juiciness намеренно не заполнен."),
      ]),
      strength: dim(6, "MEDIUM", [
        reviewAggregate("Официальная крепость этого вкуса — средне-крепкая, по оценкам пользователей — средняя", "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360/persik"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["FRUIT"],
    overallConfidence: "MEDIUM",
  },
];
