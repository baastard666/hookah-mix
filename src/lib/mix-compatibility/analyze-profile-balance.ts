import type { MixProfileResult } from "../mix-profile";
import { BASE_SCORES,PROFILE_THRESHOLDS as T } from "./constants";
import { applied,block,conflict,factor } from "./helpers";
import type { AnalysisBlock,AnalysisFactor,AppliedRule,MixConflict,RuleType } from "./types";

export function analyzeProfileBalance(result:MixProfileResult):AnalysisBlock{
  const p=result.profile,positives:AnalysisFactor[]=[],warnings:AnalysisFactor[]=[],rules:AppliedRule[]=[],conflicts:MixConflict[]=[];let total=0;
  const add=(id:string,type:RuleType,impact:number,title:string,description:string,characteristics:string[])=>{total+=impact;rules.push(applied(id,type,impact,description));const item=factor(id,"PROFILE_BALANCE",title,description,impact,[],[]);if(type==="positive")positives.push(item);else warnings.push(item);if(type==="conflict")conflicts.push(conflict(id,title,description,impact,[],characteristics))};
  // ADR-015/ADR-017: every one of the 18 sensory fields may be null ("not measured"), including the former
  // "core" ones (sweetness/acidity/freshness/juiciness). Every rule below requires an explicit `!== null`
  // guard for each field it reads - an unmeasured field must never silently satisfy or fail a threshold.
  if(p.sweetness!==null&&p.acidity!==null&&p.freshness!==null&&p.sweetness>=T.high&&p.acidity<=T.low&&p.freshness<=T.low)add("profile.cloying","caution",-.6,"Возможная приторность","Микс может ощущаться приторным и недостаточно освежающим",["sweetness","acidity","freshness"]);
  if(p.acidity!==null&&p.sweetness!==null&&p.acidity>=T.high&&p.sweetness<=T.low)add("profile.sharp-acidity","caution",-.6,"Резкая кислотность","Кислотность может оказаться слишком резкой",["acidity","sweetness"]);
  if(p.bitterness!==null&&p.dryness!==null&&p.bitterness>=T.highBitterness&&p.dryness>=T.highDryness)add("profile.dry-bitterness","caution",-.6,"Сухая горечь","Профиль может получиться сухим и выраженно горьким",["bitterness","dryness"]);
  if(p.dessertLevel!==null&&p.sweetness!==null&&p.creaminess!==null&&p.dessertLevel>=T.high&&p.sweetness>=T.high&&p.creaminess>=T.highCreaminess)add("profile.dense-dessert","caution",-.5,"Плотный десертный профиль","Десертный профиль может оказаться слишком плотным",["dessertLevel","sweetness","creaminess"]);
  const warmDominant=result.dominantNotes.some(note=>["DAIRY","COFFEE","CHOCOLATE","DESSERT"].includes(note.category));
  if(p.cooling!==null&&p.cooling>=T.high&&warmDominant)add("profile.strong-cooling","caution",-.7,"Слишком сильный холод","Сильный холод может заглушить десертные и тёплые ноты",["cooling"]);
  if(p.cooling!==null&&p.cooling>=9.5)add("profile.extreme-cooling","caution",-.4,"Экстремальный холод","Очень высокий уровень холода может перекрыть часть вкусовых оттенков",["cooling"]);
  if(p.sweetness!==null&&p.acidity!==null&&p.sweetness>=4&&p.sweetness<=8&&p.acidity>=3&&p.acidity<=7&&Math.abs(p.sweetness-p.acidity)<=3)add("profile.sweet-sour-balance","positive",.4,"Кисло-сладкий баланс","Сладость и кислотность поддерживают друг друга",["sweetness","acidity"]);
  if(p.dryness!==null&&p.freshness!==null&&p.juiciness!==null&&p.freshness>=T.moderateFreshness&&p.juiciness>=T.moderateJuiciness&&p.dryness<=T.maxComfortableDryness)add("profile.fresh-juicy","positive",.4,"Свежий сочный профиль","Профиль должен ощущаться сочным и свежим",["freshness","juiciness","dryness"]);
  if(p.dessertLevel!==null&&p.creaminess!==null&&p.bitterness!==null&&p.dessertLevel>=5&&p.creaminess>=4&&p.bitterness<=6)add("profile.dessert-balance","positive",.4,"Десертный баланс","Сливочность поддерживает десертную основу",["dessertLevel","creaminess","bitterness"]);
  if(Object.entries(p).filter(([,value])=>value!==null&&value>=8).length>=4)add("profile.many-extremes","caution",-.6,"Много ярких направлений","Профиль может быть перегружен слишком большим количеством ярких направлений",[]);
  if([p.sweetness,p.acidity,p.bitterness,p.creaminess,p.cooling,p.freshness,p.juiciness].filter((value):value is number=>value!==null).every(value=>value<3))add("profile.flat","caution",-.6,"Плоский профиль","Микс может получиться недостаточно выраженным",[]);
  if(p.creaminess!==null&&p.acidity!==null&&p.acidity>=8&&p.creaminess>=7)add("profile.acidity-creaminess","caution",-.5,"Кислотность и сливочность","Высокая кислотность может спорить со сливочной основой",["acidity","creaminess"]);
  if(p.bitterness!==null&&p.acidity!==null&&p.bitterness>=7&&p.acidity>=7)add("profile.bitterness-acidity","conflict",-.8,"Горечь и кислотность","Есть риск резкого сочетания высокой горечи и кислотности",["bitterness","acidity"]);
  if(p.sweetness!==null&&p.acidity!==null&&p.freshness!==null&&p.sweetness>=8&&p.acidity<=3&&p.freshness<=3)add("profile.sweet-low-freshness","caution",-.3,"Сладость без свежести","Высокая сладость при низкой кислотности и свежести может утяжелить профиль",["sweetness","acidity","freshness"]);
  if(p.dryness!==null&&p.bitterness!==null&&p.dryness>=7&&p.bitterness>=7)add("profile.dryness-bitterness","caution",-.3,"Сухость и горечь","Высокая сухость может усилить ощущение горечи",["dryness","bitterness"]);
  if(p.floralLevel!==null&&p.spiceLevel!==null&&p.floralLevel>=8&&p.spiceLevel>=8)add("profile.floral-spice","caution",-.4,"Цветы и специи","Яркие цветочные и пряные направления могут конкурировать",["floralLevel","spiceLevel"]);
  if(p.smokyLevel!==null&&p.freshness!==null&&p.smokyLevel>=8&&p.freshness>=8)add("profile.smoky-fresh","caution",-.4,"Дымность и свежесть","Дымный профиль может спорить с выраженной свежестью",["smokyLevel","freshness"]);
  return block(BASE_SCORES.profileBalance,total,positives,warnings,rules,conflicts);
}
