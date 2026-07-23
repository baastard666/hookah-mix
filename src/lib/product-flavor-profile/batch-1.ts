import { dim, editorial, manufacturer, reviewAggregate } from "./evidence-helpers";
import type { ProductFlavorProfile } from "./types";

export const PRODUCT_FLAVOR_PROFILES_BATCH_1: readonly ProductFlavorProfile[] = [
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
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: официальная крепость «Средняя», пользовательская оценка «Средне-лёгкая»", "https://htreviews.org/tobaccos/sapphire-crown/main/dried-plum"),
        editorial("Значение соответствует официальной крепости производителя; пользовательская оценка немного ниже."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Dried Plum."),
      ]),
    },
    dominantNoteIds: ["FRUIT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-go-bananas",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("HTReviews: агрегированное описание вкуса Sapphire Crown Go Bananas! — «натуральный банан с приятной сладостью»", "https://htreviews.org/tobaccos/sapphire-crown/main/go-bananas"),
        editorial("Числовое значение выведено редакционно из формулировки «приятная сладость» без указания на интенсивность."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: официальная крепость «Средняя», пользовательская оценка «Средне-лёгкая»", "https://htreviews.org/tobaccos/sapphire-crown/main/go-bananas"),
        editorial("Значение соответствует официальной крепости производителя; пользовательская оценка немного ниже."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Go Bananas!."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "LOW",
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
      intensity: dim(6, "MEDIUM", [
        manufacturer("MUSTHAVE: официальное описание — «насыщенным вкусом»", "https://musthave.ru/tabak-dlya-kalyana-musthave-klybnishnyi-sorbet/"),
        editorial("Числовое значение отражает заявленную производителем насыщенность вкуса при формулировке «лёгкий десерт»."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: официальная крепость «Средняя», пользовательская оценка «Средне-лёгкая»", "https://htreviews.org/tobaccos/musthave/main/klubnichnyy-sorbet"),
        editorial("Значение соответствует официальной крепости производителя для этого конкретного вкуса."),
      ]),
      heatResistance: dim(5, "LOW", [
        reviewAggregate("Розничные спецификации MUSTHAVE указывают среднюю жаростойкость бренда", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/musthave/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу."),
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
      intensity: dim(7, "MEDIUM", [
        reviewAggregate("Розничные описания: сливочные ноты мороженого дополняют банановое суфле", "https://nn-kalyan.ru/tabak-dlya-kalyana-black-burn-na-rasslabone-bananovoe-sufle-feat-dzhigan-opisanie-miksy-otzyvy/"),
        editorial("Числовое значение отражает многослойность десертного профиля (суфле + жвачка + сливочные ноты)."),
      ]),
      strength: dim(8, "MEDIUM", [
        reviewAggregate("Розничное описание прямо указывает: «высокая крепость никотина»", "https://nn-kalyan.ru/tabak-dlya-kalyana-black-burn-na-rasslabone-bananovoe-sufle-feat-dzhigan-opisanie-miksy-otzyvy/"),
        editorial("Числовое значение отражает прямое указание источника именно для этого вкуса."),
      ]),
      heatResistance: dim(7, "MEDIUM", [
        reviewAggregate("Розничное описание прямо указывает на «повышенную жаростойкость от натурального кукурузного сиропа»", "https://nn-kalyan.ru/tabak-dlya-kalyana-black-burn-na-rasslabone-bananovoe-sufle-feat-dzhigan-opisanie-miksy-otzyvy/"),
        editorial("Числовое значение отражает прямое указание источника именно для этого вкуса."),
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
      strength: dim(5, "LOW", [
        manufacturer("BlackBurn: официальная заявленная крепость бренда — «Средняя»", "https://www.blckburn.com/taste"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, независимого подтверждения для конкретного вкуса «Клюквенный морс» не найдено."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        manufacturer("BlackBurn: официальное заявление о повышенной жаростойкости (кукурузный сироп)", "https://www.blckburn.com/"),
        editorial("Жаростойкость — свойство обработки листа, единое для всей линейки бренда, поэтому уверенность выше, чем для крепости конкретного вкуса."),
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
      intensity: dim(6, "LOW", [
        reviewAggregate("Розничное описание: «сок с мякотью», насыщенное сочетание фруктов", "https://hookah-voodoo.com/burn-black-dzhigan-na-chille-blekbern-dzhigan-tropicheskij-sok-100g"),
        editorial("Низкая уверенность: указание на насыщенность носит общий рекламный характер."),
      ]),
      juiciness: dim(7, "MEDIUM", [
        reviewAggregate("Розничное описание: «как если бы мы выжали весь сок из мякоти фруктов»; отзывы — «сок с мякотью как будто»", "https://hookah-voodoo.com/burn-black-dzhigan-na-chille-blekbern-dzhigan-tropicheskij-sok-100g"),
        editorial("Числовое значение отражает прямое и неоднократное указание на сочность («сок с мякотью») и в описании, и в отзывах."),
      ]),
      strength: dim(8, "MEDIUM", [
        reviewAggregate("Розничное описание прямо указывает: «крепость табака указана как высокая»", "https://hookah-voodoo.com/burn-black-dzhigan-na-chille-blekbern-dzhigan-tropicheskij-sok-100g"),
        editorial("Числовое значение отражает прямое указание источника именно для этого вкуса."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        manufacturer("BlackBurn: официальное заявление о повышенной жаростойкости (кукурузный сироп)", "https://www.blckburn.com/"),
        editorial("Жаростойкость — свойство обработки листа, единое для всей линейки бренда."),
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
      juiciness: dim(6, "MEDIUM", [
        reviewAggregate("Сводное описание: аромат «лёгкий и ненавязчивый, но очень натуральный и сочный»", "https://htreviews.org/tobaccos/must-have/blackberry-17/"),
        editorial("Числовое значение отражает прямое указание источника на сочность ежевики."),
      ]),
      strength: dim(5, "LOW", [
        manufacturer("MUSTHAVE: официальная заявленная крепость бренда — «оптимальная средняя крепость»", "https://musthave.ru/o-brende/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельная страница HTReviews для этого конкретного вкуса не разрешилась при проверке."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Розничные спецификации MUSTHAVE указывают среднюю жаростойкость бренда", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/musthave/"),
        editorial("Жаростойкость — свойство обработки листа, единое для бренда, уверенность выше, чем для непроверенной по конкретному вкусу крепости."),
      ]),
    },
    dominantNoteIds: ["BERRY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "musthave-sour-berries",
    dimensions: {
      sourness: dim(7, "MEDIUM", [
        reviewAggregate("HTReviews: официальное описание «яркий микс кислых лесных ягод»", "https://htreviews.org/tobaccos/musthave/main/sour-berries"),
        editorial("Числовое значение отражает прямое указание на выраженную кислотность в названии и описании."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: официальная крепость «Средняя», пользовательская оценка «Средне-лёгкая»", "https://htreviews.org/tobaccos/musthave/main/sour-berries"),
        editorial("Значение соответствует официальной крепости производителя для этого конкретного вкуса."),
      ]),
      heatResistance: dim(5, "MEDIUM", [
        reviewAggregate("Розничные спецификации MUSTHAVE указывают среднюю жаростойкость бренда", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/musthave/"),
        editorial("Жаростойкость — свойство обработки листа, единое для бренда."),
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
      strength: dim(5, "LOW", [
        manufacturer("BlackBurn: официальная заявленная крепость бренда — «Средняя»", "https://www.blckburn.com/taste"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, независимого подтверждения для конкретного вкуса Tic Tac не найдено."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        manufacturer("BlackBurn: официальное заявление о повышенной жаростойкости (кукурузный сироп)", "https://www.blckburn.com/"),
        editorial("Жаростойкость — свойство обработки листа, единое для всей линейки бренда."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "MINT", "CANDY"],
    overallConfidence: "LOW",
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
      strength: dim(5, "LOW", [
        manufacturer("BlackBurn: официальная заявленная крепость бренда — «Средняя»", "https://www.blckburn.com/taste"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда; розничное описание упоминает лишь общую «сбалансированную крепость» без конкретики."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        manufacturer("BlackBurn: официальное заявление о повышенной жаростойкости (кукурузный сироп)", "https://www.blckburn.com/"),
        editorial("Жаростойкость — свойство обработки листа, единое для всей линейки бренда."),
      ]),
    },
    dominantNoteIds: ["BERRY", "CITRUS", "COOLING"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "musthave-sour-tropic",
    dimensions: {
      sourness: dim(7, "MEDIUM", [
        manufacturer("MUSTHAVE: официальное описание «натуральный тропический коктейль с выразительной кислинкой»", "https://musthave.ru/tabak-dlya-kalyana-musthave-sour-tropic/"),
        editorial("Числовое значение отражает прямое указание производителя на выразительную кислинку."),
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
    dominantNoteIds: ["TROPICAL", "SOUR"],
    overallConfidence: "LOW",
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
      juiciness: dim(6, "MEDIUM", [
        reviewAggregate("Розничное описание прямо указывает: «апельсин придаёт сладость и сочность»", "https://mkv.allkalyans.com/product/tabak-musthave-sour-citrus-kislyy-tsitrus/"),
        editorial("Числовое значение отражает прямое указание источника на сочность апельсиновой составляющей."),
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
    dominantNoteIds: ["CITRUS", "SOUR"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "sapphire-crown-pineapple-fanta",
    dimensions: {
      sweetness: dim(6, "LOW", [
        reviewAggregate("Отзывы: вкус напоминает ананасовый десерт, ананас ощущается на протяжении всей сессии", "https://irecommend.ru/content/tabak-sapphire-crown-0"),
        editorial("Низкая уверенность: описание источника краткое и не детализирует интенсивность сладости."),
      ]),
      juiciness: dim(7, "MEDIUM", [
        reviewAggregate("Официальное описание: «яркие и сочные ароматы спелого ананаса» (Pineapple Funta)", "https://htreviews.org/tobaccos/sapphire-crown/main/pineapple-funta"),
        editorial("Числовое значение отражает прямое указание источника на сочность ананаса в описании вкуса."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: официальная крепость «Средняя», пользовательская оценка «Средне-лёгкая»", "https://htreviews.org/tobaccos/sapphire-crown/main/pineapple-funta"),
        editorial("Значение соответствует официальной крепости производителя для этого конкретного вкуса."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Pineapple Funta."),
      ]),
    },
    dominantNoteIds: ["TROPICAL", "DESSERT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "urban-soul-pineapple",
    dimensions: {
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Обзор бренда: «крепость официальная — средняя»", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/blog/article/88"),
        editorial("Официальная спецификация бренда без указания отдельных отклонений по вкусам; применена как заявленная крепость линейки."),
      ]),
      heatResistance: dim(6, "MEDIUM", [
        reviewAggregate("Обзор бренда: «имеет жаростойкость выше среднего»", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/blog/article/88"),
        editorial("Жаростойкость — официальная спецификация бренда, единая для линейки."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "nash-white-line-karamel-tsitrus",
    dimensions: {
      sweetness: dim(7, "LOW", [
        reviewAggregate("HTReviews: сводное описание — «карамель ощущается ярко, цитрус почти не чувствуется»", "https://htreviews.org/tobaccos/nash-nash/osnovnaia/karamel-tsitrus"),
        editorial("Низкая уверенность: описание получено через агрегированный поиск, отдельная проверка страницы источника не подтвердила текст напрямую."),
      ]),
      strength: dim(6, "MEDIUM", [
        reviewAggregate("Сводное описание вкуса указывает крепость выше среднего; официальная спецификация линейки White Line подтверждает «крепость выше среднего»", "https://htreviews.org/tobaccos/nash/white-line"),
        editorial("Числовое значение подтверждено дважды: отдельно для вкуса и отдельно для линейки White Line."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        reviewAggregate("Обзор бренда: «одна из сильных сторон табака НАШ — жаростойкость, легко восстанавливается после перегрева»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_nash_top_10_vkusov_tabaka_nash/"),
        editorial("Жаростойкость — официальная характеристика бренда, единая для линейки."),
      ]),
    },
    dominantNoteIds: ["DESSERT", "CITRUS"],
    overallConfidence: "LOW",
  },
];
