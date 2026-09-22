from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def seed_data_dir() -> Path:
    """Resolve repo `data/` (JSON seeds) from env or by walking parents."""
    override = os.environ.get("AUTHENGINE_SEED_DATA_DIR")
    if override:
        path = Path(override).expanduser().resolve()
        if not (path / "rbac.json").is_file():
            raise FileNotFoundError(f"rbac.json not found in AUTHENGINE_SEED_DATA_DIR={path}")
        return path

    for parent in Path(__file__).resolve().parents:
        candidate = parent / "data"
        if (candidate / "rbac.json").is_file():
            return candidate

    raise FileNotFoundError(
        "Could not find data/rbac.json. Set AUTHENGINE_SEED_DATA_DIR or run from the repo."
    )


def load_json(name: str) -> dict[str, Any]:
    path = seed_data_dir() / name
    if not path.is_file():
        raise FileNotFoundError(f"Seed file missing: {path}")
    return json.loads(path.read_text(encoding="utf-8"))
