# Modern reference stack for AMBA Map Engine

The goal is a controlled, modern Watabou-like battlemap generator without reimplementing every idea from scratch.

## Chosen references

### VTT-first engine candidate: DonJuan

[tmcclintock/donjuan](https://github.com/tmcclintock/donjuan) is CC0-licensed and is the strongest modern reuse candidate for the product's actual purpose: procedural battle maps with Foundry export. It already organizes reusable core grid/space primitives plus dungeon, forest, camp, and village scene packages, and exposes room, hallway, door, renderer, and exporter modules.

The preferred implementation path is to evaluate DonJuan as a worker/engine before expanding our own TypeScript generator. If its Python runtime and output contract fit deployment, AMBA Map Engine should orchestrate it from Node and preserve the returned scene metadata. If the runtime is too heavy, port only the narrow layout/export contract—not the whole renderer.

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

1. Evaluate DonJuan as the first reusable runtime for dungeon/forest/camp scene generation and Foundry export.
2. Use Ben's layout model when DonJuan lacks a needed profile or when a TypeScript-native path is materially simpler.
3. Use Wildfirebill's renderer ideas for visual layers rather than recreating them blindly.
4. Keep AMBA's Node/Express service as the orchestrator: seeds, presets, persistence, provenance, and AMBA hooks.
5. Normalize all engine results into the AMBA map document and validate wall/door/grid geometry before publishing.

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
