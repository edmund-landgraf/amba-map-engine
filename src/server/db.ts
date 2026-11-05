import { PrismaClient } from "@prisma/client";
import type { GeneratedMap } from "../shared/map.js";

const prisma = new PrismaClient();
const memory: GeneratedMap[] = [];

export async function saveMap(map: GeneratedMap) {
  try {
    return await prisma.map.create({ data: { title: map.title || "Untitled map", seed: map.seed, provider: map.provider, profile: map.profile, svg: map.svg, parameters: { width: map.width, height: map.height, density: map.density, grid: map.grid } } });
  } catch {
    memory.unshift(map);
    return map;
  }
}

export async function listMaps() {
  try { return await prisma.map.findMany({ orderBy: { createdAt: "desc" }, take: 24, select: { id: true, title: true, seed: true, provider: true, profile: true, createdAt: true, svg: true } }); }
  catch { return memory; }
}
