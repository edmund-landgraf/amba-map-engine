import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, Dices, Grid3X3, Layers3, Map as MapIcon, Save, Sparkles } from "lucide-react";
import type { GeneratedMap, MapRequest, Profile, Provider } from "../shared/map.js";
import "./styles.css";

const defaults: MapRequest = { title: "", seed: "ironbriar-01", provider: "amba-native", profile: "dungeon", width: 32, height: 24, density: .55, grid: true };

function App() {
  const [request, setRequest] = useState(defaults);
  const [map, setMap] = useState<GeneratedMap | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const update = <K extends keyof MapRequest>(key: K, value: MapRequest[K]) => setRequest((current) => ({ ...current, [key]: value }));
  const generate = async (persist = false) => {
    setBusy(true); setSaved(false);
    const response = await fetch("/api/maps/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...request, persist }) });
    setMap(await response.json()); setBusy(false); if (persist) setSaved(true);
  };
  useEffect(() => { void generate(); }, []);
  const download = () => { if (!map) return; const blob = new Blob([map.svg], { type: "image/svg+xml" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${map.seed}-${map.profile}.svg`; a.click(); URL.revokeObjectURL(url); };
  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><MapIcon size={18}/></div><div><div className="eyebrow">AMBA CARTOGRAPHY</div><h1>Map Engine</h1></div></div><div className="top-actions"><span className="status"><span className="status-dot"/> local generator online</span><a href="https://github.com/edmund-landgraf/amba-map-engine" target="_blank">GitHub</a></div></header>
    <section className="intro"><div><div className="eyebrow warm">SEED-FIRST PROCEDURAL MAPS</div><h2>Make a place worth exploring.</h2><p>Three provider paths, one clean workspace. Start with our native generator, keep the seed, and turn a quick idea into a map image for your adventure.</p></div><div className="seed-card"><div className="eyebrow">CURRENT SEED</div><strong>{request.seed}</strong><span>{request.provider === "amba-native" ? "AMBA Native" : request.provider === "watabou" ? "Watabou" : "Gozzys"} · {request.profile}</span></div></section>
    <div className="workspace">
      <aside className="panel controls"><div className="panel-title"><div><div className="eyebrow">GENERATOR</div><h3>Map recipe</h3></div><Sparkles size={18}/></div>
        <label>Provider<select value={request.provider} onChange={(e) => update("provider", e.target.value as Provider)}><option value="amba-native">AMBA Native</option><option value="watabou">Watabou</option><option value="gozzys">Gozzys</option></select></label>
        <label>Profile<select value={request.profile} onChange={(e) => update("profile", e.target.value as Profile)}><option value="dungeon">Dungeon</option><option value="cave">Cave</option><option value="glade">Glade</option></select></label>
        <label>Title<input value={request.title} onChange={(e) => update("title", e.target.value)} placeholder="The Ironbriar Cache"/></label>
        <label>Seed<div className="input-row"><input value={request.seed} onChange={(e) => update("seed", e.target.value)}/><button className="icon-button" title="Random seed" onClick={() => update("seed", Math.random().toString(36).slice(2, 10))}><Dices size={16}/></button></div></label>
        <div className="two-col"><label>Width<input type="number" min="16" max="80" value={request.width} onChange={(e) => update("width", Number(e.target.value))}/></label><label>Height<input type="number" min="12" max="60" value={request.height} onChange={(e) => update("height", Number(e.target.value))}/></label></div>
        <label>Density <span className="range-value">{Math.round(request.density * 100)}%</span><input className="range" type="range" min="20" max="90" value={request.density * 100} onChange={(e) => update("density", Number(e.target.value) / 100)}/></label>
        <label className="check"><input type="checkbox" checked={request.grid} onChange={(e) => update("grid", e.target.checked)}/><Grid3X3 size={15}/> Show grid</label>
        <button className="primary" onClick={() => void generate()} disabled={busy}><Sparkles size={16}/>{busy ? "Generating…" : "Generate map"}</button>
        <div className="button-row"><button className="secondary" onClick={() => void generate(true)} disabled={busy}><Save size={15}/> {saved ? "Saved" : "Save map"}</button><button className="secondary" onClick={download} disabled={!map}><Download size={15}/> SVG</button></div>
      </aside>
      <section className="canvas-wrap"><div className="canvas-toolbar"><span><Layers3 size={15}/> {map?.profile || "preview"} / {map?.provider || "native"}</span><span className="muted">{map ? `${map.width} × ${map.height} cells` : "Preparing canvas"}</span></div><div className="map-canvas">{map ? <div className="svg-frame" dangerouslySetInnerHTML={{ __html: map.svg }} /> : <div className="empty">Generating your first map…</div>}</div><div className="canvas-footer"><span>Deterministic preview · seed <strong>{map?.seed}</strong></span><span>AMBA Map Engine 0.1.0</span></div></section>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
