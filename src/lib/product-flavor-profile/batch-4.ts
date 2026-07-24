import { dim, editorial, reviewAggregate } from "./evidence-helpers";
import type { ProductFlavorProfile } from "./types";

export const PRODUCT_FLAVOR_PROFILES_BATCH_4: readonly ProductFlavorProfile[] = [
  {
    canonicalProductId: "sapphire-crown-mejumi",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Розничное описание: «сладко-сливочный фруктовый аромат», молочный напиток с ананасом и дыней", "https://xn--80adi1cd.xn--p1ai/smesi/sapphire-crown/sc-100/sapphire-crown-mejumi-molochnyy-napitok-s-ananasom-i-dyney-100gr.html"),
        editorial("Числовое значение отражает прямое указание на сладко-сливочный характер вкуса."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Розничное описание прямо указывает: «мягкая крепость 5 из 10»", "https://xn--80adi1cd.xn--p1ai/smesi/sapphire-crown/sc-100/sapphire-crown-mejumi-molochnyy-napitok-s-ananasom-i-dyney-100gr.html"),
        editorial("Значение взято напрямую из явно заявленной числовой шкалы для этого конкретного вкуса."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу MeJuMi."),
      ]),
    },
    dominantNoteIds: ["TROPICAL", "CREAMY", "BEVERAGE"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "brusko-medium-tsitrusovyi-chai",
    dimensions: {
      sweetness: dim(5, "MEDIUM", [
        reviewAggregate("Официальное описание: «яркий вкус чуть сладкого чёрного чая с добавлением дольки спелого лимона»", "https://htreviews.org/tobaccos/brusko/brusko-lineika-medium/tsitrusovyy-chay"),
        editorial("Числовое значение отражает формулировку «чуть сладкого» — сладость умеренная, не выраженная."),
      ]),
      sourness: dim(4, "MEDIUM", [
        reviewAggregate("Отзывы: «приятное сочетание сладкого чёрного чая и цитрусовой кислинки лимона»", "https://htreviews.org/tobaccos/brusko/brusko-lineika-medium/tsitrusovyy-chay"),
        editorial("Числовое значение отражает вторичную, не доминирующую цитрусовую кислинку."),
      ]),
      strength: dim(4, "LOW", [
        reviewAggregate("Источники расходятся: общее описание бренда — «средней крепости», спецификация этой конкретной позиции — «с низкой крепостью»", "https://kalyan-nn.com/index.php?route=product/product&path=127_130&product_id=4352"),
        editorial("Низкая уверенность из-за прямого расхождения между общим позиционированием бренда и спецификацией конкретного вкуса."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Официальная спецификация: «средняя нарезка, средняя жаростойкость — характеристики чайной смеси BRUSKO»", "https://kalyan-nn.com/index.php?route=product/product&path=127_130&product_id=4352"),
        editorial("Значение подтверждено напрямую для этой чайной смеси."),
      ]),
    },
    dominantNoteIds: ["TEA", "CITRUS"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "husky-caipirinha",
    dimensions: {
      sourness: dim(5, "MEDIUM", [
        reviewAggregate("Отзывы: «что-то кислое, ягодное, напоминает алкогольный коктейль»", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/smokingroom/huskycaip"),
        editorial("Числовое значение отражает прямое указание отзыва на кислый характер вкуса."),
      ]),
      strength: dim(4, "LOW", [
        reviewAggregate("Основная линейка Husky описана как «средне-лёгкой крепости»", "https://obninsk.s2brf.ru/blog/obzory-tovarov/vkusy-zhidkosti-husky/"),
        editorial("Низкая уверенность: значение перенесено с уровня линейки, отдельного подтверждения для конкретного вкуса Caipirinha не найдено."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "ALCOHOL", "FRUIT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "husky-marzipan",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Отзывы: вкус марципана, «сахарная пудра особенно выражена в начале»", "https://htreviews.org/tobaccos/husky/main/marzipan"),
        editorial("Числовое значение отражает прямое указание на выраженную сахарную сладость."),
      ]),
      intensity: dim(3, "MEDIUM", [
        reviewAggregate("Отзывы: миндаль присутствует «как базовый, ненавязчивый компонент», «вкус в целом не особо сильный»", "https://htreviews.org/tobaccos/husky/main/marzipan"),
        editorial("Низкое числовое значение отражает прямое указание отзывов на невыраженность, ненасыщенность вкуса."),
      ]),
      strength: dim(4, "LOW", [
        reviewAggregate("Основная линейка Husky описана как «средне-лёгкой крепости»", "https://obninsk.s2brf.ru/blog/obzory-tovarov/vkusy-zhidkosti-husky/"),
        editorial("Низкая уверенность: значение перенесено с уровня линейки."),
      ]),
    },
    dominantNoteIds: ["NUT", "CANDY", "DESSERT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "husky-passion-fruit",
    dimensions: {
      sourness: dim(1, "MEDIUM", [
        reviewAggregate("Отзыв именно на Husky Passion Fruit: «вкус водянистый, кислотности нет вообще»", "https://htreviews.org/tobaccos/husky/main"),
        editorial("Числовое значение отражает прямое отрицание кислотности в отзыве на конкретно эту позицию Husky; описания вкуса маракуйи других марок (Fumari, Serbetli, Spectrum, Bonche), встретившиеся в том же поиске, намеренно не использованы как evidence для этого товара."),
      ]),
      strength: dim(4, "LOW", [
        reviewAggregate("Основная линейка Husky описана как «средне-лёгкой крепости»", "https://obninsk.s2brf.ru/blog/obzory-tovarov/vkusy-zhidkosti-husky/"),
        editorial("Низкая уверенность: значение перенесено с уровня линейки."),
      ]),
    },
    dominantNoteIds: ["TROPICAL", "FRUIT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "husky-pineapple",
    dimensions: {
      strength: dim(4, "LOW", [
        reviewAggregate("Основная линейка Husky описана как «средне-лёгкой крепости»", "https://obninsk.s2brf.ru/blog/obzory-tovarov/vkusy-zhidkosti-husky/"),
        editorial("Низкая уверенность: значение перенесено с уровня линейки. Найденные отзывы на конкретный вкус («водянистый», «не лучший ананас») описывают общее качество, а не конкретные вкусовые измерения модели, поэтому не использованы для sweetness/sourness/freshness."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "overdose-coffee",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Отзывы: «довольно сладкий и молочный вкус... лёгкий кофе с сахаром и молоком»", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/overdose/overdose_100_gr/14831/"),
        editorial("Числовое значение отражает прямое указание на выраженную сладость с молочным оттенком."),
      ]),
      strength: dim(8, "MEDIUM", [
        reviewAggregate("Обзорные источники неоднократно подтверждают: OVERDOSE — табак «значительно выше средней крепости»", "https://hookahhouse.ru/company/news/tabak_overdose_opisanie_top_vkusov_zabivka/"),
        editorial("Числовое значение отражает устойчивую, многократно подтверждённую характеристику бренда."),
      ]),
      heatResistance: dim(9, "MEDIUM", [
        reviewAggregate("Обзорные источники: OVERDOSE «экстремально жаростоек, не перегревается даже при плотной забивке»", "https://burncommunity.com/old/tpost/4oxc28y901-krepkii-tabak-na-primere-overdose"),
        editorial("Числовое значение отражает устойчивую характеристику бренда, единую для линейки."),
      ]),
    },
    dominantNoteIds: ["COFFEE", "CREAMY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "overdose-strawberry",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «нежный и сладкий вкус спелой клубники», сладкий нектарный аромат", "https://htreviews.org/tobaccos/overdose/overdose-main/strawberry"),
        editorial("Числовое значение отражает прямое указание на выраженную сладость спелой клубники."),
      ]),
      freshness: dim(5, "MEDIUM", [
        reviewAggregate("Официальное описание: «освежающая нота на выдохе» дополняет тёплый ягодный аромат", "https://htreviews.org/tobaccos/overdose/overdose-main/strawberry"),
        editorial("Числовое значение отражает прямое указание на освежающую ноту, хотя и не доминирующую."),
      ]),
      strength: dim(8, "MEDIUM", [
        reviewAggregate("Обзорные источники неоднократно подтверждают: OVERDOSE — табак «значительно выше средней крепости»", "https://hookahhouse.ru/company/news/tabak_overdose_opisanie_top_vkusov_zabivka/"),
        editorial("Числовое значение отражает устойчивую характеристику бренда."),
      ]),
      heatResistance: dim(9, "MEDIUM", [
        reviewAggregate("Обзорные источники: OVERDOSE «экстремально жаростоек, не перегревается даже при плотной забивке»", "https://burncommunity.com/old/tpost/4oxc28y901-krepkii-tabak-na-primere-overdose"),
        editorial("Числовое значение отражает устойчивую характеристику бренда, единую для линейки."),
      ]),
    },
    dominantNoteIds: ["BERRY", "FRUIT"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "banger-apricot-jam",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Официальное описание: «нежный кисло-сладкий абрикосовый джем»; отзыв: «сладкий, похож на сладкий мандарин с грейпфрутом»", "https://xn--80adi1cd.xn--p1ai/smesi/banger/banger-25gr/banger-apricot-jam-abrikosovyy-dzhem-25gr.html"),
        editorial("Числовое значение отражает согласие официального описания и отзыва в оценке сладости, несмотря на расхождение во мнении о выраженности абрикоса."),
      ]),
      sourness: dim(4, "MEDIUM", [
        reviewAggregate("Официальное описание: «кисло-сладкий абрикосовый джем» с нотами лимонной цедры", "https://xn--80adi1cd.xn--p1ai/smesi/banger/banger-25gr/banger-apricot-jam-abrikosovyy-dzhem-25gr.html"),
        editorial("Числовое значение отражает вторичную кислую составляющую (цитрусовая цедра) на фоне сладости джема."),
      ]),
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Обзорный источник прямо указывает: «крепость ниже средней»", "https://nn-kalyan.ru/banger-opisanie-vkusy-miksy-otzyvy/"),
        editorial("Значение отражает прямое указание источника для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "CITRUS"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "dozaj-mint",
    dimensions: {},
    dominantNoteIds: ["MINT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "duft-solo-cherry-juice",
    dimensions: {
      sourness: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: «настоящий вишнёвый сок: кислый с лёгкой сладостью и яркой терпкостью вишнёвой мякоти»", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/cherry-juice"),
        editorial("Числовое значение отражает прямое указание на доминирующую кислотность вишнёвого сока."),
      ]),
      sweetness: dim(4, "MEDIUM", [
        reviewAggregate("Обзорные источники: «кислый с лёгкой сладостью»", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/cherry-juice"),
        editorial("Низкое числовое значение отражает вторичный, не доминирующий характер сладости."),
      ]),
      juiciness: dim(6, "MEDIUM", [
        reviewAggregate("Обзорные источники: «вкус сочный, более кислый, чем сладкий»", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/cherry-juice"),
        editorial("Числовое значение отражает прямое указание источника на сочность вкуса."),
      ]),
      strength: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: Cherry Juice — «один из топовых продуктов крепкой табачной линейки Duft»", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/cherry-juice"),
        editorial("Числовое значение отражает прямое указание на принадлежность к крепкой линейке."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Обзор бренда: Duft сочетает «среднюю крепость никотина и жаростойкость»", "https://spb.smogus.me/shop/tob/duft-cherry-juice-vishnevyj-sok/"),
        editorial("Жаростойкость — свойство обработки листа, единое для бренда."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "SOUR"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "duft-solo-orange-zest",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Обзорные источники: «кисло-сладкий вкус спелого апельсина», хороший баланс сладости и кислой цедры", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/orange-zest"),
        editorial("Числовое значение отражает прямое указание на сладость спелого апельсина."),
      ]),
      sourness: dim(5, "MEDIUM", [
        reviewAggregate("Обзорные источники: «лёгкая горчинка апельсиновой цедры», кислая составляющая цедры", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/orange-zest"),
        editorial("Числовое значение отражает баланс с кислой составляющей, указанный источником."),
      ]),
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Обзорные источники: «бодрит благодаря сладко-кислому вкусу с лёгкой свежестью»", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/orange-zest"),
        editorial("Числовое значение отражает прямое указание на освежающий, бодрящий эффект."),
      ]),
      strength: dim(7, "MEDIUM", [
        reviewAggregate("Обзорные источники: «табак довольно крепкий, с насыщенными ароматами»", "https://htreviews.org/tobaccos/duft/duft-lineika-solo/orange-zest"),
        editorial("Числовое значение отражает прямое указание источника для этого конкретного вкуса."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Обзор бренда: Duft сочетает «среднюю крепость никотина и жаростойкость»", "https://spb.smogus.me/shop/tob/duft-cherry-juice-vishnevyj-sok/"),
        editorial("Жаростойкость — свойство обработки листа, единое для бренда."),
      ]),
    },
    dominantNoteIds: ["CITRUS"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "endorphin-apple",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("HTReviews: официальное описание — «сладкое зелёное яблоко»", "https://htreviews.org/tobaccos/endorphin/endorphin-main/apple"),
        editorial("Числовое значение отражает прямое официальное описание вкуса."),
      ]),
      sourness: dim(3, "MEDIUM", [
        reviewAggregate("HTReviews: официальное описание указывает «с лёгкой терпкостью», свежее хрустящее яблоко", "https://htreviews.org/tobaccos/endorphin/endorphin-main/apple"),
        editorial("Низкое числовое значение отражает вторичную, не доминирующую терпкость."),
      ]),
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Бренд Endorphin описан как «лёгкий и дымный табак для кальяна»", "https://nagrevateltabaka.ru/kalyany/tabak/tabak-endorphin-endorfin-opisanie-krepost-vkysy-cena"),
        editorial("Значение отражает официальную характеристику бренда как лёгкого табака."),
      ]),
    },
    dominantNoteIds: ["FRUIT"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "endorphin-napoleon",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «сливочно-ванильный аромат с нотами выпечки, посыпанной сахарной пудрой»", "https://hookah-voodoo.com/endorphin-napoleon-tort-napoleon-60g"),
        editorial("Числовое значение отражает прямое указание на десертную сладость торта «Наполеон»."),
      ]),
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Официальное описание прямо указывает: «уровень крепости низкий»", "https://hookah-voodoo.com/endorphin-napoleon-tort-napoleon-60g"),
        editorial("Значение подтверждено напрямую для этого конкретного вкуса, а не только на уровне бренда."),
      ]),
    },
    dominantNoteIds: ["VANILLA", "CREAMY", "BAKERY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "fake-holod",
    dimensions: {
      freshness: dim(8, "MEDIUM", [
        reviewAggregate("Официальное описание: «чистая мятная база для освежения любого микса»; отзывы — «холодящий эффект держится дольше, чем у конкурентов»", "https://dymteam.ru/product/tabak-dlya-kalyana-fake-s-aromatom-holodok-holod-40-gr"),
        editorial("Числовое значение отражает многократное прямое указание на выраженный и стойкий холодящий эффект."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Обзорные источники прямо указывают: «крепость умеренная»", "https://okolokalyana.ru/blog/articles/faketbc"),
        editorial("Значение отражает прямое указание источника для этого конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["MINT", "COOLING"],
    overallConfidence: "MEDIUM",
  },
];
