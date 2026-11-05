import type { GeneratedMap, MapRequest } from "../shared/map.js";

type Room = { x: number; y: number; w: number; h: number };

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function random(seed: string) {
  let state = hash(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function generateMap(input: MapRequest): GeneratedMap {
  const request: MapRequest = {
    title: input.title?.trim() || `${input.profile[0].toUpperCase()}${input.profile.slice(1)} · ${input.seed}`,
    seed: input.seed || "amber-1",
    provider: input.provider,
    profile: input.profile,
    width: clamp(Math.round(input.width || 32), 16, 80),
    height: clamp(Math.round(input.height || 24), 12, 60),
    density: clamp(Number(input.density || 0.55), 0.2, 0.9),
    grid: Boolean(input.grid),
    cellSize: clamp(Math.round(input.cellSize || 70), 20, 200),
    scaleFeet: clamp(Math.round(input.scaleFeet || 5), 1, 100)
  };
  const rng = random(`${request.seed}/${request.provider}/${request.profile}`);
  const rooms: Room[] = [];
  const target = Math.max(4, Math.round(request.width * request.height * request.density / 125));
  for (let i = 0; i < target * 8 && rooms.length < target; i += 1) {
    const w = 3 + Math.floor(rng() * Math.max(3, request.width / 5));
    const h = 3 + Math.floor(rng() * Math.max(3, request.height / 5));
    const x = 1 + Math.floor(rng() * Math.max(1, request.width - w - 2));
    const y = 1 + Math.floor(rng() * Math.max(1, request.height - h - 2));
    const overlaps = rooms.some((room) => x < room.x + room.w + 1 && x + w + 1 > room.x && y < room.y + room.h + 1 && y + h + 1 > room.y);
    if (!overlaps) rooms.push({ x, y, w, h });
  }
  rooms.sort((a, b) => a.x + a.y - (b.x + b.y));
  const colors = request.profile === "wilderness"
    ? { bg: "#dce8d1", floor: "#bdcfab", wall: "#476348", accent: "#7fa36d", detail: "#8f6f4d" }
    : request.profile === "cave"
      ? { bg: "#18212b", floor: "#47515b", wall: "#9aa6ad", accent: "#4c7890", detail: "#c4a66a" }
      : { bg: "#17181d", floor: "#665e58", wall: "#d4c8b5", accent: "#a68b69", detail: "#332f2a" };
  const scale = 24;
  const width = request.width * scale;
  const height = request.height * scale;
  const lines: string[] = [];
  const rect = (x: number, y: number, w: number, h: number, fill: string, stroke = "none", sw = 1, extra = "") => lines.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`);
  rect(0, 0, width, height, colors.bg);
  const centers: Array<[number, number]> = [];
  rooms.forEach((room, index) => {
    const x = room.x * scale, y = room.y * scale, w = room.w * scale, h = room.h * scale;
    rect(x, y, w, h, colors.floor, colors.wall, 3, `rx="${request.profile === "cave" || request.profile === "wilderness" ? 12 : 2}"`);
    centers.push([x + w / 2, y + h / 2]);
    if (index > 0) {
      const [px, py] = centers[index - 1];
      const cx = x + w / 2, cy = y + h / 2;
      const corridor = request.profile === "wilderness" ? colors.accent : colors.floor;
      lines.push(`<path d="M ${px} ${py} L ${cx} ${py} L ${cx} ${cy}" fill="none" stroke="${colors.wall}" stroke-width="${Math.max(8, scale * 0.65)}" stroke-linecap="square"/>`);
      lines.push(`<path d="M ${px} ${py} L ${cx} ${py} L ${cx} ${cy}" fill="none" stroke="${corridor}" stroke-width="${Math.max(5, scale * 0.42)}" stroke-linecap="square"/>`);
    }
    if (request.profile === "wilderness") {
      for (let p = 0; p < 2 + Math.floor(rng() * 4); p += 1) {
        const tx = x + 8 + rng() * Math.max(8, w - 16), ty = y + 8 + rng() * Math.max(8, h - 16);
        lines.push(`<circle cx="${tx}" cy="${ty}" r="${3 + rng() * 4}" fill="${colors.detail}" opacity=".72"/>`);
      }
    } else if (request.profile === "cave") {
      lines.push(`<circle cx="${x + w * 0.72}" cy="${y + h * 0.35}" r="${Math.max(6, scale * 0.38)}" fill="${colors.accent}" opacity=".7"/>`);
    } else {
      lines.push(`<path d="M ${x + w * .2} ${y + h * .2} h ${w * .6} M ${x + w * .2} ${y + h * .35} h ${w * .45}" stroke="${colors.detail}" stroke-width="2" opacity=".75"/>`);
    }
  });
  if (request.grid) {
    for (let x = 0; x <= width; x += scale) lines.push(`<path d="M${x} 0V${height}" stroke="${colors.wall}" stroke-opacity=".14"/>`);
    for (let y = 0; y <= height; y += scale) lines.push(`<path d="M0 ${y}H${width}" stroke="${colors.wall}" stroke-opacity=".14"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${request.title}"><title>${request.title}</title>${lines.join("")}<text x="${scale}" y="${height - scale * .45}" fill="${colors.wall}" font-family="system-ui, sans-serif" font-size="${scale * .55}" opacity=".8">${request.title}</text></svg>`;
  return {
    ...request,
    svg,
    createdAt: new Date().toISOString(),
    foundry: { sceneWidthPx: width * request.cellSize / scale, sceneHeightPx: height * request.cellSize / scale, gridSizePx: request.cellSize, gridDistance: request.scaleFeet, gridUnits: "ft" },
    capabilities: { preview: true, deterministic: true, provider: request.provider, editableTopology: request.provider === "amba-native" }
  };
}
