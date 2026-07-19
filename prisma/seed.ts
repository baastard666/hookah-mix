import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const flavors = [
  { brand:"Overdose", slug:"overdose", name:"Coffee", flavorSlug:"coffee", description:"Насыщенный кофейный вкус с нотами обжарки и лёгкой шоколадной горечью.", strength:8,heatResistance:7,intensity:9,sweetness:3,acidity:2,cooling:0,creaminess:2,bitterness:7, notes:[["coffee","напитки",10,"dominant"],["roasted","пряные",8,"secondary"],["dark chocolate","десертные",5,"secondary"],["dessert","десертные",4,"secondary"]] },
  { brand:"HIT", slug:"hit", name:"Banana Shake", flavorSlug:"banana-shake", description:"Сладкий банановый вкус со сливочными и ванильными нотами.", strength:5,heatResistance:6,intensity:6,sweetness:8,acidity:1,cooling:0,creaminess:8,bitterness:1, notes:[["banana","фруктовые",10,"dominant"],["vanilla","десертные",7,"secondary"],["cream","сливочные",8,"secondary"],["dessert","десертные",7,"secondary"]] },
  { brand:"Element",slug:"element",name:"Мята",flavorSlug:"mint",description:"Чистая прохладная мята с травяным оттенком.",strength:4,heatResistance:8,intensity:8,sweetness:2,acidity:1,cooling:9,creaminess:0,bitterness:2,notes:[["mint","свежие",10,"dominant"],["herbal","травяные",5,"secondary"]]},
  { brand:"Musthave",slug:"musthave",name:"Манго",flavorSlug:"mango",description:"Спелое сочное манго с тропической сладостью.",strength:6,heatResistance:8,intensity:8,sweetness:8,acidity:4,cooling:0,creaminess:2,bitterness:1,notes:[["mango","фруктовые",10,"dominant"],["tropical","фруктовые",7,"secondary"]]},
  { brand:"Darkside",slug:"darkside",name:"Кокос",flavorSlug:"coconut",description:"Мягкий кокос с умеренной десертной сладостью.",strength:7,heatResistance:8,intensity:6,sweetness:7,acidity:1,cooling:0,creaminess:7,bitterness:2,notes:[["coconut","десертные",10,"dominant"],["cream","сливочные",5,"secondary"]]},
  { brand:"Sebero",slug:"sebero",name:"Лимон",flavorSlug:"lemon",description:"Яркий лимон с натуральной цитрусовой кислинкой.",strength:5,heatResistance:7,intensity:8,sweetness:3,acidity:9,cooling:2,creaminess:0,bitterness:2,notes:[["lemon","цитрусовые",10,"dominant"],["citrus","цитрусовые",9,"secondary"]]},
  { brand:"BlackBurn",slug:"blackburn",name:"Ваниль",flavorSlug:"vanilla",description:"Тёплая сладкая ваниль для смягчения насыщенных миксов.",strength:6,heatResistance:7,intensity:5,sweetness:8,acidity:0,cooling:0,creaminess:6,bitterness:1,notes:[["vanilla","десертные",10,"dominant"],["dessert","десертные",6,"secondary"]]},
  { brand:"Daily Hookah",slug:"daily-hookah",name:"Сливки",flavorSlug:"cream",description:"Нежный сливочный вкус с мягким послевкусием.",strength:4,heatResistance:6,intensity:5,sweetness:6,acidity:0,cooling:0,creaminess:10,bitterness:0,notes:[["cream","сливочные",10,"dominant"],["milk","сливочные",7,"secondary"]]},
] as const;

async function main() {
  for (const item of flavors) {
    const brand = await prisma.brand.upsert({where:{slug:item.slug},update:{name:item.brand},create:{name:item.brand,slug:item.slug}});
    const flavor = await prisma.flavor.upsert({where:{brandId_slug:{brandId:brand.id,slug:item.flavorSlug}},update:{description:item.description,strength:item.strength,heatResistance:item.heatResistance,intensity:item.intensity,sweetness:item.sweetness,acidity:item.acidity,cooling:item.cooling,creaminess:item.creaminess,bitterness:item.bitterness},create:{brandId:brand.id,name:item.name,slug:item.flavorSlug,description:item.description,strength:item.strength,heatResistance:item.heatResistance,intensity:item.intensity,sweetness:item.sweetness,acidity:item.acidity,cooling:item.cooling,creaminess:item.creaminess,bitterness:item.bitterness}});
    for (const [name,category,intensity,noteType] of item.notes) {
      const note = await prisma.flavorNote.upsert({where:{name},update:{category},create:{name,category}});
      await prisma.flavorNoteAssignment.upsert({where:{flavorId_flavorNoteId:{flavorId:flavor.id,flavorNoteId:note.id}},update:{intensity,noteType},create:{flavorId:flavor.id,flavorNoteId:note.id,intensity,noteType}});
    }
  }
}
main().finally(()=>prisma.$disconnect());
