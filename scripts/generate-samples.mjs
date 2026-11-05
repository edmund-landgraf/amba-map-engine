import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { generateMap } from "../dist/server/generator.js";

const outputDir = path.resolve("samples");
await fs.mkdir(outputDir, { recursive: true });

const samples = [
  { file: "01-dungeon-ironbriar.png", title: "Ironbriar Cache", seed: "ironbriar-sample", profile: "dungeon", style: "tactical", labelMode: "numbers", waterLevel: 0, showProps: true },
  { file: "02-cave-flooded-hollow.png", title: "Flooded Hollow", seed: "flooded-hollow-sample", profile: "cave", style: "stone", labelMode: "off", waterLevel: 0.65, showProps: true },
  { file: "03-wilderness-bridge.png", title: "The Broken Bridge", seed: "broken-bridge-sample", profile: "wilderness", style: "wilderness", labelMode: "off", waterLevel: 0.35, showProps: true }
];

for (const sample of samples) {
  const map = generateMap({ ...sample, width: 36, height: 24, density: 0.58, grid: true, cellSize: 70, scaleFeet: 5, showTitle: false, provider: "amba-native" });
  await fs.writeFile(path.join(outputDir, sample.file.replace(/\.png$/, ".svg")), map.svg);
  await sharp(Buffer.from(map.svg)).png().toFile(path.join(outputDir, sample.file));
}

console.log(`Generated ${samples.length} samples in ${outputDir}`);
