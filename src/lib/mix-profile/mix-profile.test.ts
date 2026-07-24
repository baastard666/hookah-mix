import { describe,expect,it } from "vitest";
import { FLAVOR_PROFILE_FIELDS,type FlavorNoteType,type FlavorProfile } from "../flavors/types";
import { calculateComponentInfluence } from "./calculate-component-influence";
import { calculateMixProfile } from "./calculate-mix-profile";
import { calculateNoteContributions, classifyNotes } from "./calculate-note-contributions";
import { NOTE_TYPE_WEIGHTS } from "./constants";
import type { MixProfileComponentInput, MixProfileNoteInput } from "./types";
import { MixProfileValidationError, validateMixProfileInput } from "./validate-input";

const profile=(values:Partial<FlavorProfile>={}):FlavorProfile=>({sweetness:5,acidity:2,bitterness:1,creaminess:1,cooling:0,strength:5,intensity:6,heatResistance:7,dryness:2,juiciness:5,freshness:3,dessertLevel:3,spiceLevel:0,floralLevel:0,herbalLevel:0,smokyLevel:0,naturalness:6,persistence:6,...values});
let nextNoteId=1;
const note=(noteSlug:string,intensity=10,noteType:FlavorNoteType="DOMINANT"):MixProfileNoteInput=>({noteId:nextNoteId++,noteName:noteSlug,noteSlug,category:"OTHER",intensity,noteType});
const component=(flavorId:number,percentage:number,values:Partial<MixProfileComponentInput>={}):MixProfileComponentInput=>({flavorId,brandName:`Brand ${flavorId}`,flavorName:`Flavor ${flavorId}`,flavorSlug:`flavor-${flavorId}`,percentage,profile:profile(),notes:[note(`note-${flavorId}`)],...values});
const two=()=>[component(1,40),component(2,60)];
const expectInvalid=(items:MixProfileComponentInput[])=>expect(validateMixProfileInput(items).success).toBe(false);

describe("валидация входа mix-profile",()=>{
 it("1. принимает корректный микс из двух компонентов",()=>expect(validateMixProfileInput(two()).success).toBe(true));
 it("2. принимает корректный микс из трёх компонентов",()=>expect(validateMixProfileInput([component(1,30),component(2,30),component(3,40)]).success).toBe(true));
 it("3. принимает корректный микс из пяти компонентов",()=>expect(validateMixProfileInput([1,2,3,4,5].map(id=>component(id,20))).success).toBe(true));
 it("4. отклоняет один компонент",()=>expectInvalid([component(1,100)]));
 it("5. отклоняет шесть компонентов",()=>expectInvalid([1,2,3,4,5,6].map(id=>component(id,id===6?50:10))));
 it("6. отклоняет сумму меньше 100",()=>expectInvalid([component(1,40),component(2,50)]));
 it("7. отклоняет сумму больше 100",()=>expectInvalid([component(1,60),component(2,50)]));
 it("8. принимает дробные проценты в пределах погрешности",()=>expect(validateMixProfileInput([component(1,33.33333),component(2,33.33333),component(3,33.33333)]).success).toBe(true));
 it("9. отклоняет нулевой percentage",()=>expectInvalid([component(1,0),component(2,100)]));
 it("10. отклоняет отрицательный percentage",()=>expectInvalid([component(1,-10),component(2,110)]));
 it("11. отклоняет повторяющийся flavorId",()=>expectInvalid([component(1,40),component(1,60)]));
 it("12. отклоняет характеристику ниже 0",()=>expectInvalid([component(1,40,{profile:profile({sweetness:-1})}),component(2,60)]));
 it("13. отклоняет характеристику выше 10",()=>expectInvalid([component(1,40,{profile:profile({persistence:11})}),component(2,60)]));
 it("14. отклоняет Flavor без DOMINANT-ноты",()=>expectInvalid([component(1,40,{notes:[note("accent",5,"ACCENT")]}),component(2,60)]));
 it("15. отклоняет некорректную intensity ноты",()=>expectInvalid([component(1,40,{notes:[note("bad",0)]}),component(2,60)]));
 it("16. отклоняет некорректный noteType",()=>expectInvalid([component(1,40,{notes:[{...note("bad"),noteType:"WRONG"}]}),component(2,60)]));
 it("возвращает типизированную ошибку из основной функции",()=>expect(()=>calculateMixProfile([component(1,100)])).toThrow(MixProfileValidationError));

 // ADR-015/ADR-017: null - легитимное состояние "не измерено" для всех 18 полей, включая core.
 it("принимает null для второстепенного поля (creaminess)",()=>expect(validateMixProfileInput([component(1,40,{profile:profile({creaminess:null})}),component(2,60)]).success).toBe(true));
 it("принимает null для core-поля (sweetness) с ADR-017",()=>expect(validateMixProfileInput([component(1,40,{profile:profile({sweetness:null})}),component(2,60)]).success).toBe(true));
 it("отклоняет некорректное значение второстепенного поля, даже когда null разрешён",()=>expectInvalid([component(1,40,{profile:profile({creaminess:11})}),component(2,60)]));
 it("отклоняет некорректное значение core-поля, даже когда null разрешён",()=>expectInvalid([component(1,40,{profile:profile({sweetness:11})}),component(2,60)]));
});

describe("средневзвешенный профиль",()=>{
 it("17. точно рассчитывает одну характеристику",()=>expect(calculateMixProfile([component(1,40,{profile:profile({sweetness:3})}),component(2,60,{profile:profile({sweetness:8})})]).profile.sweetness).toBe(6));
 it("18. рассчитывает все 18 характеристик",()=>expect(Object.keys(calculateMixProfile(two()).profile).sort()).toEqual([...FLAVOR_PROFILE_FIELDS].sort()));
 it("19. округляет результат до одного знака",()=>expect(calculateMixProfile([component(1,33.3333,{profile:profile({acidity:1})}),component(2,66.6667,{profile:profile({acidity:2})})]).profile.acidity).toBe(1.7));
 it("оставляет все значения в диапазоне 0–10",()=>Object.values(calculateMixProfile(two()).profile).forEach(value=>{expect(value).toBeGreaterThanOrEqual(0);expect(value).toBeLessThanOrEqual(10)}));

 // ADR-015: null означает "не измерено" и не подставляется как 0 в средневзвешенное значение.
 it("возвращает null для второстепенного поля, если оно не измерено ни у одного компонента",()=>expect(calculateMixProfile([component(1,40,{profile:profile({creaminess:null})}),component(2,60,{profile:profile({creaminess:null})})]).profile.creaminess).toBeNull());
 it("исключает компоненты с null из среднего по второстепенному полю, а не подставляет 0",()=>{
   const withNull=calculateMixProfile([component(1,40,{profile:profile({creaminess:null})}),component(2,60,{profile:profile({creaminess:8})})]).profile.creaminess;
   expect(withNull).toBe(8);
 });
 it("частично измеренное второстепенное поле усредняется только по измеренным компонентам",()=>{
   const result=calculateMixProfile([component(1,20,{profile:profile({creaminess:null})}),component(2,30,{profile:profile({creaminess:4})}),component(3,50,{profile:profile({creaminess:8})})]).profile.creaminess;
   expect(result).toBeCloseTo((4*30+8*50)/80,1);
 });
 it("core-поля усредняются как обычно независимо от null в второстепенных полях",()=>expect(calculateMixProfile([component(1,40,{profile:profile({sweetness:3,creaminess:null})}),component(2,60,{profile:profile({sweetness:8,creaminess:null})})]).profile.sweetness).toBe(6));

 // ADR-017: core-поля (sweetness/acidity/freshness/intensity/strength/heatResistance/juiciness) теперь
 // тоже nullable и подчиняются той же политике частичного среднего, что и второстепенные.
 it("возвращает null для core-поля, если оно не измерено ни у одного компонента",()=>expect(calculateMixProfile([component(1,40,{profile:profile({sweetness:null})}),component(2,60,{profile:profile({sweetness:null})})]).profile.sweetness).toBeNull());
 it("исключает компоненты с null из среднего по core-полю, а не подставляет 0",()=>expect(calculateMixProfile([component(1,40,{profile:profile({sweetness:null})}),component(2,60,{profile:profile({sweetness:8})})]).profile.sweetness).toBe(8));
});

describe("влияние компонентов",()=>{
 it("20. определяет dominantComponent",()=>expect(calculateMixProfile(two()).dominantComponent.flavorId).toBe(2));
 it("21. позволяет меньшей доле с высокой интенсивностью стать доминирующей",()=>{const result=calculateMixProfile([component(1,55,{profile:profile({intensity:0}),notes:[note("weak",1)]}),component(2,45,{profile:profile({intensity:10}),notes:[note("strong",10)]})]);expect(result.dominantComponent.flavorId).toBe(2)});
 it("22. рассчитывает influenceShare",()=>{const influences=calculateComponentInfluence(two());expect(influences.reduce((sum,item)=>sum+item.influenceShare,0)).toBeCloseTo(100,1)});
 it("23. стабильно разрешает равенство influenceScore",()=>{const items=[component(2,50,{flavorSlug:"zeta"}),component(1,50,{flavorSlug:"alpha"})];expect(calculateMixProfile(items).dominantComponent.flavorSlug).toBe("alpha")});
 it("округляет influenceScore до двух знаков и share до одного",()=>{const item=calculateMixProfile(two()).dominantComponent;expect(item.influenceScore.toString().split(".")[1]?.length??0).toBeLessThanOrEqual(2);expect(item.influenceShare.toString().split(".")[1]?.length??0).toBeLessThanOrEqual(1)});
 it("назначает последовательные rank",()=>expect(calculateComponentInfluence(two()).map(item=>item.rank)).toEqual([1,2]));
});

describe("вклад и классификация нот",()=>{
 it("24. объединяет одинаковую ноту разных компонентов",()=>{const notes=calculateMixProfile([component(1,40,{notes:[note("vanilla")]}),component(2,60,{notes:[note("vanilla")]})]).allNotes;expect(notes).toHaveLength(1);expect(notes[0].sources).toHaveLength(2)});
 it("25. применяет коэффициенты DOMINANT, SECONDARY и ACCENT",()=>{const items=[component(1,50,{profile:profile({intensity:10}),notes:[note("dominant",10,"DOMINANT"),note("secondary",10,"SECONDARY"),note("accent",10,"ACCENT")]}),component(2,50)];const notes=calculateNoteContributions(items);const bySlug=Object.fromEntries(notes.map(n=>[n.noteSlug,n.contributionScore]));expect(bySlug.dominant/bySlug.secondary).toBeCloseTo(NOTE_TYPE_WEIGHTS.DOMINANT/NOTE_TYPE_WEIGHTS.SECONDARY);expect(bySlug.dominant/bySlug.accent).toBeCloseTo(NOTE_TYPE_WEIGHTS.DOMINANT/NOTE_TYPE_WEIGHTS.ACCENT)});
 it("26. классифицирует dominantNotes",()=>expect(calculateMixProfile(two()).dominantNotes.length).toBeGreaterThan(0));
 it("27. классифицирует secondaryNotes",()=>{const result=calculateMixProfile([component(1,50,{notes:[note("main",10),note("secondary",5,"SECONDARY")]}),component(2,50,{notes:[note("other",10)]})]);expect(result.secondaryNotes.some(n=>n.noteSlug==="secondary")).toBe(true)});
 it("28. классифицирует backgroundNotes",()=>{const many=[note("main",10),...Array.from({length:8},(_,i)=>note(`small-${i}`,1,"ACCENT"))];const result=calculateMixProfile([component(1,50,{notes:many}),component(2,50)]);expect(result.backgroundNotes.length).toBeGreaterThan(0)});
 it("29. ограничивает dominantNotes тремя",()=>{const fake=Array.from({length:6},(_,i)=>({noteIds:[i],noteName:`n${i}`,noteSlug:`n${i}`,category:"OTHER" as const,contributionScore:10-i,sharePercent:25,sources:[]}));expect(classifyNotes(fake).dominantNotes).toHaveLength(3)});
 it("30. ограничивает secondaryNotes пятью",()=>{const fake=Array.from({length:9},(_,i)=>({noteIds:[i],noteName:`n${i}`,noteSlug:`n${i}`,category:"OTHER" as const,contributionScore:20-i,sharePercent:i===0?30:10,sources:[]}));expect(classifyNotes(fake).secondaryNotes).toHaveLength(5)});
 it("31. ограничивает backgroundNotes пятью",()=>{const fake=Array.from({length:12},(_,i)=>({noteIds:[i],noteName:`n${i}`,noteSlug:`n${i}`,category:"OTHER" as const,contributionScore:20-i,sharePercent:i===0?30:2,sources:[]}));expect(classifyNotes(fake).backgroundNotes).toHaveLength(5)});
 it("32. сумма sharePercent всех нот примерно равна 100%",()=>expect(calculateMixProfile(two()).allNotes.reduce((sum,n)=>sum+n.sharePercent,0)).toBeCloseTo(100,0));
 it("сортирует allNotes по убыванию вклада",()=>{const notes=calculateMixProfile(two()).allNotes;expect(notes.every((n,i)=>i===0||notes[i-1].contributionScore>=n.contributionScore)).toBe(true)});
});

describe("детерминизм и неизменяемость",()=>{
 it("33. порядок компонентов не меняет профиль",()=>{const items=two();expect(calculateMixProfile(items).profile).toEqual(calculateMixProfile([...items].reverse()).profile)});
 it("34. порядок компонентов не меняет доминирующий результат",()=>{const items=two();expect(calculateMixProfile(items).dominantComponent.flavorId).toBe(calculateMixProfile([...items].reverse()).dominantComponent.flavorId)});
 it("35. повторный вызов даёт идентичный результат",()=>{const items=two();expect(calculateMixProfile(items)).toEqual(calculateMixProfile(items))});
 it("36. не изменяет входной массив и вложенные объекты",()=>{const items=two();const snapshot=structuredClone(items);calculateMixProfile(items);expect(items).toEqual(snapshot)});
 it("37. содержит calculationVersion mix-profile-v1",()=>expect(calculateMixProfile(two()).metadata.calculationVersion).toBe("mix-profile-v1"));
});

describe("Coffee 40% + Banana Shake 60%",()=>{
 it("рассчитывает полный детерминированный профиль",()=>{const coffee=component(1,40,{brandName:"Overdose",flavorName:"Coffee",flavorSlug:"coffee",profile:profile({sweetness:3,bitterness:7,strength:8,intensity:9}),notes:[note("coffee",10),note("dark-chocolate",5,"SECONDARY")]});const banana=component(2,60,{brandName:"HIT",flavorName:"Banana Shake",flavorSlug:"banana-shake",profile:profile({sweetness:8,creaminess:8,strength:5,intensity:6}),notes:[note("banana",10),note("vanilla",7,"SECONDARY"),note("cream",8,"SECONDARY")]});const items=[coffee,banana];const result=calculateMixProfile(items);expect(result.metadata.totalPercentage).toBe(100);expect(Object.keys(result.profile)).toHaveLength(18);Object.values(result.profile).forEach(value=>{expect(value).toBeGreaterThanOrEqual(0);expect(value).toBeLessThanOrEqual(10)});expect(result.dominantComponent).toBeDefined();expect(result.secondaryComponents).toHaveLength(1);expect(result.allNotes.map(n=>n.noteSlug)).toEqual(expect.arrayContaining(["coffee","banana","vanilla","cream"]));expect(result.allNotes.every((n,i)=>i===0||result.allNotes[i-1].contributionScore>=n.contributionScore)).toBe(true);expect(calculateMixProfile(items)).toEqual(result);expect(result.metadata.calculationVersion).toBe("mix-profile-v1")});
});
