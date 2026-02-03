#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from _shared import append_json_log, ensure_log_dir, iso_now, read_stdin_json

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def log_session_end(input_data):
    """Log session end event to logs directory."""
    log_dir = ensure_log_dir()
    log_file = log_dir / "session_end.json"
    input_data["logged_at"] = iso_now()
    append_json_log(log_file, input_data)


def perform_cleanup():
    """Perform optional cleanup tasks at session end."""
    cleanup_actions = []

    # Example cleanup: Remove temporary files from logs directory
    log_dir = Path("logs")
    if log_dir.exists():
        # Clean up any .tmp files
        for tmp_file in log_dir.glob("*.tmp"):
            try:
                tmp_file.unlink()
                cleanup_actions.append(f"Removed temp file: {tmp_file.name}")
            except Exception:
                pass

    # Example cleanup: Clean up old chat.json if it exists and is stale
    chat_file = log_dir / "chat.json" if log_dir.exists() else None
    if chat_file and chat_file.exists():
        try:
            # Check if file is older than 24 hours
            file_age = datetime.now().timestamp() - chat_file.stat().st_mtime
            if file_age > 86400:  # 24 hours in seconds
                chat_file.unlink()
                cleanup_actions.append("Removed stale chat.json (older than 24 hours)")
        except Exception:
            pass

    return cleanup_actions


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--cleanup', action='store_true',
                          help='Perform cleanup tasks at session end')
        args = parser.parse_args()

        # Read JSON input from stdin
        input_data = read_stdin_json()
        if not input_data:
            sys.exit(0)

        # Extract session_id for cleanup logging
        session_id = input_data.get('session_id', 'unknown')

        # Log the session end event
        log_session_end(input_data)

        # Perform cleanup if requested
        if args.cleanup:
            cleanup_actions = perform_cleanup()
            if cleanup_actions:
                # Log cleanup actions
                cleanup_log = {
                    "session_id": session_id,
                    "cleanup_at": iso_now(),
                    "actions": cleanup_actions
                }
                log_dir = ensure_log_dir()
                cleanup_file = log_dir / "cleanup.json"
                append_json_log(cleanup_file, cleanup_log)

        # Success
        sys.exit(0)

    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)


if __name__ == '__main__':
    main()
