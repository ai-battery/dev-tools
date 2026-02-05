# Agent Knowledge Base

Patterns, conventions, and learnings for Claude Code agents working in this plugin.

---

## Claude Code Hooks

### Hook Types

Three hook types are available, each with different capabilities:

| Type | Model Selection | Tool Access | Use Case |
|------|-----------------|-------------|----------|
| `command` | No | No | Shell scripts, simple logging |
| `prompt` | Yes | No | Single-turn evaluation, quick decisions |
| `agent` | Yes | Yes (Read, Write, Glob, Grep, etc.) | Complex analysis, file modifications |

### Model Selection for Hooks

- Use `haiku` for cost-efficient, simple analysis tasks
- Use `sonnet` for balanced cost/capability
- Use `opus` for complex reasoning
- Only `prompt` and `agent` hooks support model specification

### Hook Events Lifecycle

```
SessionStart → UserPromptSubmit → PreToolUse → PostToolUse → Stop
                                     ↓
                              PostToolUseFailure

PreCompact (triggered by context window filling or /compact)
```

Key events:
- `PreCompact` - Before context compaction (backup opportunity)
- `Stop` - After Claude finishes responding (not on user interrupts)
- `SessionStart` - Has `source` field: "startup", "resume", or "compact"

### Hook Input/Output

All hooks receive JSON on stdin with common fields:
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project/root"
}
```

For `prompt`/`agent` hooks, use `$ARGUMENTS` to inject the input JSON:
```json
{
  "type": "agent",
  "prompt": "Analyze this: $ARGUMENTS",
  "model": "haiku"
}
```

### Exit Codes

- `0` - Success, allow action
- `2` - Block action, send stderr as feedback
- Other - Non-blocking error

---

## Plugin Patterns

### File Locations

- `.claude/agents/*.md` - Agent definitions
- `.claude/decisions.md` - Decision log
- `hooks.json` - Hook wiring
- `hooks/*.py` - Hook implementations
- `logs/*.json` - Audit logs

### Agent Definition Format

```markdown
---
name: agent-name
description: When to use this agent (action-oriented)
tools: Read, Write, Glob, Grep
model: haiku | sonnet | opus
color: cyan | yellow | green | etc.
---

# Purpose
...

## Instructions
...
```

---

## Development Conventions

### Hook Script Pattern

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["python-dotenv"]
# ///

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from _shared import read_stdin_json, ensure_log_dir, append_json_log

def main():
    input_data = read_stdin_json()
    # Process input_data
    sys.exit(0)

if __name__ == '__main__':
    main()
```

### Environment Variables

- `${CLAUDE_PLUGIN_ROOT}` - Plugin installation directory (use in hooks.json)
- `$CLAUDE_PROJECT_DIR` - Current project directory
