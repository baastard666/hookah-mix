export const MIX_COMPATIBILITY_VERSION="mix-compatibility-v1" as const;
export const INPUT_PROFILE_VERSION="mix-profile-v1" as const;
export const COMPATIBILITY_WEIGHTS={noteCompatibility:0.4,profileBalance:0.25,intensityBalance:0.2,proportionBalance:0.15} as const;
export const BASE_SCORES={noteCompatibility:7,profileBalance:8,intensityBalance:8,proportionBalance:8} as const;
export const PROFILE_THRESHOLDS={high:8,low:3,highBitterness:7,highDryness:7,highCreaminess:7,moderateFreshness:5,moderateJuiciness:5,maxComfortableDryness:5} as const;
export const SUMMARY_TAG_LIMIT=6;
export const SUMMARY_TAG_ORDER=["COFFEE","CHOCOLATE","DRINK","FRUITY","BERRY","TROPICAL","CITRUS","NUTTY","DESSERT","CREAMY","COOLING","FRESH","SWEET","SOUR","SPICY","HERBAL","FLORAL","SMOKY","INTENSE","LIGHT","BALANCED"] as const;
export const clampScore=(value:number)=>Math.max(0,Math.min(10,value));
export const round=(value:number,digits:number)=>{const factor=10**digits;return Math.round((value+Number.EPSILON)*factor)/factor};
