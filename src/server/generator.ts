import type { GeneratedMap, MapRequest } from "../shared/map.js";

type Room = { x: number; y: number; w: number; h: number; cx: number; cy: number; shape: "rect" | "circle"; role: "entrance" | "encounter" | "hazard" | "treasure" | "boss" | "secret" };
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

function carveLine(floor: boolean[][], from: Room, to: Room, rng: () => number, doors: Array<{ x: number; y: number; orientation: "vertical" | "horizontal"; state: "closed" }>) {
  let x = from.cx, y = from.cy;
  const horizontalFirst = rng() > 0.45;
  const carve = (cx: number, cy: number) => {
    for (let oy = 0; oy < 2; oy += 1) for (let ox = 0; ox < 2; ox += 1) {
      if (floor[cy + oy]?.[cx + ox] !== undefined) floor[cy + oy][cx + ox] = true;
    }
  };
  const walk = (axis: "x" | "y") => {
    if (axis === "x") while (x !== to.cx) { x += x < to.cx ? 1 : -1; carve(x, y); }
    else while (y !== to.cy) { y += y < to.cy ? 1 : -1; carve(x, y); }
  };
  carve(x, y);
  if (horizontalFirst) { walk("x"); walk("y"); } else { walk("y"); walk("x"); }
  carve(to.cx, to.cy);
  const horizontal = Math.abs(to.cx - from.cx) >= Math.abs(to.cy - from.cy);
  const addDoor = (door: { x: number; y: number; orientation: "vertical" | "horizontal"; state: "closed" }) => {
    const crossesFloor = door.orientation === "vertical"
      ? Boolean(floor[door.y]?.[door.x - 1] && floor[door.y]?.[door.x])
      : Boolean(floor[door.y - 1]?.[door.x] && floor[door.y]?.[door.x]);
    if (!crossesFloor) return;
    if (!doors.some((existing) => existing.x === door.x && existing.y === door.y && existing.orientation === door.orientation)) doors.push(door);
  };
  if (horizontal) {
    const fromRight = to.cx > from.cx;
    addDoor({ x: fromRight ? from.x + from.w : from.x, y: from.cy, orientation: "vertical", state: "closed" });
  } else {
    const fromBottom = to.cy > from.cy;
    addDoor({ x: from.cx, y: fromBottom ? from.y + from.h : from.y, orientation: "horizontal", state: "closed" });
  }
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
  const doors: Array<{ x: number; y: number; orientation: "vertical" | "horizontal"; state: "closed" }> = [];
  const target = Math.round(8 + request.density * 7);
  for (let attempt = 0; attempt < target * 30 && rooms.length < target; attempt += 1) {
    const w = 4 + Math.floor(rng() * 6), h = 4 + Math.floor(rng() * 6);
    const x = 2 + Math.floor(rng() * Math.max(1, request.width - w - 4));
    const y = 2 + Math.floor(rng() * Math.max(1, request.height - h - 4));
    if (rooms.some((room) => x < room.x + room.w + 2 && x + w + 2 > room.x && y < room.y + room.h + 2 && y + h + 2 > room.y)) continue;
    const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2), shape: rng() < 0.24 ? "circle" as const : "rect" as const, role: "encounter" as const };
    rooms.push(room);
    for (let ry = y; ry < y + h; ry += 1) for (let rx = x; rx < x + w; rx += 1) {
      const nx = (rx + .5 - (x + w / 2)) / (w / 2), ny = (ry + .5 - (y + h / 2)) / (h / 2);
      if (room.shape === "rect" || nx * nx + ny * ny <= 1.05) floor[ry][rx] = true;
    }
  }
  if (rooms.length > 0) rooms[0].role = "entrance";
  if (rooms.length > 1) rooms[rooms.length - 1].role = "boss";
  if (rooms.length > 3) rooms[Math.floor(rooms.length / 2)].role = "treasure";
  if (rooms.length > 5) rooms[1].role = "hazard";
  if (rooms.length > 7) rooms[rooms.length - 2].role = "secret";
  rooms.sort((a, b) => a.cx + a.cy - b.cx - b.cy);
  for (let i = 1; i < rooms.length; i += 1) carveLine(floor, rooms[i - 1], rooms[i], rng, doors);
  for (let i = 0; i < rooms.length - 2; i += 1) if (rng() < 0.24 + request.density * 0.32) carveLine(floor, rooms[i], rooms[i + 2], rng, doors);

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
  doors.forEach((door) => {
    const x = door.x * scale, y = door.y * scale;
    if (door.orientation === "vertical") {
      lines.push(`<rect x="${x - 3}" y="${y * 0 + y - scale * .34}" width="6" height="${scale * .68}" rx="2" fill="${colors.accent}" stroke="${colors.wall}" stroke-width="1"/>`);
    } else {
      lines.push(`<rect x="${x - scale * .34}" y="${y - 3}" width="${scale * .68}" height="6" rx="2" fill="${colors.accent}" stroke="${colors.wall}" stroke-width="1"/>`);
    }
  });
  if (request.showProps) rooms.forEach((room, index) => {
    const px = room.x + 1 + Math.floor(rng() * Math.max(1, room.w - 2)), py = room.y + 1 + Math.floor(rng() * Math.max(1, room.h - 2));
    if (request.profile === "wilderness") lines.push(`<circle cx="${(px + .5) * scale}" cy="${(py + .5) * scale}" r="${Math.max(3, scale * .16)}" fill="${colors.detail}" opacity=".8"/>`);
    else if (request.profile === "cave") lines.push(`<circle cx="${(px + .5) * scale}" cy="${(py + .5) * scale}" r="${Math.max(4, scale * .22)}" fill="${colors.accent}" opacity=".7"/>`);
    else if (room.role === "boss") lines.push(`<circle cx="${(room.cx + .5) * scale}" cy="${(room.cy + .5) * scale}" r="${scale * .3}" fill="none" stroke="${colors.detail}" stroke-width="3"/><circle cx="${(room.cx + .5) * scale}" cy="${(room.cy + .5) * scale}" r="${scale * .12}" fill="${colors.detail}"/>`);
    else if (room.role === "treasure") lines.push(`<path d="M${(room.cx - .45) * scale} ${(room.cy + .45) * scale}L${(room.cx + .45) * scale} ${(room.cy + .45) * scale}L${(room.cx + .45) * scale} ${(room.cy - .1) * scale}L${(room.cx - .45) * scale} ${(room.cy - .1) * scale}Z" fill="${colors.detail}" opacity=".8"/>`);
    else if (index % 2 === 0) lines.push(`<rect x="${px * scale + 5}" y="${py * scale + 5}" width="${scale - 10}" height="${scale - 10}" fill="${colors.detail}" opacity=".65"/>`);
  });
  // Room text is deliberately not painted into the battlemap. It is returned as
  // a separate GM annotation layer so the playable floor stays unobstructed.
  if (request.grid) {
    for (let x = 0; x <= width; x += scale) lines.push(`<path d="M${x} 0V${height}" stroke="${colors.grid}" stroke-opacity=".16"/>`);
    for (let y = 0; y <= height; y += scale) lines.push(`<path d="M0 ${y}H${width}" stroke="${colors.grid}" stroke-opacity=".16"/>`);
  }
  const title = request.showTitle ? `<text x="${scale}" y="${height - scale * .45}" fill="${colors.text}" font-family="system-ui, sans-serif" font-size="${scale * .55}" opacity=".85">${request.title}</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${request.title}"><title>${request.title}</title>${lines.join("")}${title}</svg>`;
  const roomData = rooms.map((room, index) => ({ id: `room-${index + 1}`, number: index + 1, role: room.role, x: room.x, y: room.y, width: room.w, height: room.h, shape: room.shape }));
  const features = rooms.filter((room) => room.role !== "encounter").map((room, index) => ({ id: `feature-${index + 1}`, kind: room.role === "secret" ? "secret-door" as const : room.role, roomId: `room-${rooms.indexOf(room) + 1}`, x: (room.cx + .5) * request.cellSize, y: (room.cy + .5) * request.cellSize }));
  const roleLabels: Record<Room["role"], string> = { entrance: "Entrance", encounter: "Encounter", hazard: "Hazard", treasure: "Treasure", boss: "Boss", secret: "Secret" };
  const roomLabels = rooms.map((room, index) => ({ roomId: `room-${index + 1}`, number: index + 1, label: request.labelMode === "names" ? roleLabels[room.role] : `Room ${String(index + 1).padStart(2, "0")}`, role: room.role }));
  return { ...request, svg, engine: "native", rooms: roomData, features, roomLabels, createdAt: new Date().toISOString(), foundry: { sceneWidthPx: width * request.cellSize / scale, sceneHeightPx: height * request.cellSize / scale, gridSizePx: request.cellSize, gridDistance: request.scaleFeet, gridUnits: "ft", doors, roomAnchors: rooms.map((room, index) => ({ id: `room-${index + 1}`, number: index + 1, x: (room.cx + .5) * request.cellSize, y: (room.cy + .5) * request.cellSize })) }, capabilities: { preview: true, deterministic: true, provider: request.provider, editableTopology: request.provider === "amba-native" } };
}
