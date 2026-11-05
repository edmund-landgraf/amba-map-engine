# AMBA Map Engine

Standalone seeded battlemap-image generation for AMBA. The app has three provider paths in its contract—Watabou, Gozzys, and AMBA Native—and currently ships a native deterministic SVG/PNG preview for dungeon rooms, caves, and wilderness encounters.

The authoring direction also takes cues from Inkarnate: maps will become layered scenes with reusable, license-aware assets, copyable scene groups, custom layers, autosave, and high-resolution exports. Those are deliberately sequenced after the current seeded image-generation slice.

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

Open `http://localhost:5192`. The API runs on `http://localhost:3112`.

Postgres is optional for the first preview slice. If it is unavailable, generated maps are kept in memory so the UI still works. Set `DATABASE_URL` and run `npm run db:push` to persist maps.

## API

- `GET /api/health`
- `GET /api/maps`
- `POST /api/maps/generate`

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

The generated response includes Foundry-oriented scene metadata: image dimensions, grid size in pixels, grid distance, and grid units. PNG export is available at `POST /api/maps/render/png`.

The generator keeps presentation controls explicit and reversible: label mode (`off`, `numbers`, `names`), title visibility, tactical props, water level, style preset, grid visibility, and density are all request parameters. Labels are rendered as their own controlled pass, so a clean Foundry image does not inherit unwanted room text.

## AMBA hooks

The provider and artifact fields are already modeled in the shared request/result contract. The next integration slice should add an AMBA adapter that can publish the generated SVG/PNG and canonical map metadata as an AMBA map artifact without making AMBA a runtime dependency.

## Product direction

- **Now:** seed + provider + battlemap profile → deterministic grid-aligned map image preview and PNG export.
- **Next:** persist render layers and map revisions; add PNG export and a layer visibility panel.
- **Then:** add brush/shape overlays, reusable scene stamps, custom asset uploads, copy/paste groups, autosave, and player-safe/GM-safe layer variants.
- **Later:** add high-resolution tiled export, VTT geometry, and AMBA-linked encounter anchors.

Reference: [Inkarnate FAQ and feature overview](https://inkarnate.com/faq), [Inkarnate 2.0 changelog](https://feedback.inkarnate.com/changelog/inkarnate-20-star).
