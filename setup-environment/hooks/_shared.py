from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


def read_stdin_json() -> dict[str, Any]:
    """Read JSON from stdin. Returns empty dict on parse errors."""
    try:
        raw = sys.stdin.read()
        if not raw:
            return {}
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
        return {}
    except json.JSONDecodeError:
        return {}


def ensure_log_dir(cwd: str | Path | None = None) -> Path:
    """Ensure the logs directory exists and return its Path."""
    base = Path(cwd) if cwd is not None else Path.cwd()
    log_dir = base / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def append_json_log(log_path: Path, entry: dict[str, Any]) -> None:
    """Append an entry to a JSON list log file."""
    log_data: list[Any]
    if log_path.exists():
        try:
            with open(log_path, "r") as f:
                log_data = json.load(f)
                if not isinstance(log_data, list):
                    log_data = []
        except (json.JSONDecodeError, ValueError):
            log_data = []
    else:
        log_data = []

    log_data.append(entry)

    with open(log_path, "w") as f:
        json.dump(log_data, f, indent=2)


def iso_now() -> str:
    """Return the current timestamp in ISO format."""
    return datetime.now().isoformat()
