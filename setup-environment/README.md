# Setup Environment Plugin

A Claude Code plugin for safe, observable environment setup and session lifecycle logging.

## What It Does

- Adds a full suite of lifecycle hooks (setup, session start/end, tool use, stop).
- Logs hook events to `logs/*.json` for auditability.
- Blocks risky operations like destructive `rm -rf` and `.env` access.
- Supports optional TTS notifications and LLM-powered summaries when configured.

## Structure

- `./.claude-plugin/plugin.json` - plugin manifest
- `./hooks.json` - hook wiring for Claude Code
- `./hooks/` - hook scripts
- `./hooks/_shared.py` - shared JSON + logging helpers
- `./hooks/_security.py` - safety checks for tool use
- `./hooks/tests/` - lightweight unit tests

## Installation

Use Claude Code's plugin installation flow:

```bash
claude plugin install
```

## Hook Behavior

Key hooks and their intent:

- `Setup` - repository context and optional dependency setup
- `SessionStart` - capture git status and contextual files
- `SessionEnd` - cleanup and session-end logging
- `UserPromptSubmit` - prompt logging and optional naming
- `PreToolUse` - safety guardrails for `.env` and destructive `rm`
- `PostToolUse` and `PostToolUseFailure` - audit tool usage and errors
- `Notification` and `Stop` - optional TTS notifications
- `SubAgentStart` and `SubAgentStop` - log subagent activity (optional TTS)
- `PreCompact` - backup transcripts before compaction

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

0.0.1

## Author

Hans Eilers
