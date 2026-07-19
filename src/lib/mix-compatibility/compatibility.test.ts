import { describe,expect,it } from "vitest";
import type { FlavorNoteCategory,FlavorNoteType,FlavorProfile } from "../flavors/types";
import { calculateMixProfile,type MixProfileComponentInput,type MixProfileNoteInput } from "../mix-profile";
import { analyzeNoteCompatibility } from "./analyze-note-compatibility";
import { calculateMixCompatibility,MixCompatibilityInputError } from "./calculate-compatibility";
import { COMPATIBILITY_WEIGHTS } from "./constants";
import { sortConflicts } from "./helpers";
import type { MixCompatibilityInput,MixConflict } from "./types";

const profile=(values:Partial<FlavorProfile>={}):FlavorProfile=>({sweetness:5,acidity:4,bitterness:2,creaminess:3,cooling:1,strength:5,intensity:6,heatResistance:7,dryness:3,juiciness:5,freshness:4,dessertLevel:3,spiceLevel:0,floralLevel:0,herbalLevel:0,smokyLevel:0,naturalness:6,persistence:6,...values});
let noteId=1;
const note=(slug:string,category:FlavorNoteCategory="OTHER",intensity=10,noteType:FlavorNoteType="DOMINANT"):MixProfileNoteInput=>({noteId:noteId++,noteName:slug,noteSlug:slug,category,intensity,noteType});
const component=(id:number,percentage:number,notes:MixProfileNoteInput[]=[note(`note-${id}`)],values:Partial<FlavorProfile>={}):MixProfileComponentInput=>({flavorId:id,brandName:`Brand ${id}`,flavorName:`Flavor ${id}`,flavorSlug:`flavor-${id}`,percentage,profile:profile(values),notes});
const input=(components:MixProfileComponentInput[]):MixCompatibilityInput=>({mixProfile:calculateMixProfile(components),componentIntensities:components.map(component=>({flavorId:component.flavorId,intensity:component.profile.intensity}))});
const analyze=(components:MixProfileComponentInput[])=>calculateMixCompatibility(input(components));
const rules=(result:ReturnType<typeof calculateMixCompatibility>)=>[...result.noteCompatibility.appliedRules,...result.profileBalance.appliedRules,...result.intensityBalance.appliedRules,...result.proportionBalance.appliedRules].map(rule=>rule.ruleId);
const pair=(left:MixProfileNoteInput,right:MixProfileNoteInput)=>analyze([component(1,50,[left]),component(2,50,[right])]);
const hasRule=(result:ReturnType<typeof calculateMixCompatibility>,id:string)=>expect(rules(result)).toContain(id);

describe("основа анализа совместимости",()=>{
 it("1. принимает корректный MixProfileResult",()=>expect(analyze([component(1,40),component(2,60)]).compatibilityScore).toBeTypeOf("number"));
 it("2. отклоняет неверную calculationVersion",()=>{const value=input([component(1,40),component(2,60)]);value.mixProfile.metadata.calculationVersion="wrong" as "mix-profile-v1";expect(()=>calculateMixCompatibility(value)).toThrow(MixCompatibilityInputError)});
 it("3. результат детерминирован",()=>{const value=input([component(1,40),component(2,60)]);expect(calculateMixCompatibility(value)).toEqual(calculateMixCompatibility(value))});
 it("4. входной объект не изменяется",()=>{const value=input([component(1,40),component(2,60)]),snapshot=structuredClone(value);calculateMixCompatibility(value);expect(value).toEqual(snapshot)});
});

describe("совместимость нот",()=>{
 it("5. coffee + dairy даёт положительный фактор",()=>hasRule(pair(note("coffee","COFFEE"),note("cream","DAIRY")),"note.coffee-dairy"));
 it("6. coffee + banana даёт положительный фактор",()=>hasRule(pair(note("coffee","COFFEE"),note("banana","FRUIT")),"note.coffee-banana"));
 it("7. coffee + cooling создаёт предупреждение",()=>hasRule(pair(note("coffee","COFFEE"),note("mint","COOLING")),"note.coffee-cooling"));
 it("8. banana + vanilla даёт положительный фактор",()=>hasRule(pair(note("banana","FRUIT"),note("vanilla","DESSERT")),"note.banana-vanilla"));
 it("9. coconut + chocolate даёт положительный фактор",()=>hasRule(pair(note("coconut","TROPICAL"),note("dark-chocolate","CHOCOLATE")),"note.coconut-chocolate"));
 it("10. berry + dairy даёт положительный фактор",()=>hasRule(pair(note("strawberry","BERRY"),note("cream","DAIRY")),"note.berry-dairy"));
 it("11. mango + citrus даёт положительный фактор",()=>hasRule(pair(note("mango","TROPICAL"),note("lemon","CITRUS")),"note.mango-citrus"));
 it("12. lemon + cola даёт положительный фактор",()=>hasRule(pair(note("lemon","CITRUS"),note("cola","DRINK")),"note.lemon-cola"));
 it("13. mint + citrus даёт положительный фактор",()=>hasRule(pair(note("mint","COOLING"),note("lemon","CITRUS")),"note.mint-citrus"));
 it("14. floral + smoky создаёт конфликт",()=>expect(pair(note("rose","FLORAL"),note("roasted","SMOKY")).conflicts.some(item=>item.ruleId==="note.floral-smoky")).toBe(true));
 it("15. herbal + dessert создаёт предупреждение",()=>hasRule(pair(note("herbal","HERBAL"),note("dessert","DESSERT")),"note.herbal-dessert"));
 it("35. одно правило не применяется дважды",()=>{const result=pair(note("coffee","COFFEE"),note("cream","DAIRY"));expect(result.noteCompatibility.appliedRules.filter(rule=>rule.ruleId==="note.coffee-dairy")).toHaveLength(1)});
 it("масштабирует влияние правила по доле нот",()=>{const low=analyzeNoteCompatibility([{...input([component(1,50),component(2,50)]).mixProfile.allNotes[0],noteSlug:"coffee",category:"COFFEE",sharePercent:5},{...input([component(3,50),component(4,50)]).mixProfile.allNotes[0],noteSlug:"cream",category:"DAIRY",sharePercent:5}]);const high=analyzeNoteCompatibility([{...input([component(1,50),component(2,50)]).mixProfile.allNotes[0],noteSlug:"coffee",category:"COFFEE",sharePercent:30},{...input([component(3,50),component(4,50)]).mixProfile.allNotes[0],noteSlug:"cream",category:"DAIRY",sharePercent:30}]);expect(high.score).toBeGreaterThan(low.score)});
});

describe("баланс профиля",()=>{
 const altered=(values:Partial<FlavorProfile>,notes?:MixProfileNoteInput[])=>analyze([component(1,50,notes??[note("one")],values),component(2,50,[note("two")],values)]);
 it("16. высокая acidity + creaminess создаёт предупреждение",()=>hasRule(altered({acidity:9,creaminess:8}),"profile.acidity-creaminess"));
 it("17. высокая bitterness + acidity создаёт предупреждение",()=>hasRule(altered({bitterness:8,acidity:8}),"profile.bitterness-acidity"));
 it("18. определяет приторный профиль",()=>hasRule(altered({sweetness:9,acidity:2,freshness:2}),"profile.cloying"));
 it("19. определяет сухую горечь",()=>hasRule(altered({bitterness:8,dryness:8}),"profile.dry-bitterness"));
 it("20. определяет хороший кисло-сладкий баланс",()=>hasRule(altered({sweetness:6,acidity:5}),"profile.sweet-sour-balance"));
 it("21. поощряет сочный свежий профиль",()=>hasRule(altered({freshness:7,juiciness:8,dryness:3}),"profile.fresh-juicy"));
 it("22. определяет сильный cold",()=>hasRule(altered({cooling:9},[note("coffee","COFFEE")]),"profile.strong-cooling"));
 it("23. определяет плоский профиль",()=>hasRule(altered({sweetness:2,acidity:2,bitterness:2,creaminess:2,cooling:2,freshness:2,juiciness:2}),"profile.flat"));
});

describe("баланс интенсивности и пропорций",()=>{
 it("24. influenceShare >= 70% создаёт предупреждение",()=>hasRule(analyze([component(1,90,[note("strong")],{intensity:10}),component(2,10,[note("weak")],{intensity:1})]),"intensity.overdominant"));
 it("25. два ярких компонента с близким влиянием предупреждаются",()=>hasRule(analyze([component(1,50,[note("a")],{intensity:9}),component(2,50,[note("b")],{intensity:9})]),"intensity.bright-competition"));
 it("26. слабый компонент с маленькой долей может потеряться",()=>hasRule(analyze([component(1,90,[note("strong")],{intensity:9}),component(2,10,[note("weak")],{intensity:3})]),"intensity.lost.2"));
 it("27. компонент <= 5% предупреждается",()=>hasRule(analyze([component(1,95),component(2,5)]),"proportion.tiny.2"));
 it("28. яркий компонент >= 60% предупреждается",()=>hasRule(analyze([component(1,60,[note("bright")],{intensity:9}),component(2,40)]),"proportion.bright-large.1"));
 it("29. 50/50 средней интенсивности не штрафуется автоматически",()=>expect(rules(analyze([component(1,50,[note("a")],{intensity:6}),component(2,50,[note("b")],{intensity:6})]))).not.toContain("proportion.bright-equal"));
 it("30. два ярких компонента 50/50 предупреждаются",()=>hasRule(analyze([component(1,50,[note("a")],{intensity:9}),component(2,50,[note("b")],{intensity:9})]),"proportion.bright-equal"));
 it("31. три различимых компонента получают положительный фактор",()=>hasRule(analyze([component(1,34),component(2,33),component(3,33)]),"proportion.all-visible"));
});

describe("итог, конфликты и теги",()=>{
 const normal=()=>analyze([component(1,40),component(2,60)]);
 it("32. compatibilityScore находится от 0 до 10",()=>{const score=normal().compatibilityScore;expect(score).toBeGreaterThanOrEqual(0);expect(score).toBeLessThanOrEqual(10)});
 it("33. каждая частная оценка находится от 0 до 10",()=>{const result=normal();[result.noteCompatibility,result.profileBalance,result.intensityBalance,result.proportionBalance].forEach(value=>{expect(value.score).toBeGreaterThanOrEqual(0);expect(value.score).toBeLessThanOrEqual(10)})});
 it("34. итоговая формула весов верна",()=>{const result=normal();const expected=result.noteCompatibility.score*COMPATIBILITY_WEIGHTS.noteCompatibility+result.profileBalance.score*COMPATIBILITY_WEIGHTS.profileBalance+result.intensityBalance.score*COMPATIBILITY_WEIGHTS.intensityBalance+result.proportionBalance.score*COMPATIBILITY_WEIGHTS.proportionBalance;expect(result.compatibilityScore).toBe(Math.round(expected*10)/10)});
 it("36. конфликты сортируются по severity",()=>{const base={id:"",title:"",description:"",relatedNotes:[],relatedCharacteristics:[],scoreImpact:-1,ruleId:""};const items:MixConflict[]=[{...base,id:"l",ruleId:"l",severity:"LOW"},{...base,id:"h",ruleId:"h",severity:"HIGH"},{...base,id:"m",ruleId:"m",severity:"MEDIUM"}];expect(sortConflicts(items).map(item=>item.severity)).toEqual(["HIGH","MEDIUM","LOW"])});
 it("37. summaryTags не превышают 6",()=>expect(normal().summaryTags.length).toBeLessThanOrEqual(6));
 it("38. summaryTags детерминированы",()=>expect(normal().summaryTags).toEqual(normal().summaryTags));
 it("39. calculationVersion равна mix-compatibility-v1",()=>expect(normal().metadata.calculationVersion).toBe("mix-compatibility-v1"));
});

describe("обязательные миксы",()=>{
 const coffeeBanana=()=>analyze([component(1,40,[note("coffee","COFFEE"),note("dark-chocolate","CHOCOLATE",5,"SECONDARY")],{intensity:9,sweetness:3,bitterness:7}),component(2,60,[note("banana","FRUIT"),note("cream","DAIRY",8,"SECONDARY"),note("vanilla","DESSERT",7,"SECONDARY")],{intensity:6,sweetness:8,creaminess:8,dessertLevel:9})]);
 const mintColaLemon=(cooling=6)=>analyze([component(1,20,[note("mint","COOLING")],{intensity:8,cooling,freshness:9}),component(2,40,[note("cola","DRINK"),note("spice","SPICE",6,"SECONDARY")],{intensity:8,sweetness:8,freshness:5,cooling}),component(3,40,[note("lemon","CITRUS")],{intensity:8,acidity:9,freshness:9,juiciness:8,cooling})]);
 it("40. Coffee 40% + Banana Shake 60%",()=>{const result=coffeeBanana();hasRule(result,"note.coffee-banana");expect(rules(result).some(id=>id==="note.coffee-dairy"||id==="note.coffee-vanilla")).toBe(true);expect(result.compatibilityScore).toBeGreaterThanOrEqual(6.5);expect(result.positiveFactors.length).toBeGreaterThan(0);expect(result).toEqual(coffeeBanana())});
 it("41. Mint 20% + Cola 40% + Lemon 40%",()=>{const result=mintColaLemon();hasRule(result,"note.lemon-cola");expect(rules(result).some(id=>id==="note.mint-citrus"||id==="note.mint-drink")).toBe(true);expect(result.summaryTags.some(tag=>["DRINK","CITRUS","FRESH","COOLING"].includes(tag))).toBe(true);expect(result.compatibilityScore).toBeGreaterThanOrEqual(6.5);expect(result.positiveFactors.some(item=>item.ruleId==="profile.fresh-juicy")).toBe(true);expect(result).toEqual(mintColaLemon());hasRule(mintColaLemon(10),"profile.extreme-cooling")});
});
