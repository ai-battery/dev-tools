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
SessionStart → UserPromptSubmit → PreToolUse → PostToolUse → Stop → SessionEnd
                                     ↓              ↓
                              PermissionRequest  PostToolUseFailure

SubagentStart → SubagentStop (parallel to main flow)
Notification (fires on permission_prompt, idle_prompt, auth_success, elicitation_dialog)
PreCompact (triggered by context window filling or /compact)
```

Key events and matchers:
- `SessionStart` - Matchers: `startup`, `resume`, `clear`, `compact`
- `SessionEnd` - Matchers: `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`
- `UserPromptSubmit` - No matcher support
- `PreToolUse` - Matcher: tool name (e.g., `Bash`, `Read|Write|Edit`)
- `PostToolUse` - Matcher: tool name
- `PostToolUseFailure` - Matcher: tool name
- `PermissionRequest` - Matcher: tool name
- `Notification` - Matcher: notification type (`permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`)
- `SubagentStart` - Matcher: agent type
- `SubagentStop` - Matcher: agent type
- `Stop` - No matcher support. Fires after Claude finishes responding (not on user interrupts)
- `PreCompact` - Matchers: `manual`, `auto`

### Hook Input/Output

All hooks receive JSON on stdin with common fields:
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project/root",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse"
}
```

For `prompt`/`agent` hooks, use `$ARGUMENTS` to inject the input JSON:
```json
{
  "type": "agent",
  "prompt": "Analyze this: $ARGUMENTS",
  "model": "haiku",
  "timeout": 120
}
```

### Hook Handler Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | required | `command`, `prompt`, or `agent` |
| `command`/`prompt` | string | required | Script path or prompt text |
| `model` | string | - | Model for prompt/agent hooks (`haiku`, `sonnet`, `opus`) |
| `timeout` | number | 120 | Max execution time in seconds |
| `statusMessage` | string | - | Message shown to user while hook runs |
| `async` | boolean | false | Run without blocking Claude's response |
| `once` | boolean | false | Run only once per session |

### Exit Codes

- `0` - Success, parse stdout for JSON output
- `2` - Block action (for PreToolUse, PermissionRequest, UserPromptSubmit, Stop, SubagentStop)
- Other - Non-blocking error, stderr shown in verbose mode

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
- `$CLAUDE_SESSION_ID` - Current session identifier
- `$CLAUDE_ENV_FILE` - File to persist env vars (SessionStart only, write `KEY=value` lines)
- `$CLAUDE_CODE_REMOTE` - `"true"` when running in remote/web environments
