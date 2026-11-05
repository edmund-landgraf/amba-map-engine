# AMBA Map Engine

Standalone seeded map-image generation for AMBA. The app has three provider paths in its contract—Watabou, Gozzys, and AMBA Native—and currently ships a native deterministic SVG preview for dungeon, cave, and glade profiles.

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
  "persist": true
}
```

## AMBA hooks

The provider and artifact fields are already modeled in the shared request/result contract. The next integration slice should add an AMBA adapter that can publish the generated SVG/PNG and canonical map metadata as an AMBA map artifact without making AMBA a runtime dependency.

## Product direction

- **Now:** seed + provider + profile → deterministic map image preview.
- **Next:** persist render layers and map revisions; add PNG export and a layer visibility panel.
- **Then:** add brush/shape overlays, reusable scene stamps, custom asset uploads, copy/paste groups, autosave, and player-safe/GM-safe layer variants.
- **Later:** add high-resolution tiled export, VTT geometry, and AMBA-linked encounter anchors.

Reference: [Inkarnate FAQ and feature overview](https://inkarnate.com/faq), [Inkarnate 2.0 changelog](https://feedback.inkarnate.com/changelog/inkarnate-20-star).
