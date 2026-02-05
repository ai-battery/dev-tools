# Setup Environment Plugin

A Claude Code plugin for safe, observable environment setup and session lifecycle logging.

## What It Does

- Blocks risky operations like destructive `rm -rf` and `.env` access via plugin hooks
- Logs tool usage to `logs/*.json` for auditability
- Provides optional native hooks for session lifecycle, notifications, and knowledge sync

## Structure

- `./.claude-plugin/plugin.json` - plugin manifest
- `./hooks.json` - plugin hook wiring (PreToolUse, PostToolUse, PostToolUseFailure only)
- `./hooks/` - hook scripts
- `./hooks/_shared.py` - shared JSON + logging helpers
- `./hooks/_security.py` - safety checks for tool use
- `./hooks/tests/` - lightweight unit tests

## Installation

Use Claude Code's plugin installation flow:

```bash
claude plugin install
```

## Plugin Hooks (Automatic)

These hooks are automatically active when the plugin is installed:

| Hook | Purpose |
|------|---------|
| `PreToolUse` | Safety guardrails for `.env` and destructive `rm` commands |
| `PostToolUse` | Audit successful tool usage |
| `PostToolUseFailure` | Log tool failures with error details |

## Native Hooks (Optional)

The following hooks require manual configuration in your Claude Code settings. Add them to `~/.claude/settings.json` or `~/.claude/settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "/path/to/dev-tools/setup-environment/hooks/session_start.py --load-context"
      }
    ],
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "/path/to/dev-tools/setup-environment/hooks/user_prompt_submit.py --store-last-prompt"
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "/path/to/dev-tools/setup-environment/hooks/stop.py"
      }
    ],
    "PreCompact": [
      {
        "type": "command",
        "command": "/path/to/dev-tools/setup-environment/hooks/pre_compact.py --backup"
      }
    ],
    "Notification": [
      {
        "type": "command",
        "command": "/path/to/dev-tools/setup-environment/hooks/notification.py"
      }
    ]
  }
}
```

Replace `/path/to/dev-tools` with the actual path to your dev-tools directory.

### Native Hook Descriptions

| Hook | Purpose |
|------|---------|
| `SessionStart` | Load development context (git status, TODO files) at session start |
| `UserPromptSubmit` | Log user prompts and manage session data |
| `Stop` | Log session stop events, optional TTS notifications |
| `PreCompact` | Backup transcripts before context compaction |
| `Notification` | Log notifications when agent needs user input |

### Knowledge Synchronization (Advanced)

For automatic knowledge sync on `PreCompact` and `Stop` events, you can add agent-type hooks that update your project documentation. See the hook scripts for the full agent prompt configuration.

## Configuration

These environment variables are optional and unlock extra features:

- `OPENAI_API_KEY` - use OpenAI for TTS or completion messages
- `ANTHROPIC_API_KEY` - use Anthropic for completion messages
- `ELEVENLABS_API_KEY` - use ElevenLabs TTS
- `ENGINEER_NAME` - personalize notification prompts

## Logs

All hook logs are written to `logs/*.json` in the current working directory.
Each log is a JSON array of hook event payloads.

## Tests

Run basic safety tests:

```bash
python -m unittest discover -s hooks/tests -p "test_*.py"
```

## Version

0.0.2

## Author

Hans Eilers
