#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from _shared import append_json_log, ensure_log_dir, read_stdin_json

def main():
    try:
        # Read JSON input from stdin
        input_data = read_stdin_json()
        if not input_data:
            sys.exit(0)

        log_dir = ensure_log_dir()
        log_path = log_dir / "post_tool_use.json"
        append_json_log(log_path, input_data)
        
        sys.exit(0)
        
    except Exception:
        # Exit cleanly on any other error
        sys.exit(0)

if __name__ == '__main__':
    main()
