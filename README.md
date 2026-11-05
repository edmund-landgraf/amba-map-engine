# AMBA Map Engine

Standalone seeded tactical-map generation for AMBA. The app has three provider paths in its contract—Watabou, Gozzys, and AMBA Native—and currently ships a native deterministic SVG/PNG preview for dungeon rooms, caves, and wilderness encounters.

This is intentionally not a general-purpose map editor. Its first benchmark is the classic seeded one-page dungeon: a connected encounter layout with rooms, passages, doors, a clear entrance, a strong final room, optional treasure/hazard/secret features, room numbering, and clean image output. The controls modernize that workflow while the generated document carries richer metadata for Foundry and other VTTs.

The repo also vendors [DonJuan](https://github.com/tmcclintock/donjuan), a CC0-licensed Python battlemap engine. It generates textured dungeon maps and Foundry scene bundles containing the rendered image, walls, doors, and lights. The Node API exposes it through a thin JSON-lines worker bridge; the TypeScript generator remains available as a dependency-light fallback. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution.

## Stack

- Node.js + Express API
- React + Vite
- Tailwind CSS with shadcn-compatible primitives
- Prisma + PostgreSQL persistence
- Deterministic seeded generation

## Run locally

```powershell
copy .env.example .env
npm install
npm run db:generate
npm run dev
```

For the DonJuan engine, install its optional Python dependencies in the same environment:

```powershell
python -m pip install -r vendor/donjuan/requirements.txt
```

Open `http://localhost:5192`. The API runs on `http://localhost:3112`.

Postgres is optional for the first preview slice. If it is unavailable, generated maps are kept in memory so the UI still works. Set `DATABASE_URL` and run `npm run db:push` to persist maps.

## API

- `GET /api/health`
- `GET /api/maps`
- `POST /api/maps/generate`
- `POST /api/maps/generate/donjuan` — returns a rendered PNG data URL and Foundry scene JSON

Example:

```json
{
  "title": "The Ironbriar Cache",
  "seed": "ironbriar-01",
  "provider": "amba-native",
  "profile": "dungeon",
  "width": 32,
  "height": 24,
  "density": 0.55,
  "grid": true,
  "cellSize": 70,
  "scaleFeet": 5,
  "persist": true
}
```

The generated response includes VTT-oriented scene metadata: image dimensions, grid size in pixels, grid distance, and grid units. PNG export is available at `POST /api/maps/render/png`. This is not yet a native Foundry or Owlbear scene export; those should be added as explicit adapters once their handoff formats are implemented.

Set `DONJUAN_PYTHON` when Python is not available as `python` on PATH. The DonJuan endpoint is intentionally separate while the engine is being validated; this keeps the existing standalone preview stable and makes engine comparisons reproducible by seed.

The generator keeps presentation controls explicit and reversible: label mode (`off`, `numbers`, `names`), title visibility, tactical props, water level, style preset, grid visibility, and density are all request parameters. Labels are rendered as their own controlled pass, so a clean Foundry image does not inherit unwanted room text.

## Primary output: VTT-ready encounter maps

The canonical output should eventually be a small VTT scene bundle, not just a bitmap:

- background image with exact pixel dimensions;
- square grid size and feet-per-square scale;
- opaque wall segments;
- doors with stable IDs and states;
- windows, secret doors, and one-way passages;
- difficult-terrain and terrain regions;
- light sources and darkness regions;
- room/feature/encounter anchors;
- seed, generator version, parameter set, and export hashes;
- clean player-safe and annotated GM variants.

The map image remains useful on its own, but VTT geometry and metadata are the product's main differentiator.

## One-page dungeon benchmark

For a dungeon seed, the generator should always produce a playable small adventure space rather than an unstructured scatter of rooms. The benchmark checks that the map has:

- one connected walkable floor network;
- an identifiable entrance and final/boss room;
- several encounter rooms plus at least one optional hazard, treasure, or secret feature when the layout is large enough;
- orthogonal passages with doors represented separately from wall geometry;
- stable room IDs and numbered anchors that survive image restyling;
- labels and titles that can be switched off without changing topology;
- exact grid dimensions and seed-preserving regeneration.

The native generator now emits `rooms` and `features` alongside the image and Foundry metadata. DonJuan remains the higher-fidelity rendering path for comparison.

## AMBA hooks

The provider and artifact fields are already modeled in the shared request/result contract. The next integration slice should add an AMBA adapter that can publish the generated SVG/PNG and canonical map metadata as an AMBA map artifact without making AMBA a runtime dependency.

## Product direction

- **Now:** seed + provider + battlemap profile → deterministic grid-aligned map image preview and PNG export.
- **Next:** implement real dungeon/cave/wilderness algorithms and derive walls, doors, and room anchors from the same topology.
- **Then:** add an explicit UVTT scene bundle plus separate Foundry and Owlbear adapters, terrain/light regions, player-safe/GM-safe variants, and AMBA-linked encounter anchors.
- **Later:** add limited compositing controls only where they improve VTT readability; do not become a full cartography editor.

Inkarnate is a UX reference for clarity and layer visibility, not our product scope: [FAQ](https://inkarnate.com/faq), [2.0 changelog](https://feedback.inkarnate.com/changelog/inkarnate-20-star).
