#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from _security import is_dangerous_rm_command, is_env_file_access
from _shared import append_json_log, ensure_log_dir, read_stdin_json

def main():
    try:
        # Read JSON input from stdin
        input_data = read_stdin_json()
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Check for .env file access (blocks access to sensitive environment files)
        if is_env_file_access(tool_name, tool_input):
            print("BLOCKED: Access to .env files containing sensitive data is prohibited", file=sys.stderr)
            print("Use .env.sample for template files instead", file=sys.stderr)
            sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Check for dangerous rm -rf commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            
            # Block rm -rf commands with comprehensive pattern matching
            if is_dangerous_rm_command(command):
                print("BLOCKED: Dangerous rm command detected and prevented", file=sys.stderr)
                sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Ensure log directory exists
        log_dir = ensure_log_dir()
        log_path = log_dir / "pre_tool_use.json"
        append_json_log(log_path, input_data)
        
        sys.exit(0)
        
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)

if __name__ == '__main__':
    main()
