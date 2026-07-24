import { dim, editorial, manufacturer, reviewAggregate } from "./evidence-helpers";
import type { ProductFlavorProfile } from "./types";

export const PRODUCT_FLAVOR_PROFILES_BATCH_3: readonly ProductFlavorProfile[] = [
  {
    canonicalProductId: "chabacco-medium-belgian-cider",
    dimensions: {
      intensity: dim(3, "MEDIUM", [
        reviewAggregate("Отзывы: «очень слабое выражение алкогольной ноты», «вкус начинается хорошо, но быстро выветривается»", "https://htreviews.org/tobaccos/chabacco/chabacco-lineika-medium/belgian-cider"),
        editorial("Низкое числовое значение отражает прямое указание источников на быстрое затухание и слабую выраженность вкуса."),
      ]),
      strength: dim(4, "MEDIUM", [
        reviewAggregate("Линейка Chabacco Medium описана как основная линейка бренда со средне-лёгкой крепостью", "https://htreviews.org/tobaccos/chabacco-linejka-medium/belgian-cider/"),
        editorial("Значение отражает официальную характеристику линейки Medium."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        reviewAggregate("Обзор линейки Chabacco Medium: «отличается высокой жаростойкостью»", "https://kalyanpro.com/tabak-dlya-kalyana/bestabachnaya-smes-dlya-kalyana-chabacco-medium-frosty-mint"),
        editorial("Жаростойкость указана для линейки Chabacco Medium, к которой относится этот вкус."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "ALCOHOL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "chabacco-mix-apelsin-slivki",
    dimensions: {
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Официальная спецификация линейки Chabacco Mix: «Крепость: Лёгкая»", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Значение отражает официальную спецификацию линейки Mix, к которой относится этот вкус."),
      ]),
      heatResistance: dim(3, "MEDIUM", [
        reviewAggregate("Официальная спецификация линейки Chabacco Mix: «Жаростойкость: Низкая»", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Значение отражает официальную спецификацию линейки Mix; отличается от общих маркетинговых заявлений о жаростойкости бренда в целом."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "CREAMY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "chabacco-mix-bananovyi-milksheik",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Отзывы: «сливочно, мягко, не приторно», насыщенный банановый молочный коктейль", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Умеренное значение отражает прямое указание «не приторно» — сладость заметная, но не чрезмерная."),
      ]),
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Официальная спецификация линейки Chabacco Mix: «Крепость: Лёгкая»", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Значение отражает официальную спецификацию линейки Mix."),
      ]),
      heatResistance: dim(3, "MEDIUM", [
        reviewAggregate("Официальная спецификация линейки Chabacco Mix: «Жаростойкость: Низкая»", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Значение отражает официальную спецификацию линейки Mix."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "CREAMY", "DESSERT"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "chabacco-mix-fruktovyi-led",
    dimensions: {
      sourness: dim(6, "MEDIUM", [
        reviewAggregate("Отзывы: «хорошо ощущается кислое киви»", "https://htreviews.org/tobaccos/chabacco/chabacco-mix/fruit-ice"),
        editorial("Числовое значение отражает прямое указание отзыва на заметную кислинку киви."),
      ]),
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «прохладный сливочный сорбет из клубники с лёгкой кислинкой тропического киви»", "https://hookah-voodoo.com/smes-chabacco-mix-medium-fruit-ice-fruktovyj-led-50g"),
        editorial("Числовое значение отражает прямое указание на прохладный, сорбетный характер вкуса."),
      ]),
      strength: dim(5, "LOW", [
        reviewAggregate("Розничное описание указывает «крепость средняя» для данной конкретной позиции", "https://hookah-voodoo.com/smes-chabacco-mix-medium-fruit-ice-fruktovyj-led-50g"),
        editorial("Низкая уверенность: указание расходится с официальной спецификацией линейки Mix («лёгкая»), возможна путаница между Mix и Mix Medium в розничном описании."),
      ]),
      heatResistance: dim(3, "MEDIUM", [
        reviewAggregate("Официальная спецификация линейки Chabacco Mix: «Жаростойкость: Низкая»", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Значение отражает официальную спецификацию линейки Mix."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "CREAMY", "COOLING"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "chabacco-mix-grenadin-drops",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «сладкий аромат гранатовых дропсов»", "https://hookah-voodoo.com/smes-chabacco-medium-grenadine-drops-grenadin-drops-50g"),
        editorial("Числовое значение отражает прямое указание на сладкий характер вкуса."),
      ]),
      freshness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «ультра-свежие ментоловые дропсы на основе гранатового сиропа»", "https://hookah-voodoo.com/smes-chabacco-medium-grenadine-drops-grenadin-drops-50g"),
        editorial("Числовое значение отражает прямое указание на ментоловый, освежающий характер вкуса."),
      ]),
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Официальная спецификация линейки Chabacco Mix: «Крепость: Лёгкая»", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Значение отражает официальную спецификацию линейки Mix."),
      ]),
      heatResistance: dim(3, "MEDIUM", [
        reviewAggregate("Официальная спецификация линейки Chabacco Mix: «Жаростойкость: Низкая»", "https://xn--80adi1cd.xn--p1ai/smesi/chabacco/chabacco-mix-50/chabacco-mix-banana-milkshake-bananovyy-milksheyk-50gr.html"),
        editorial("Значение отражает официальную спецификацию линейки Mix."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "COOLING", "CANDY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "chabacco-moroznaya-myata",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «классическая сладкая мята с холодком»", "https://kalyanpro.com/tabak-dlya-kalyana/bestabachnaya-smes-dlya-kalyana-chabacco-medium-frosty-mint"),
        editorial("Числовое значение отражает прямое указание на сладкий характер мятного вкуса."),
      ]),
      freshness: dim(8, "MEDIUM", [
        reviewAggregate("Официальное описание: «яркий аромат свежей мяты... с холодком»", "https://kalyanpro.com/tabak-dlya-kalyana/bestabachnaya-smes-dlya-kalyana-chabacco-medium-frosty-mint"),
        editorial("Числовое значение отражает прямое указание на выраженный холодящий/освежающий эффект."),
      ]),
      heatResistance: dim(7, "LOW", [
        reviewAggregate("Общий обзор бренда Chabacco: «отличается высокой жаростойкостью»", "https://kalyan-expert.ru/chabacco.html"),
        editorial("Низкая уверенность: для этого конкретного вкуса подтверждена принадлежность к бренду без конкретной линии (productLine не подтверждена), поэтому используется только общее заявление о бренде, а не данные конкретной линии Medium/Mix с их различающейся жаростойкостью."),
      ]),
    },
    dominantNoteIds: ["MINT", "COOLING"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "element-air-milky-mouse",
    dimensions: {
      sweetness: dim(8, "MEDIUM", [
        reviewAggregate("Обзорные источники: «сладость, напоминающая любимое сгущённое молоко», нежный сливочный вкус", "https://htreviews.org/tobaccos/element-linejka-vozduh/milky-mouse/"),
        editorial("Числовое значение отражает многократно подтверждённую выраженную сладость сгущённого молока."),
      ]),
      juiciness: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: сгущённое молоко описано как «сладкое и очень сочное»", "https://htreviews.org/tobaccos/element-linejka-vozduh/milky-mouse/"),
        editorial("Числовое значение отражает прямое указание источника на сочность вкуса."),
      ]),
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Линейка Element Air описана как «лёгкая табачная смесь» для любителей сладкого дыма", "https://shop.ivankalyan.ru/tobacco/element/vozduh"),
        editorial("Значение отражает официальную характеристику линейки Air, к которой относится этот вкус."),
      ]),
    },
    dominantNoteIds: ["CREAMY", "DESSERT", "CHOCOLATE"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "musthave-maple-pecan",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «сладкий кленовый сироп... пекан доминирует с выраженной сладостью кленового сиропа»", "https://musthave.ru/tabak-dlya-kalyana-musthave-maple-pecan/"),
        editorial("Числовое значение отражает прямое указание на выраженную сладость кленового сиропа."),
      ]),
      intensity: dim(6, "LOW", [
        reviewAggregate("Обзорные источники: «даёт насыщенный дым и долго держит вкус»", "https://hookah-voodoo.com/must-have-maple-pecan-pekan-v-klenovom-sirope-25g"),
        editorial("Низкая уверенность: указание общего рекламного характера о насыщенности дыма, не вкуса напрямую."),
      ]),
      strength: dim(5, "LOW", [
        manufacturer("MUSTHAVE: официальная заявленная крепость бренда — «оптимальная средняя крепость»", "https://musthave.ru/o-brende/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Розничные спецификации MUSTHAVE указывают среднюю жаростойкость бренда", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/musthave/"),
        editorial("Жаростойкость — свойство обработки листа, единое для бренда."),
      ]),
    },
    dominantNoteIds: ["NUT", "BAKERY", "DESSERT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "musthave-pineapple-rings",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: «сладкий с лёгкой кислинкой, напоминает консервированный ананас», «идеально сладко-кислый»", "https://hookah-voodoo.com/must-have-pineapple-rings-ananasovye-kolca-125g"),
        editorial("Числовое значение отражает прямое указание на выраженную сладость."),
      ]),
      sourness: dim(4, "MEDIUM", [
        reviewAggregate("Обзорные источники: «сладкий с лёгкой кислинкой», как консервированный ананас", "https://hookah-voodoo.com/must-have-pineapple-rings-ananasovye-kolca-125g"),
        editorial("Числовое значение отражает вторичную, не доминирующую кислинку на фоне сладости."),
      ]),
      juiciness: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: «сочные сладкие ананасовые кольца, маринованные в собственном соку»", "https://hookah-voodoo.com/must-have-pineapple-rings-ananasovye-kolca-125g"),
        editorial("Числовое значение отражает прямое указание источника на сочность ананасовых колец."),
      ]),
      strength: dim(5, "LOW", [
        manufacturer("MUSTHAVE: официальная заявленная крепость бренда — «оптимальная средняя крепость»", "https://musthave.ru/o-brende/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного подтверждения для конкретного вкуса не найдено."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Розничные спецификации MUSTHAVE указывают среднюю жаростойкость бренда", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/musthave/"),
        editorial("Жаростойкость — свойство обработки листа, единое для бренда."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "musthave-vanilla-cream",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Обзорные источники: «нежный, деликатный, с лёгкой сладковатой ноткой»", "https://hookah-voodoo.com/must-have-vanilla-cream-vanilnyj-krem-125g"),
        editorial("Умеренное значение отражает формулировку «лёгкая сладковатая нотка» — сладость присутствует, но не доминирует."),
      ]),
      intensity: dim(5, "LOW", [
        reviewAggregate("Обзорные источники расходятся: «обволакивающий и насыщенный» вкус против «едва уловимый фон» ноты сгущённого молока", "https://hookah-voodoo.com/must-have-vanilla-cream-vanilnyj-krem-125g"),
        editorial("Низкая уверенность из-за прямого расхождения источников в оценке насыщенности вкуса."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Обзорные источники прямо указывают: «имеет среднюю крепость»", "https://hookah-voodoo.com/must-have-vanilla-cream-vanilnyj-krem-125g"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса, а не только на уровне бренда."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Розничные спецификации MUSTHAVE указывают среднюю жаростойкость бренда", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/musthave/"),
        editorial("Жаростойкость — свойство обработки листа, единое для бренда."),
      ]),
    },
    dominantNoteIds: ["VANILLA", "CREAMY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-apple-strudel",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: «свежая выпечка со сладко-терпкими яблоками», интенсивный вкус яблочного пирога", "https://hookah-voodoo.com/sapphire-crown-apple-strudel-yablochnyj-shtrudel-100g-akciznyj"),
        editorial("Числовое значение отражает прямое указание на сладость начинки штруделя."),
      ]),
      sourness: dim(3, "MEDIUM", [
        reviewAggregate("Обзорные источники: «сладко-терпкие яблоки» (sweet-tart apples)", "https://hookah-voodoo.com/sapphire-crown-apple-strudel-yablochnyj-shtrudel-100g-akciznyj"),
        editorial("Низкое числовое значение отражает вторичную терпкую ноту на фоне доминирующей сладости."),
      ]),
      strength: dim(5, "LOW", [
        reviewAggregate("Обзор бренда Sapphire Crown указывает стабильную среднюю крепость линейки", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельная страница HTReviews для этого конкретного вкуса не подтвердила крепость напрямую."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Apple Strudel."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "BAKERY", "SPICE"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-blueberry-granola",
    dimensions: {
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Обзорные источники прямо указывают: «вкус черники со средней крепостью»", "https://xn--80adiofecevfafgteden4poa.xn--p1ai/product/tabak-dlya-kalyana-sapphire-crown-blueberry-granola-ovsyanka-s-chernikoy-200gr"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Blueberry Granola."),
      ]),
    },
    dominantNoteIds: ["BERRY", "BAKERY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-fragrant-blackcurrant",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Обзорные источники: «терпко-сладкий вкус спелой чёрной смородины... естественная сладость, которая долго держится»", "https://thehookahlab.com/products/sapphire-crown-fragrant-blackcurrant-hookah-flavor"),
        editorial("Числовое значение отражает прямое указание на естественную, стойкую сладость."),
      ]),
      sourness: dim(5, "MEDIUM", [
        reviewAggregate("Обзорные источники: «терпко-сладкий... лёгкая терпкость в дыме»", "https://thehookahlab.com/products/sapphire-crown-fragrant-blackcurrant-hookah-flavor"),
        editorial("Числовое значение отражает прямое указание на терпкую составляющую вкуса."),
      ]),
      intensity: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: «насыщенный аромат и глубокая ягодная интенсивность... ароматный, интенсивный»", "https://thehookahlab.com/products/sapphire-crown-fragrant-blackcurrant-hookah-flavor"),
        editorial("Числовое значение отражает прямое и неоднократное указание на интенсивность вкуса."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Обзорные источники прямо указывают: «оценивается как средняя крепость»", "https://thehookahlab.com/products/sapphire-crown-fragrant-blackcurrant-hookah-flavor"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Fragrant Black Currant."),
      ]),
    },
    dominantNoteIds: ["BERRY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-kiwi-fruit",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("HTReviews: «натуральный сладкий киви»", "https://htreviews.org/tobaccos/sapphire-crown/main/kiwi-fruit"),
        editorial("Числовое значение отражает прямое официальное описание вкуса."),
      ]),
      sourness: dim(3, "MEDIUM", [
        reviewAggregate("Обзорные источники: «сладкий тропический киви с лёгкой кислинкой»", "https://worldhookahmarket.com/product/sapphire-crown-200-gr-kiwi-fruit/"),
        editorial("Низкое числовое значение отражает вторичную, не доминирующую кислинку."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: официальная крепость «Средняя», пользовательская оценка «Средне-лёгкая»", "https://htreviews.org/tobaccos/sapphire-crown/main/kiwi-fruit"),
        editorial("Значение соответствует официальной крепости производителя для этого конкретного вкуса."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Kiwi Fruit."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-lemon-lime",
    dimensions: {
      sourness: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: «терпко-кислый лимон на переднем плане с выраженными нотами цедры»", "https://htreviews.org/tobaccos/sapphire-crown"),
        editorial("Числовое значение отражает прямое указание на выраженную кислотность лимона и цедры."),
      ]),
      strength: dim(5, "LOW", [
        reviewAggregate("Обзор бренда Sapphire Crown указывает стабильную среднюю крепость линейки", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного per-SKU подтверждения крепости для Lemon Lime не найдено."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Lemon Lime."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "SOUR"],
    overallConfidence: "LOW",
  },
];
