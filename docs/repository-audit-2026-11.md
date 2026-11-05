# Open-source repository audit — 2026-11

This audit is focused on the actual AMBA mission: seeded, encounter-scale battle maps with clean image output and VTT geometry. We prefer code that can be vendored or isolated behind a thin adapter. Artistic inspiration is useful, but it is not a reason to add a dependency.

## Highest-value findings

### DonJuan — already integrated

Repository: [tmcclintock/donjuan](https://github.com/tmcclintock/donjuan)

CC0-licensed procedural engine with dungeon, forest, camp, and village packages. Its dungeon path already models rooms, hallways, doors, textured rendering, and Foundry scene export. It is vendored under `vendor/donjuan` and called through `scripts/donjuan-worker.py`.

### UVTT exporter — implement the contract, do not vendor the module

Repository: [arrowedisgaming/uvtt-exporter](https://github.com/arrowedisgaming/uvtt-exporter)

This is a Foundry v14 exporter, but its pure data contract is exactly what AMBA needs for cross-VTT delivery: embedded PNG, square-grid resolution, wall polylines, door/window portals, and ambient lights. The repository's technical brief emphasizes the critical coordinate conversion from Foundry canvas pixels to grid-square coordinates and the fact that UVTT tokens are not a portable part of the standard. We should implement a small server-side `uvtt` builder around our canonical map document rather than pull the Foundry module into the generator.

**Decision:** adopt the format and validation rules; do not vendor the Foundry-specific module.

### Dungeon Mapper — UX reference, license boundary

Repository: [evillollive/Dungeon-Mapper](https://github.com/evillollive/Dungeon-Mapper)

Modern TypeScript/Vite battlemap application with deterministic rooms/corridors, caverns, terrain, fog, tokens, player-safe views, and JSON/PNG/SVG export. It is AGPL-3.0, so it is a strong workflow reference but not a casual code source for this repository.

**Decision:** borrow the separation between editable project data, GM view, player view, and session state. Do not copy code unless AMBA intentionally adopts compatible licensing.

### TTRPG-grid — useful composition and validation ideas, unclear license

Repository: [Wally-Ahmed/TTRPG-grid](https://github.com/Wally-Ahmed/TTRPG-grid)

The project uses deterministic seeded layout, BSP rooms/corridors, cellular-automata caverns, noise fields, connectivity repair, retries, pre-made art tiles, metadata JSON, and Foundry/Owlbear-oriented settings. That is a useful reference for a later compositing layer and for map-quality gates.

**Decision:** no code or assets until a clear license is verified. Borrow only the public algorithm ideas and acceptance criteria for now.

### Graph Dungeon Generator — optional topology mode

Repository: [halftheopposite/graph-dungeon-generator](https://github.com/halftheopposite/graph-dungeon-generator)

MIT-licensed TypeScript project that separates graph generation, room placement, tile-map conversion, and rendering. It is smaller than DonJuan and limited to non-circular graphs, but the separation is useful for an AMBA “scenario graph” mode where rooms and required connections are specified before geometry is placed.

**Decision:** do not vendor yet. Revisit when encounter/room graph inputs become a product feature.

### One Page Parser — compatibility reference

Repository: [TarkanAl-Kazily/one-page-parser](https://github.com/TarkanAl-Kazily/one-page-parser)

MIT-licensed Foundry module that imports Watabou One Page Dungeon PNG and JSON exports. It confirms the practical handoff pattern: image, exported geometry JSON, and matching grid size. It is not a generator and should not become a runtime dependency.

**Decision:** use as a regression fixture/reference for Watabou-like geometry and grid alignment.

## Current recommendation

The best low-code stack is now:

1. DonJuan for the first real dungeon renderer and Foundry scene data.
2. AMBA's canonical map document as the stable intermediate representation.
3. A small UVTT serializer for portability across Foundry, Owlbear-adjacent tools, Roll20, AboveVTT, and Arkenforge consumers.
4. Ben Cooley/Wildfirebill ideas for additional room shapes, caves, water, labels, and controlled visual passes.
5. Dungeon Mapper's workflow concepts for later GM/player/session UX, without copying AGPL code.

This keeps the engine reusable while preserving AMBA control over seeds, labels, metadata, exports, and integration hooks.
