import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MapRequest } from "../shared/map.js";

type DonjuanResult = { imagePath: string; scenePath: string; seed: string; engine: "donjuan"; sceneWidth: number; sceneHeight: number };

export async function generateWithDonjuan(request: MapRequest): Promise<{ imageDataUrl: string; scene: unknown; metadata: DonjuanResult }> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const worker = path.join(root, "scripts", "donjuan-worker.py");
  const python = process.env.DONJUAN_PYTHON || "python";
  const result = await new Promise<DonjuanResult>((resolve, reject) => {
    const child = spawn(python, [worker], { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let errorOutput = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(errorOutput || `DonJuan worker exited with ${code}`));
      try {
        const parsed = JSON.parse(output.trim()) as { ok: boolean; result?: DonjuanResult; error?: string };
        if (!parsed.ok || !parsed.result) return reject(new Error(parsed.error || "DonJuan generation failed"));
        resolve(parsed.result);
      } catch (error) { reject(error); }
    });
    child.stdin.end(JSON.stringify({ ...request, pack: request.style === "old-school" ? "stone" : request.style === "wilderness" ? "wood" : "stone" }) + "\n");
  });
  const [image, sceneText] = await Promise.all([readFile(result.imagePath), readFile(result.scenePath, "utf8")]);
  return { imageDataUrl: `data:image/png;base64,${image.toString("base64")}`, scene: JSON.parse(sceneText), metadata: result };
}
