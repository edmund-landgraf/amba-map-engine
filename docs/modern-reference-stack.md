# Modern reference stack for AMBA Map Engine

The goal is a controlled, modern Watabou-like battlemap generator without reimplementing every idea from scratch.

## Chosen references

### Layout foundation: Ben Cooley

[benjcooley/dungeongen](https://github.com/benjcooley/dungeongen) is MIT licensed and already separates the concerns we need:

- room models and templates;
- rectangular and circular room occupancy;
- passage routing and connection graphs;
- door and stair models;
- water generation;
- validation rules;
- SVG and PNG rendering.

AMBA should port/adapt the layout concepts into TypeScript so Node remains the runtime. Preserve the MIT notice in `THIRD_PARTY_NOTICES.md`.

### Rendering reference: Wildfirebill

[wildfirebill/dungeongen](https://github.com/wildfirebill/dungeongen) is another MIT-licensed implementation inspired by One Page Dungeon. Its useful additions include:

- configurable room counts and symmetry;
- organic passage rendering;
- crosshatch shading;
- water depth levels and ripples;
- room decorations;
- map rotation with recomputed bounds;
- deterministic labels and titles.

Use these as renderer requirements and port only what improves VTT battlemap output. Do not copy a renderer wholesale when a smaller AMBA-native SVG implementation is clearer.

### VTT reference: Cartomancer

[DimitroffVodka/cartomancer](https://github.com/DimitroffVodka/cartomancer) is a current Foundry module that runs/imports Watabou generators. It is valuable as a compatibility reference for:

- square-grid tactical scenes;
- walls and doors;
- fog and token vision;
- multi-level floors and stair regions;
- journal/room pin relationships;
- running generators locally to avoid fragile browser downloads.

Cartomancer is not an AMBA dependency. Before reusing any code, verify its repository license and preserve its attribution requirements.

## AMBA implementation strategy

1. Port the layout model first: rooms, occupancy grid, passages, doors, room IDs, and validation.
2. Keep rendering in TypeScript/SVG so the existing Express/Sharp pipeline stays simple.
3. Add the VTT scene contract directly to the canonical map document.
4. Add crosshatch, water, props, and rotation as independent renderer layers.
5. Add Foundry/UVTT adapters only after wall and door geometry is validated against the same occupancy grid.

## What not to do

- Do not attempt to recover Watabou's closed One Page Dungeon source.
- Do not depend on Python, Skia, or a separate service for the first Node release.
- Do not build an Inkarnate-style editor.
- Do not claim Foundry/Owlbear exports until the adapter emits their actual scene data.
- Do not judge quality by feature count alone; compare generated layouts visually and through walkability/geometry tests.

## Quality gate

A dungeon profile is not ready when it merely has rooms. It must pass:

- connected walkable floor;
- no accidental room overlaps;
- orthogonal room exits;
- corridor widths within profile bounds;
- doors placed on wall boundaries;
- room anchors aligned to grid cells;
- readable labels with an explicit off mode;
- export dimensions matching grid metadata;
- a visual comparison sample against the chosen reference style.
