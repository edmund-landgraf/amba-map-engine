import type { GeneratedMap, MapRequest } from "../shared/map.js";

type Room = { x: number; y: number; w: number; h: number; cx: number; cy: number };
type Palette = { bg: string; floor: string; wall: string; accent: string; detail: string; text: string; grid: string };

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
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

function carveLine(floor: boolean[][], from: Room, to: Room, rng: () => number) {
  let x = from.cx, y = from.cy;
  const horizontalFirst = rng() > 0.45;
  const carve = (cx: number, cy: number) => {
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      const nx = cx + dx, ny = cy + dy;
      if (floor[ny]?.[nx] !== undefined) floor[ny][nx] = true;
    }
  };
  const walk = (axis: "x" | "y") => {
    if (axis === "x") while (x !== to.cx) { x += x < to.cx ? 1 : -1; carve(x, y); }
    else while (y !== to.cy) { y += y < to.cy ? 1 : -1; carve(x, y); }
  };
  carve(x, y);
  if (horizontalFirst) { walk("x"); walk("y"); } else { walk("y"); walk("x"); }
  carve(to.cx, to.cy);
}

export function generateMap(input: MapRequest): GeneratedMap {
  const request: MapRequest = {
    title: input.title?.trim() || `${input.profile[0].toUpperCase()}${input.profile.slice(1)} · ${input.seed}`,
    seed: input.seed || "amber-1", provider: input.provider, profile: input.profile,
    width: clamp(Math.round(input.width || 32), 20, 80), height: clamp(Math.round(input.height || 24), 14, 60),
    density: clamp(Number(input.density || 0.55), 0.2, 0.9), grid: Boolean(input.grid),
    cellSize: clamp(Math.round(input.cellSize || 70), 20, 200), scaleFeet: clamp(Math.round(input.scaleFeet || 5), 1, 100),
    labelMode: input.labelMode || "off", showTitle: input.showTitle !== false, showProps: input.showProps !== false,
    waterLevel: clamp(Number(input.waterLevel || 0), 0, 1), style: input.style || (input.profile === "wilderness" ? "wilderness" : input.profile === "cave" ? "stone" : "tactical")
  };
  const rng = random(`${request.seed}/${request.provider}/${request.profile}`);
  const floor = Array.from({ length: request.height }, () => Array<boolean>(request.width).fill(false));
  const rooms: Room[] = [];
  const target = Math.round(7 + request.density * 6);
  for (let attempt = 0; attempt < target * 30 && rooms.length < target; attempt += 1) {
    const w = 4 + Math.floor(rng() * 6), h = 4 + Math.floor(rng() * 6);
    const x = 2 + Math.floor(rng() * Math.max(1, request.width - w - 4));
    const y = 2 + Math.floor(rng() * Math.max(1, request.height - h - 4));
    if (rooms.some((room) => x < room.x + room.w + 2 && x + w + 2 > room.x && y < room.y + room.h + 2 && y + h + 2 > room.y)) continue;
    const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
    rooms.push(room);
    for (let ry = y; ry < y + h; ry += 1) for (let rx = x; rx < x + w; rx += 1) floor[ry][rx] = true;
  }
  rooms.sort((a, b) => a.cx + a.cy - b.cx - b.cy);
  for (let i = 1; i < rooms.length; i += 1) carveLine(floor, rooms[i - 1], rooms[i], rng);
  for (let i = 0; i < rooms.length - 2; i += 1) if (rng() < 0.2 + request.density * 0.3) carveLine(floor, rooms[i], rooms[i + 2], rng);

  const colors: Palette = request.style === "wilderness"
    ? { bg: "#dce8d1", floor: "#b8cba1", wall: "#395d3e", accent: "#6e9a67", detail: "#876a48", text: "#253e2a", grid: "#47634b" }
    : request.style === "stone"
      ? { bg: "#17222b", floor: "#4b5963", wall: "#b8c2c5", accent: "#3f8098", detail: "#c1a26d", text: "#e6eeee", grid: "#aab8bd" }
      : request.style === "old-school"
        ? { bg: "#efe6d0", floor: "#d7c49e", wall: "#3f3426", accent: "#a3845a", detail: "#755a3b", text: "#392d21", grid: "#6a5741" }
        : { bg: "#15171c", floor: "#706963", wall: "#eee3cf", accent: "#ae8c62", detail: "#39342f", text: "#f6eddf", grid: "#cbbca8" };
  const scale = 24, width = request.width * scale, height = request.height * scale;
  const lines: string[] = [`<rect width="${width}" height="${height}" fill="${colors.bg}"/>`];
  const cell = (x: number, y: number, fill: string, opacity = 1) => lines.push(`<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}" fill="${fill}" opacity="${opacity}"/>`);
  const wall = (x: number, y: number, dx: number, dy: number) => lines.push(`<path d="M${x * scale} ${y * scale}L${(x + dx) * scale} ${(y + dy) * scale}" stroke="${colors.wall}" stroke-width="3" stroke-linecap="square"/>`);
  for (let y = 0; y < request.height; y += 1) for (let x = 0; x < request.width; x += 1) {
    if (!floor[y][x]) continue;
    cell(x, y, colors.floor);
    if (!floor[y - 1]?.[x]) wall(x, y, 1, 0);
    if (!floor[y]?.[x + 1]) wall(x + 1, y, 0, 1);
    if (!floor[y + 1]?.[x]) wall(x, y + 1, 1, 0);
    if (!floor[y]?.[x - 1]) wall(x, y, 0, 1);
    if (request.waterLevel > 0 && (request.profile === "cave" || request.profile === "wilderness") && rng() < request.waterLevel * 0.035) cell(x, y, colors.accent, 0.72);
  }
  if (request.showProps) rooms.forEach((room, index) => {
    const px = room.x + 1 + Math.floor(rng() * Math.max(1, room.w - 2)), py = room.y + 1 + Math.floor(rng() * Math.max(1, room.h - 2));
    if (request.profile === "wilderness") lines.push(`<circle cx="${(px + .5) * scale}" cy="${(py + .5) * scale}" r="${Math.max(3, scale * .16)}" fill="${colors.detail}" opacity=".8"/>`);
    else if (request.profile === "cave") lines.push(`<circle cx="${(px + .5) * scale}" cy="${(py + .5) * scale}" r="${Math.max(4, scale * .22)}" fill="${colors.accent}" opacity=".7"/>`);
    else if (index % 2 === 0) lines.push(`<rect x="${px * scale + 5}" y="${py * scale + 5}" width="${scale - 10}" height="${scale - 10}" fill="${colors.detail}" opacity=".65"/>`);
  });
  if (request.labelMode !== "off") rooms.forEach((room, index) => {
    const label = request.labelMode === "numbers" ? String(index + 1).padStart(2, "0") : ["Entry", "Hall", "Guardroom", "Shrine", "Vault", "Crossing"][index % 6];
    lines.push(`<text x="${(room.cx + .5) * scale}" y="${(room.cy + .2) * scale}" text-anchor="middle" fill="${colors.text}" font-family="system-ui, sans-serif" font-size="${Math.max(10, scale * .48)}" font-weight="700">${label}</text>`);
  });
  if (request.grid) {
    for (let x = 0; x <= width; x += scale) lines.push(`<path d="M${x} 0V${height}" stroke="${colors.grid}" stroke-opacity=".16"/>`);
    for (let y = 0; y <= height; y += scale) lines.push(`<path d="M0 ${y}H${width}" stroke="${colors.grid}" stroke-opacity=".16"/>`);
  }
  const title = request.showTitle ? `<text x="${scale}" y="${height - scale * .45}" fill="${colors.text}" font-family="system-ui, sans-serif" font-size="${scale * .55}" opacity=".85">${request.title}</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${request.title}"><title>${request.title}</title>${lines.join("")}${title}</svg>`;
  return { ...request, svg, createdAt: new Date().toISOString(), foundry: { sceneWidthPx: width * request.cellSize / scale, sceneHeightPx: height * request.cellSize / scale, gridSizePx: request.cellSize, gridDistance: request.scaleFeet, gridUnits: "ft" }, capabilities: { preview: true, deterministic: true, provider: request.provider, editableTopology: request.provider === "amba-native" } };
}
