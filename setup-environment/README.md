# Setup Environment Plugin

A Claude Code plugin for safe, observable environment setup, session lifecycle logging, and knowledge synchronization.

## What It Does

- Blocks risky operations like destructive `rm -rf` and `.env` access
- Logs tool usage and session events to `logs/*.json` for auditability
- Syncs conversation learnings to agent.md files and decisions.md on PreCompact and Stop events
- Provides TTS notifications (optional, requires API keys)

## Structure

```
setup-environment/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── hooks.json               # Hook configuration
├── hooks/                   # Hook scripts
│   ├── _shared.py           # Shared JSON + logging helpers
│   ├── _security.py         # Safety checks for tool use
│   ├── session_start.py     # Load development context
│   ├── session_end.py       # Cleanup and logging
│   ├── user_prompt_submit.py # Prompt logging
│   ├── pre_tool_use.py      # Security guardrails
│   ├── post_tool_use.py     # Tool audit logging
│   ├── post_tool_use_failure.py # Error logging
│   ├── permission_request.py # Permission audit
│   ├── notification.py      # TTS notifications
│   ├── pre_compact.py       # Transcript backup
│   ├── subagent_start.py    # Subagent spawn logging
│   ├── subagent_stop.py     # Subagent completion logging
│   ├── stop.py              # Session finalization
│   └── tests/               # Unit tests
└── skills/
    └── pr-review/           # PR review skill
        └── SKILL.md
```

## Installation

```bash
claude plugin install
```

Then select the setup-environment plugin from the list.

## Hooks

| Event | Purpose |
|-------|---------|
| `SessionStart` | Load development context (git status, TODO files) |
| `SessionEnd` | Cleanup and session-end logging |
| `UserPromptSubmit` | Log user prompts and manage session data |
| `PreToolUse` | Block dangerous rm -rf commands and .env file access |
| `PostToolUse` | Audit all tool usage |
| `PostToolUseFailure` | Log tool failures with error details |
| `PermissionRequest` | Log permission requests for auditing |
| `Notification` | TTS notifications when agent needs user input |
| `PreCompact` | Backup transcript, sync knowledge to documentation |
| `SubagentStart` | Log subagent spawn events |
| `SubagentStop` | Log subagent completion events |
| `Stop` | Finalize session, sync knowledge to documentation |

### Knowledge Synchronization

The `PreCompact` and `Stop` hooks include an agent-type hook that automatically:

1. **Updates agent.md files** - Analyzes conversation for new patterns, corrections, capabilities, or conventions to add to `.claude/agents/`

2. **Maintains decisions.md** - Creates/updates `.claude/decisions.md` with a decision log including timestamps, context, decisions, and rationale

## Skills

### pr-review

Expert code review skill for pull requests. Provides:
- GitHub CLI workflows for inline comments
- Severity classification ([blocking], [important], [suggestion], [nit], [question], [praise])
- Decision trees for approval vs request changes
- Complete review workflow with examples

Invoke with `/setup-environment:pr-review` or let Claude use it automatically when reviewing PRs.

## Configuration

Optional environment variables for extra features:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI TTS or completions |
| `ANTHROPIC_API_KEY` | Anthropic completions |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS |
| `ENGINEER_NAME` | Personalize notification prompts |

## Logs

All hook logs are written to `logs/*.json` in the current working directory. Each log is a JSON array of hook event payloads.

## Tests

```bash
python -m unittest discover -s hooks/tests -p "test_*.py"
```

## Version

0.0.2

## Author

Hans Eilers
