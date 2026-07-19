import { describe,expect,it } from "vitest";
import { validateFlavor } from "./validate-flavor";
import type { FlavorProfileInput } from "./types";

const valid=():FlavorProfileInput=>({name:"Coffee",slug:"coffee",sweetness:3,acidity:2,bitterness:7,creaminess:2,cooling:0,strength:8,intensity:9,heatResistance:7,dryness:6,juiciness:2,freshness:1,dessertLevel:5,spiceLevel:0,floralLevel:0,herbalLevel:0,smokyLevel:7,naturalness:7,persistence:9,profileStatus:"DRAFT",profileSource:"MANUAL",notes:[{note:{name:"coffee",slug:"coffee",category:"COFFEE"},intensity:10,noteType:"DOMINANT"},{note:{name:"roasted",slug:"roasted",category:"SMOKY"},intensity:8,noteType:"SECONDARY"}]});
describe("validateFlavor",()=>{
 it("принимает полностью корректный Flavor",()=>expect(validateFlavor(valid()).success).toBe(true));
 it("отклоняет характеристику ниже 0",()=>expect(validateFlavor({...valid(),sweetness:-1}).success).toBe(false));
 it("отклоняет характеристику выше 10",()=>expect(validateFlavor({...valid(),acidity:11}).success).toBe(false));
 it("отклоняет intensity ноты ниже 1",()=>{const x=valid();x.notes[0].intensity=0;expect(validateFlavor(x).success).toBe(false)});
 it("отклоняет intensity ноты выше 10",()=>{const x=valid();x.notes[0].intensity=11;expect(validateFlavor(x).success).toBe(false)});
 it("отклоняет Flavor без DOMINANT-ноты",()=>{const x=valid();x.notes=x.notes.map(n=>({...n,noteType:"SECONDARY"}));expect(validateFlavor(x).success).toBe(false)});
 it("отклоняет повторяющиеся FlavorNote",()=>{const x=valid();x.notes.push({...x.notes[0]});expect(validateFlavor(x).success).toBe(false)});
 it("отклоняет пустой name",()=>expect(validateFlavor({...valid(),name:" "}).success).toBe(false));
 it("отклоняет пустой slug",()=>expect(validateFlavor({...valid(),slug:" "}).success).toBe(false));
 it("отклоняет ненормализованный slug",()=>expect(validateFlavor({...valid(),slug:"Dark Chocolate"}).success).toBe(false));
 it("отклоняет некорректную категорию",()=>{const x=valid();x.notes[0].note.category="WRONG" as "COFFEE";expect(validateFlavor(x).success).toBe(false)});
 it("отклоняет некорректный noteType",()=>{const x=valid();x.notes[0].noteType="WRONG" as "DOMINANT";expect(validateFlavor(x).success).toBe(false)});
 it("принимает профиль Overdose Coffee",()=>expect(validateFlavor(valid()).success).toBe(true));
 it("принимает профиль HIT Banana Shake",()=>expect(validateFlavor({...valid(),name:"Banana Shake",slug:"banana-shake",sweetness:8,creaminess:8,notes:[{note:{name:"banana",slug:"banana",category:"FRUIT"},intensity:10,noteType:"DOMINANT"},{note:{name:"cream",slug:"cream",category:"DAIRY"},intensity:8,noteType:"SECONDARY"}]}).success).toBe(true));
 it("принимает DRAFT",()=>expect(validateFlavor({...valid(),profileStatus:"DRAFT"}).success).toBe(true));
 it("принимает MANUAL",()=>expect(validateFlavor({...valid(),profileSource:"MANUAL"}).success).toBe(true));
 it("отклоняет некорректный profileStatus",()=>expect(validateFlavor({...valid(),profileStatus:"UNKNOWN"}).success).toBe(false));
 it("отклоняет некорректный profileSource",()=>expect(validateFlavor({...valid(),profileSource:"UNKNOWN"}).success).toBe(false));
});
