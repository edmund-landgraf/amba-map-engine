"""Small JSON-lines bridge around the vendored CC0 DonJuan engine."""
from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "vendor" / "donjuan"))

from donjuan import Dungeon, DungeonExporter, DungeonRandomizer, Randomizer, RoomSizeRandomizer  # noqa: E402


def generate(request: dict) -> dict:
    seed_text = str(request.get("seed", "amba-1"))
    seed = sum((index + 1) * ord(char) for index, char in enumerate(seed_text)) % (2**31 - 1)
    Randomizer.seed(seed)
    rows = max(16, min(80, int(request.get("height", 32))))
    cols = max(20, min(100, int(request.get("width", 48))))
    max_rooms = max(4, min(40, int(6 + float(request.get("density", 0.55)) * 14)))
    min_size = max(3, min(8, int(request.get("minRoomSize", 4))))
    max_size = max(min_size + 1, min(12, int(request.get("maxRoomSize", 8))))
    scene = Dungeon(rows, cols, randomizers=[DungeonRandomizer(
        max_num_rooms=max_rooms,
        room_size_randomizer=RoomSizeRandomizer(min_size=min_size, max_size=max_size),
        door_probability=float(request.get("doorProbability", 1.0)),
    )])
    scene.randomize()
    scene.emplace_rooms()
    output_dir = Path(tempfile.mkdtemp(prefix="amba-donjuan-"))
    exporter = DungeonExporter(
        tile_size=int(request.get("cellSize", 70)),
        pack=str(request.get("pack", "stone")),
        add_lights=bool(request.get("addLights", True)),
        grid_distance=int(request.get("scaleFeet", 5)),
    )
    image_path, scene_path = exporter.export(scene, str(output_dir), request.get("title") or "AMBA Dungeon")
    return {"imagePath": image_path, "scenePath": scene_path, "seed": seed_text, "engine": "donjuan", "sceneWidth": cols, "sceneHeight": rows}


for line in sys.stdin:
    try:
        request = json.loads(line)
        print(json.dumps({"ok": True, "result": generate(request)}), flush=True)
    except Exception as error:  # the Node bridge returns a useful fallback/error
        print(json.dumps({"ok": False, "error": str(error)}), flush=True)
