import { dim, editorial, manufacturer, reviewAggregate } from "./evidence-helpers";
import type { ProductFlavorProfile } from "./types";

export const PRODUCT_FLAVOR_PROFILES_BATCH_2: readonly ProductFlavorProfile[] = [
  {
    canonicalProductId: "daily-hookah-slivochnyi-krem",
    dimensions: {
      sweetness: dim(8, "MEDIUM", [
        reviewAggregate("Розничные описания: «сладкий вкус и аромат нежного сливочного крема», крем для профитролей", "https://nn-kalyan.ru/daily-hookah-slivochnyy-krem-opisanie-miksy/"),
        editorial("Числовое значение отражает выраженную десертную сладость взбитого сливочного крема."),
      ]),
      intensity: dim(6, "LOW", [
        reviewAggregate("Розничные описания: «насыщенный, полный и яркий вкус», при этом описывается как «воздушный, нежный»", "https://nn-kalyan.ru/daily-hookah-slivochnyy-krem-opisanie-miksy/"),
        editorial("Низкая уверенность: источники одновременно называют вкус «насыщенным» и «воздушным/лёгким», сигнал противоречивый."),
      ]),
      strength: dim(3, "MEDIUM", [
        reviewAggregate("Обзор бренда: «крепость Daily Hookah остаётся лёгкой», лист Вирджиния хорошо промыт, натуральный никотин невысокий", "https://www.4kalyans.ru/tabak/daily-hookah-2.html"),
        editorial("Числовое значение отражает многократно подтверждённое официальной и независимой стороной указание на лёгкую крепость бренда."),
      ]),
      heatResistance: dim(7, "MEDIUM", [
        reviewAggregate("Обзор бренда: Daily Hookah «импонирует жаростойкими характеристиками»", "https://kalyan-expert.ru/tabak-daily-hookah.html"),
        editorial("Жаростойкость — свойство листа и обработки, единое для бренда."),
      ]),
    },
    dominantNoteIds: ["CREAMY", "DESSERT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "deus-skittles",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Розничное описание: «кисло-сладкие фруктовые конфеты», вдохновлено драже Skittles", "https://nn-kalyan.ru/tabak-dlya-kalyana-deus-skittles-kislo-sladkie-konfety/"),
        editorial("Числовое значение отражает конфетную сахарную сладость, прямо заявленную в описании."),
      ]),
      sourness: dim(6, "MEDIUM", [
        reviewAggregate("Розничное описание: «коктейль фруктовых нот с приятной терпкостью» в названии «кисло-сладкие конфеты»", "https://nn-kalyan.ru/tabak-dlya-kalyana-deus-skittles-kislo-sladkie-konfety/"),
        editorial("Числовое значение отражает явное указание на кислую составляющую в самом названии позиции ритейлера."),
      ]),
      strength: dim(7, "LOW", [
        reviewAggregate("Обзор бренда: табак DEUS описывается как «довольно крепкий», крепость выше средней", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_deus_top_vkusov_lineyki_otzyvy_krepost_zabivka/"),
        editorial("Низкая уверенность: заявление качественное, без официальной числовой шкалы, и относится к бренду, а не к конкретному вкусу Skittles."),
      ]),
      heatResistance: dim(6, "LOW", [
        reviewAggregate("Источники расходятся: одни называют жаростойкость DEUS высокой, другие — «точнее, средне-высокой», рекомендуют не пережигать", "https://eltobacco.ru/deus/"),
        editorial("Низкая уверенность из-за прямого расхождения источников по уровню жаростойкости бренда."),
      ]),
    },
    dominantNoteIds: ["CANDY", "FRUIT", "SOUR"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "overdose-masala-tea",
    dimensions: {
      intensity: dim(8, "MEDIUM", [
        manufacturer("OVERDOSE: официальный каталог вкусов подтверждает позицию «Чай Масала»", "https://overdose.pro/taste"),
        reviewAggregate("Обзорные источники: «пряный индийский чай со специями и лёгким молочным шлейфом... насыщенный восточный аромат»", "https://hookahhouse.ru/company/news/tabak_overdose_opisanie_top_vkusov_zabivka/"),
        editorial("Числовое значение отражает прямое указание на насыщенный, плотный аромат пряного чая."),
      ]),
      strength: dim(8, "MEDIUM", [
        reviewAggregate("Обзорные источники неоднократно подтверждают: OVERDOSE — табак «значительно выше средней крепости»", "https://hookahhouse.ru/company/news/tabak_overdose_opisanie_top_vkusov_zabivka/"),
        editorial("Числовое значение отражает устойчивую, многократно подтверждённую независимыми источниками характеристику бренда."),
      ]),
      heatResistance: dim(9, "MEDIUM", [
        reviewAggregate("Обзорные источники: OVERDOSE «экстремально жаростоек, не перегревается даже при плотной забивке на 3-4 углях»", "https://burncommunity.com/old/tpost/4oxc28y901-krepkii-tabak-na-primere-overdose"),
        editorial("Числовое значение отражает устойчивую характеристику бренда, единую для линейки."),
      ]),
    },
    dominantNoteIds: ["TEA", "SPICE", "CREAMY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "urban-soul-berry-marmalade",
    dimensions: {
      sweetness: dim(7, "MEDIUM", [
        reviewAggregate("Розничное описание: «яркий ягодный букет и мармеладная сладость»", "https://hookah-voodoo.com/urban-soul-berry-marmalade-yagodnyj-marmelad-125g"),
        editorial("Числовое значение отражает прямое указание на мармеладную (кондитерскую) сладость."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("Розничное описание прямо указывает численную крепость: «средняя крепость (5/10)»", "https://hookah-voodoo.com/urban-soul-berry-marmalade-yagodnyj-marmelad-125g"),
        editorial("Числовое значение взято напрямую из явно заявленной для этого вкуса числовой шкалы производителя."),
      ]),
      heatResistance: dim(6, "MEDIUM", [
        reviewAggregate("Обзор бренда: Urban Soul «имеет жаростойкость выше среднего»", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/blog/article/88"),
        editorial("Жаростойкость — официальная спецификация бренда, единая для линейки."),
      ]),
    },
    dominantNoteIds: ["BERRY", "CANDY"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "blackburn-shock-raspberry",
    dimensions: {
      sourness: dim(8, "MEDIUM", [
        reviewAggregate("HTReviews: официальное обозначение вкуса — «Кислая малина»", "https://htreviews.org/tobaccos/black-burn/black-burn-main/raspberry-shock"),
        reviewAggregate("Обзорные источники: линейка SHOCK описана как выраженно кислая, «сourness даже усиливается по ходу курения»", "https://oshisha.cc/news/top_10_vkusov_black_burn/"),
        editorial("Высокое числовое значение отражает как официальное название «Кислая малина», так и независимые обзоры."),
      ]),
      sweetness: dim(3, "MEDIUM", [
        reviewAggregate("Обзорные источники: «лёгкое сладкое послевкусие», сливочная нота с намёком на клубнику к концу сессии", "https://oshisha.cc/news/top_10_vkusov_black_burn/"),
        editorial("Низкое числовое значение отражает второстепенный характер сладости на фоне доминирующей кислинки."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: указана средняя крепость согласно официальной спецификации", "https://htreviews.org/tobaccos/black-burn/black-burn-main/raspberry-shock"),
        editorial("Значение соответствует официальной крепости, указанной для этого конкретного вкуса."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        manufacturer("BlackBurn: официальное заявление о повышенной жаростойкости (кукурузный сироп)", "https://www.blckburn.com/"),
        editorial("Жаростойкость — свойство обработки листа, единое для всей линейки бренда."),
      ]),
    },
    dominantNoteIds: ["BERRY", "SOUR"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "overdose-jelly-grape",
    dimensions: {
      sweetness: dim(6, "LOW", [
        manufacturer("OVERDOSE: официальный каталог вкусов подтверждает позицию «Виноградный джем»", "https://overdose.pro/taste"),
        reviewAggregate("Источники расходятся: одни описывают «виноградный джем с насыщенным сладким послевкусием», другие — «минимальная сладость, хорошо сбалансирован»", "https://burncommunity.com/old/tpost/4oxc28y901-krepkii-tabak-na-primere-overdose"),
        editorial("Среднее значение с низкой уверенностью из-за прямого противоречия между источниками по интенсивности сладости."),
      ]),
      sourness: dim(3, "LOW", [
        reviewAggregate("Обзорные источники: «слегка терпкий виноградный вкус»", "https://burncommunity.com/old/tpost/4oxc28y901-krepkii-tabak-na-primere-overdose"),
        editorial("Низкое числовое значение отражает формулировку «слегка терпкий» как второстепенную ноту."),
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
    dominantNoteIds: ["FRUIT", "CANDY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "blackburn-green-tea",
    dimensions: {
      freshness: dim(7, "MEDIUM", [
        reviewAggregate("Розничные описания: вкус «бодрит и одновременно расслабляет... освежающий эффект»", "https://hookah-voodoo.com/burn-black-green-tea-zelenyj-chaj-100g"),
        editorial("Числовое значение отражает прямое указание на освежающий, бодрящий эффект зелёного чая."),
      ]),
      sweetness: dim(3, "MEDIUM", [
        reviewAggregate("Розничные описания: «насыщенный вкус свежезаваренного чая с лёгким сладким послевкусием»", "https://hookah-voodoo.com/burn-black-green-tea-zelenyj-chaj-100g"),
        editorial("Низкое числовое значение отражает второстепенный характер сладости на фоне травяной чайной основы."),
      ]),
      intensity: dim(6, "LOW", [
        reviewAggregate("Розничные описания: «насыщенный», «бархатистый вкус зелёного чая»", "https://hookah-voodoo.com/burn-black-green-tea-zelenyj-chaj-100g"),
        editorial("Низкая уверенность: описание насыщенности носит общий рекламный характер без детализации."),
      ]),
      strength: dim(5, "LOW", [
        manufacturer("BlackBurn: официальная заявленная крепость бренда — «Средняя»", "https://www.blckburn.com/taste"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, независимого подтверждения для конкретного вкуса Green Tea не найдено."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        manufacturer("BlackBurn: официальное заявление о повышенной жаростойкости (кукурузный сироп)", "https://www.blckburn.com/"),
        editorial("Жаростойкость — свойство обработки листа, единое для всей линейки бренда."),
      ]),
    },
    dominantNoteIds: ["TEA", "HERBAL"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "jam-arbuznyi-rondo",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        reviewAggregate("Обзорные источники: «приятный сладкий арбуз с нотой именно рондо», напоминает жвачку Orbit с арбузом", "https://hookahblog.ru/kalyannye-smesi/jam/obzor-kalyannoy-smesi-jam/"),
        editorial("Числовое значение отражает прямое указание на сладкий, конфетно-жевательный характер вкуса."),
      ]),
      freshness: dim(5, "LOW", [
        reviewAggregate("Обзорные источники: «насыщенный арбузный вкус с лёгкой прохладой» (мятная нота Rondo)", "https://hookahblog.ru/kalyannye-smesi/jam/obzor-kalyannoy-smesi-jam/"),
        editorial("Низкая уверенность: те же источники также описывают вкус как «не очень яркий», сигнал по свежести слабый."),
      ]),
      strength: dim(2, "MEDIUM", [
        reviewAggregate("Отзыв на конкретный вкус: «абсолютно нулевая крепость, несмотря на табак в составе»; бренд в целом описан как «крайне лёгкий, крепости в JAM нет и не стоит её искать»", "https://htreviews.org/tobaccos/jam/osnovnaia/arbuznyi-rondo"),
        editorial("Числовое значение отражает как прямое подтверждение для конкретного вкуса, так и общую характеристику бренда."),
      ]),
      heatResistance: dim(5, "LOW", [
        reviewAggregate("Обзор бренда: смесь JAM имеет «умеренную жаростойкость»", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/blog/articles/jam-tobacco"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, отдельного подтверждения для конкретного вкуса нет."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "MINT", "CANDY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "jam-spelaya-marakuiya",
    dimensions: {
      strength: dim(2, "LOW", [
        reviewAggregate("Обзор бренда: JAM описан как «крайне лёгкий, на уровне BRUSKO и смесей Buta, Adalya, Sherbetli», крепости в JAM нет", "https://hookahblog.ru/kalyannye-smesi/jam/obzor-kalyannoy-smesi-jam/"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, отдельного подтверждения для вкуса «Спелая маракуйя» не найдено."),
      ]),
      heatResistance: dim(5, "LOW", [
        reviewAggregate("Обзор бренда: смесь JAM имеет «умеренную жаростойкость»", "https://xn--80aa2aaecocbb1nmb.xn--p1ai/blog/articles/jam-tobacco"),
        editorial("Низкая уверенность: заявление относится к бренду в целом."),
      ]),
    },
    dominantNoteIds: ["TROPICAL"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "hook-limon-laim",
    dimensions: {
      sourness: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: отзыв на «Лимон Лайм» — «лимон и лайм хорошо считываются, кислотность могла бы быть выразительнее», цитрусовая цедра и эфирные масла", "https://htreviews.org/tobaccos/hook-by-chabacco/main"),
        editorial("Умеренное числовое значение отражает формулировку отзыва «кислотность могла бы быть сильнее» — кислинка присутствует, но не доминирует."),
      ]),
      strength: dim(7, "LOW", [
        reviewAggregate("Обзорные источники: крепость Hook «действительно высокая», «серьёзно накрывает через полчаса»", "https://ivankalyanshop.ru/blog-obzor-hook"),
        editorial("Низкая уверенность: заявление качественное (о скорости никотинового эффекта технологии Nexus), без официальной числовой шкалы для конкретного вкуса."),
      ]),
    },
    dominantNoteIds: ["CITRUS", "CANDY"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "blackburn-almond-pear",
    dimensions: {
      strength: dim(5, "LOW", [
        manufacturer("BlackBurn: официальная заявленная крепость бренда — «Средняя»", "https://www.blckburn.com/taste"),
        editorial("Низкая уверенность: значение перенесено с уровня бренда, независимого подтверждения для конкретного вкуса «Миндальная груша» не найдено."),
      ]),
      heatResistance: dim(8, "MEDIUM", [
        manufacturer("BlackBurn: официальное заявление о повышенной жаростойкости (кукурузный сироп)", "https://www.blckburn.com/"),
        editorial("Жаростойкость — свойство обработки листа, единое для всей линейки бренда."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "NUT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "overdose-samarkand-melon",
    dimensions: {
      sweetness: dim(5, "LOW", [
        reviewAggregate("Пользовательские отзывы: «есть некоторая сладость», но часть отзывов хотела бы более выраженный сладкий вкус", "https://burncommunity.com/old/tpost/4oxc28y901-krepkii-tabak-na-primere-overdose"),
        editorial("Умеренное значение с низкой уверенностью: отзывы расходятся во мнении о выраженности сладости дыни."),
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
    dominantNoteIds: ["FRUIT"],
    overallConfidence: "LOW",
  },
  {
    canonicalProductId: "husky-kiwano",
    dimensions: {
      strength: dim(4, "MEDIUM", [
        reviewAggregate("Обзор бренда: «основная линейка табака Husky средне-лёгкой крепости на основе бленда Берли и Вирджинии»", "https://obninsk.s2brf.ru/blog/obzory-tovarov/vkusy-zhidkosti-husky/"),
        editorial("Числовое значение отражает официальную характеристику основной линейки бренда."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "TROPICAL"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "overdose-apple-juicy",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        manufacturer("OVERDOSE: официальный каталог вкусов подтверждает позицию «Сочное яблоко»", "https://overdose.pro/taste"),
        reviewAggregate("Розничное описание: «яркий кисло-сладкий вкус сочного зелёного яблока»", "https://www.novasens.by/ugol-i-smesi-dlja-kaljana/tabak-dlja-kaljana/overdose/tabak-dlya-kalyana-overdose-sochnoe-yabloko-apple-juicy8"),
        editorial("Числовое значение отражает баланс кисло-сладкого профиля зелёного яблока."),
      ]),
      sourness: dim(6, "MEDIUM", [
        reviewAggregate("Розничное описание: «естественный, бодрящий и освежающий вкус с лёгкой пощипывающей кислинкой»", "https://www.novasens.by/ugol-i-smesi-dlja-kaljana/tabak-dlja-kaljana/overdose/tabak-dlya-kalyana-overdose-sochnoe-yabloko-apple-juicy8"),
        editorial("Числовое значение отражает прямое указание на «пощипывающую кислинку» зелёного яблока."),
      ]),
      freshness: dim(6, "MEDIUM", [
        reviewAggregate("Розничное описание: «бодрящий и освежающий вкус»", "https://www.novasens.by/ugol-i-smesi-dlja-kaljana/tabak-dlja-kaljana/overdose/tabak-dlya-kalyana-overdose-sochnoe-yabloko-apple-juicy8"),
        editorial("Числовое значение отражает прямое указание на освежающий эффект."),
      ]),
      juiciness: dim(8, "MEDIUM", [
        manufacturer("OVERDOSE: официальное название позиции — «Сочное яблоко»", "https://overdose.pro/taste"),
        reviewAggregate("Розничное описание: «сочного зелёного яблока, только что сорванного с дерева»", "https://www.novasens.by/ugol-i-smesi-dlja-kaljana/tabak-dlja-kaljana/overdose/tabak-dlya-kalyana-overdose-sochnoe-yabloko-apple-juicy8"),
        editorial("Высокое числовое значение отражает сочность, вынесенную в само официальное название позиции и подтверждённую независимым описанием."),
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
    dominantNoteIds: ["FRUIT", "SOUR", "FRESH"],
    overallConfidence: "MEDIUM",
  },
  {
    canonicalProductId: "sapphire-crown-bitter-cherry",
    dimensions: {
      sweetness: dim(6, "MEDIUM", [
        manufacturer("HTReviews: официальное описание позиции — «Спелая вишня»", "https://htreviews.org/tobaccos/sapphire-crown/main/bitter-cherry"),
        editorial("Числовое значение отражает базовую сладость спелой вишни, заявленную производителем."),
      ]),
      intensity: dim(6, "LOW", [
        reviewAggregate("Обзорные источники: горчинка косточки и лёгкий миндальный аромат «добавляют глубину и сложность» вкусу", "https://ivankalyanshop.ru/blog-noviy-tabak-sapphire"),
        editorial("Низкая уверенность: горькая нота косточки не тождественна насыщенности и не имеет отдельного измерения в модели; используется как косвенный сигнал сложности вкуса."),
      ]),
      strength: dim(5, "MEDIUM", [
        reviewAggregate("HTReviews: указана средняя крепость, сессия курения длится около 50 минут", "https://htreviews.org/tobaccos/sapphire-crown/main/bitter-cherry"),
        editorial("Значение соответствует официальной крепости, указанной для этого конкретного вкуса."),
      ]),
      heatResistance: dim(8, "LOW", [
        reviewAggregate("Обзор бренда: «главная особенность Sapphire Crown — высокая жаростойкость»", "https://hookahhouse.ru/company/news/obzor_tabaka_dlya_kalyana_sapphire_crown_top_10_vkusov_novinki/"),
        editorial("Низкая уверенность: заявление относится к бренду в целом, а не к конкретному вкусу Bitter Cherry."),
      ]),
    },
    dominantNoteIds: ["FRUIT", "NUT"],
    overallConfidence: "LOW",
  },
];
