import express from "express";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateMap } from "./generator.js";
import { generateWithDonjuan } from "./donjuan.js";
import { listMaps, saveMap } from "./db.js";
import type { MapRequest } from "../shared/map.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "amba-map-engine", version: "0.1.0" }));
app.get("/api/maps", async (_req, res) => res.json(await listMaps()));
app.post("/api/maps/generate", async (req, res) => {
  const body = req.body as Partial<MapRequest> & { persist?: boolean };
  const map = generateMap({
    title: body.title,
    seed: String(body.seed || "amber-1"),
    provider: body.provider === "watabou" || body.provider === "gozzys" ? body.provider : "amba-native",
    profile: body.profile === "cave" || body.profile === "wilderness" ? body.profile : "dungeon",
    width: Number(body.width || 32), height: Number(body.height || 24), density: Number(body.density || 0.55), grid: body.grid !== false,
    cellSize: Number(body.cellSize || 70), scaleFeet: Number(body.scaleFeet || 5), labelMode: body.labelMode || "off", showTitle: body.showTitle !== false, showProps: body.showProps !== false, waterLevel: Number(body.waterLevel || 0), style: body.style || "tactical"
  });
  if (body.persist) await saveMap(map);
  res.json(map);
});
app.post("/api/maps/generate/donjuan", async (req, res) => {
  const body = req.body as Partial<MapRequest>;
  try {
    const result = await generateWithDonjuan({
      title: body.title,
      seed: String(body.seed || "amber-1"),
      provider: "amba-native",
      profile: "dungeon",
      width: Number(body.width || 32), height: Number(body.height || 24),
      density: Number(body.density || 0.55), grid: body.grid !== false,
      cellSize: Number(body.cellSize || 70), scaleFeet: Number(body.scaleFeet || 5),
      labelMode: body.labelMode || "off", showTitle: body.showTitle !== false,
      showProps: body.showProps !== false, waterLevel: Number(body.waterLevel || 0),
      style: body.style || "tactical"
    });
    res.json({ ...result, engine: "donjuan" });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : "DonJuan is unavailable" });
  }
});
app.post("/api/maps/render/png", async (req, res) => {
  const body = req.body as Partial<MapRequest>;
  const map = generateMap({
    title: body.title, seed: String(body.seed || "amber-1"),
    provider: body.provider === "watabou" || body.provider === "gozzys" ? body.provider : "amba-native",
    profile: body.profile === "cave" || body.profile === "wilderness" ? body.profile : "dungeon",
    width: Number(body.width || 32), height: Number(body.height || 24), density: Number(body.density || 0.55), grid: body.grid !== false,
    cellSize: Number(body.cellSize || 70), scaleFeet: Number(body.scaleFeet || 5), labelMode: body.labelMode || "off", showTitle: body.showTitle !== false, showProps: body.showProps !== false, waterLevel: Number(body.waterLevel || 0), style: body.style || "tactical"
  });
  const png = await sharp(Buffer.from(map.svg)).png().toBuffer();
  res.type("png").send(png);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "../../dist/web");
app.use(express.static(webRoot));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) return res.sendFile(path.join(webRoot, "index.html"));
  return next();
});

const port = Number(process.env.PORT || 3112);
app.listen(port, () => console.log(`AMBA Map Engine listening on http://localhost:${port}`));
