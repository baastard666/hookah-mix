import { prisma } from "@/lib/prisma"; import { flavorInclude,mapFlavor } from "@/lib/flavor-mapper"; import Builder from "./builder";
export const dynamic = "force-dynamic";
export default async function BuilderPage({searchParams}:{searchParams:Promise<{add?:string}>}){const {add}=await searchParams;const raw=await prisma.flavor.findMany({include:flavorInclude,orderBy:{name:"asc"}});return <Builder flavors={raw.map(mapFlavor)} initialId={Number(add)||undefined}/>}
