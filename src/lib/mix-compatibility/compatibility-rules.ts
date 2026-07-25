import type { NoteCompatibilityRule,NoteSelector } from "./types";
import { createKnowledgeCategoryRule } from "./knowledge-adapter";

const slug=(...slugs:string[]):NoteSelector=>({slugs});
const category=(...categories:NonNullable<NoteSelector["categories"]>):NoteSelector=>({categories});
const either=(slugs:string[],categories:NonNullable<NoteSelector["categories"]>):NoteSelector=>({slugs,categories});
const positive=(id:string,left:NoteSelector,right:NoteSelector,weight:number,title:string,explanation:string):NoteCompatibilityRule=>({id,type:"positive",left,right,weight,title,technicalDescription:`Положительное правило ${id}`,explanation});
const caution=(id:string,left:NoteSelector,right:NoteSelector,weight:number,title:string,explanation:string,type:"caution"|"conflict"="caution"):NoteCompatibilityRule=>({id,type,left,right,weight,title,technicalDescription:`Правило осторожности ${id}`,explanation});
const coffee=either(["coffee"],["COFFEE"]),dairy=category("DAIRY"),dessert=category("DESSERT"),chocolate=either(["chocolate","dark-chocolate"],["CHOCOLATE"]),nut=category("NUT"),berry=category("BERRY"),citrus=category("CITRUS"),cooling=either(["mint"],["COOLING"]),drink=category("DRINK");

export const NOTE_COMPATIBILITY_RULES:readonly NoteCompatibilityRule[]=[
 positive("note.coffee-dairy",coffee,dairy,.7,"Кофе и молочная нота","Молочная нота может смягчить кофейную основу."),positive("note.coffee-dessert",coffee,dessert,.4,"Кофе и десерт","Десертная нота может поддержать кофейный профиль."),positive("note.coffee-vanilla",coffee,slug("vanilla"),.7,"Кофе и ваниль","Ваниль может округлить кофейный профиль."),positive("note.coffee-banana",coffee,slug("banana"),.7,"Кофе и банан","Банан может сформировать мягкое сочетание с кофе."),positive("note.coffee-nut",coffee,nut,.7,"Кофе и орех","Ореховые оттенки могут поддержать кофейную основу."),positive("note.coffee-chocolate",coffee,chocolate,.7,"Кофе и шоколад","Шоколад может усилить десертную сторону кофе."),
 positive("note.banana-dairy",slug("banana"),dairy,.7,"Банан и молочная нота","Молочная нота может сделать банан мягче."),positive("note.banana-vanilla",slug("banana"),slug("vanilla"),.7,"Банан и ваниль","Ваниль может поддержать сладость банана."),positive("note.banana-dessert",slug("banana"),dessert,.4,"Банан и десерт","Десертная основа может связать банановый профиль."),
 positive("note.coconut-dairy",slug("coconut"),dairy,.7,"Кокос и молочная нота","Молочная нота может поддержать кокос."),positive("note.coconut-chocolate",slug("coconut"),chocolate,.7,"Кокос и шоколад","Шоколад может дополнить кокосовый профиль."),positive("note.coconut-nut",slug("coconut"),nut,.4,"Кокос и орех","Ореховые ноты могут углубить кокос."),positive("note.chocolate-nut",chocolate,nut,.7,"Шоколад и орех","Ореховые ноты могут поддержать шоколад."),positive("note.chocolate-dairy",chocolate,dairy,.7,"Шоколад и молочная нота","Сливочность может смягчить шоколад."),
 positive("note.berry-dairy",berry,dairy,.4,"Ягоды и молочная нота","Молочная нота может смягчить ягодный профиль."),positive("note.berry-dessert",berry,dessert,.4,"Ягоды и десерт","Десертная основа может связать ягодные ноты."),positive("note.berry-vanilla",berry,slug("vanilla"),.4,"Ягоды и ваниль","Ваниль может округлить ягодную кислотность."),positive("note.mango-citrus",slug("mango"),citrus,.4,"Манго и цитрус","Цитрус может добавить манго свежести."),positive("note.tropical-citrus",category("TROPICAL"),citrus,.4,"Тропики и цитрус","Цитрус может освежить тропический профиль."),positive("note.citrus-cooling",citrus,cooling,.4,"Цитрус и холод","Умеренный холод может подчеркнуть цитрус."),
 positive("note.lemon-drink",slug("lemon"),drink,.4,"Лимон и напиток","Лимон может поддержать напиточный профиль."),positive("note.lemon-cola",slug("lemon"),slug("cola"),.7,"Лимон и кола","Лимон может добавить коле свежую кислотность."),positive("note.lime-cola",slug("lime"),slug("cola"),.7,"Лайм и кола","Лайм может подчеркнуть напиточный профиль колы."),positive("note.mint-citrus",slug("mint"),citrus,.7,"Мята и цитрус","Мята может подчеркнуть цитрусовую свежесть."),positive("note.mint-drink",slug("mint"),drink,.4,"Мята и напиток","Мята может поддержать прохладный напиточный профиль."),positive("note.peach-citrus",slug("peach"),citrus,.4,"Персик и цитрус","Цитрус может сбалансировать сладость персика."),positive("note.cinnamon-coffee",slug("cinnamon"),coffee,.4,"Корица и кофе","Корица может добавить кофе пряный акцент."),positive("note.cinnamon-dessert",slug("cinnamon"),dessert,.4,"Корица и десерт","Корица может поддержать десертный профиль."),positive("note.vanilla-dairy",slug("vanilla"),dairy,.7,"Ваниль и молочная нота","Молочная нота может поддержать ваниль."),positive("note.vanilla-dessert",slug("vanilla"),dessert,.4,"Ваниль и десерт","Ваниль может связать десертные ноты."),
 caution("note.coffee-cooling",coffee,cooling,-.5,"Кофе и холод","Сильный холод может приглушить тёплую кофейную основу."),caution("note.dairy-cooling",dairy,cooling,-.5,"Молочная нота и холод","Холод может сделать молочную ноту менее выраженной."),caution("note.floral-smoky",category("FLORAL"),category("SMOKY"),-.8,"Цветочные и дымные ноты","Есть риск конфликта цветочного и дымного направлений.","conflict"),caution("note.herbal-dessert",category("HERBAL"),dessert,-.4,"Травяная и десертная ноты","Травяная нота может спорить с плотной десертной основой."),
 createKnowledgeCategoryRule("BERRY","FLORAL"),
 createKnowledgeCategoryRule("COFFEE","CITRUS"),
 // ADR-019: 21 of the 22 newly-researched category-relations wired in (the 22nd, CITRUS+SPICE, is
 // NEUTRAL and createKnowledgeCategoryRule() intentionally throws for NEUTRAL - it produces no rule).
 createKnowledgeCategoryRule("MINT","BERRY"),
 createKnowledgeCategoryRule("MINT","CITRUS"),
 createKnowledgeCategoryRule("TEA","BERRY"),
 createKnowledgeCategoryRule("MINT","FRUIT"),
 createKnowledgeCategoryRule("MINT","TROPICAL"),
 createKnowledgeCategoryRule("MINT","CHOCOLATE"),
 createKnowledgeCategoryRule("DAIRY","TEA"),
 createKnowledgeCategoryRule("TEA","MINT"),
 createKnowledgeCategoryRule("FLORAL","TEA"),
 createKnowledgeCategoryRule("DAIRY","BAKERY"),
 createKnowledgeCategoryRule("DAIRY","CHOCOLATE"),
 createKnowledgeCategoryRule("DAIRY","FRUIT"),
 createKnowledgeCategoryRule("DAIRY","TROPICAL"),
 createKnowledgeCategoryRule("MINT","DESSERT"),
 createKnowledgeCategoryRule("CITRUS","BERRY"),
 createKnowledgeCategoryRule("FLORAL","MINT"),
 createKnowledgeCategoryRule("FLORAL","ALCOHOL"),
 // ADR-019 п.5: FLORAL+DAIRY - именно эта связь отсутствовала в диагностике Sarma+Сливки.
 createKnowledgeCategoryRule("FLORAL","DAIRY"),
 createKnowledgeCategoryRule("SPICE","BERRY"),
 createKnowledgeCategoryRule("SPICE","VANILLA"),
 createKnowledgeCategoryRule("COFFEE","BERRY"),
 // ADR-019 review resolution: these 3 pairs were originally left out of CATEGORY_RELATIONS as
 // conflicts (see docs/adr/ADR-019 review list), then explicitly resolved by the user to take the
 // new aggregated-research value. Wiring them here is what makes that decision actually affect
 // scoring - an updated CATEGORY_RELATIONS value with no createKnowledgeCategoryRule() call would
 // be inert, same gap this project already fixed once for the original 21 ADR-019 pairs.
 createKnowledgeCategoryRule("TEA","CITRUS"),
 createKnowledgeCategoryRule("DAIRY","BERRY"),
 createKnowledgeCategoryRule("SPICE","TEA"),
 // Step A (mechanical audit, no new data/values): 17 relations that already existed in
 // CATEGORY_RELATIONS - some since before ADR-019 - but were never wired into
 // NOTE_COMPATIBILITY_RULES, so they had zero effect on scoring despite having a correct value.
 // 2 more candidates (TOBACCO+WOODY, TOBACCO+FRUIT) could NOT be wired: "TOBACCO" has no legacy
 // Prisma category equivalent (toLegacyCategory("TOBACCO") is undefined, never added to the enum
 // since the registry never uses it) - createKnowledgeCategoryRule() requires a legacy category arg.
 createKnowledgeCategoryRule("FRUIT","CITRUS"),
 createKnowledgeCategoryRule("DESSERT","DAIRY"),
 createKnowledgeCategoryRule("COFFEE","DAIRY"),
 createKnowledgeCategoryRule("CHOCOLATE","NUT"),
 createKnowledgeCategoryRule("BAKERY","VANILLA"),
 createKnowledgeCategoryRule("TROPICAL","COOLING"),
 createKnowledgeCategoryRule("FRUIT","FRESH"),
 createKnowledgeCategoryRule("ALCOHOL","FRUIT"),
 createKnowledgeCategoryRule("VANILLA","COFFEE"),
 createKnowledgeCategoryRule("DESSERT","SOUR"),
 createKnowledgeCategoryRule("FRUIT","SPICE"),
 createKnowledgeCategoryRule("FLORAL","SMOKY"),
 createKnowledgeCategoryRule("FLORAL","COOLING"),
 createKnowledgeCategoryRule("SOUR","DAIRY"),
 createKnowledgeCategoryRule("HERBAL","DESSERT"),
 createKnowledgeCategoryRule("MINT","DAIRY"),
 createKnowledgeCategoryRule("CANDY","SMOKY"),
 // ADR-020 Step B: 13 of the 15 verified-mix-history pairs (FRUIT+SOUR and FRUIT+NUT are NEUTRAL -
 // createKnowledgeCategoryRule() throws for NEUTRAL, same as CITRUS+SPICE in ADR-019).
 createKnowledgeCategoryRule("BERRY","FRUIT"),
 createKnowledgeCategoryRule("FRUIT","TROPICAL"),
 createKnowledgeCategoryRule("DESSERT","FRUIT"),
 createKnowledgeCategoryRule("CANDY","FRUIT"),
 createKnowledgeCategoryRule("COOLING","FRUIT"),
 createKnowledgeCategoryRule("CITRUS","DAIRY"),
 createKnowledgeCategoryRule("CITRUS","SOUR"),
 createKnowledgeCategoryRule("BERRY","SOUR"),
 createKnowledgeCategoryRule("CANDY","DAIRY"),
 createKnowledgeCategoryRule("BERRY","TROPICAL"),
 createKnowledgeCategoryRule("CITRUS","DESSERT"),
 createKnowledgeCategoryRule("BERRY","DESSERT"),
 createKnowledgeCategoryRule("CANDY","SOUR")
];
