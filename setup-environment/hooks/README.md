# Agent Browser Integration for Meta-Agent

This directory contains hooks and utilities for ensuring agent-browser is available for your Claude Code agents.

## Overview

The `ensure-agent-browser.py` hook checks if agent-browser is installed and installs it automatically if needed. This ensures all team members can use agents that rely on browser automation without manual setup.

## Files

- **ensure-agent-browser.py** - Pre-execution hook that checks for and installs agent-browser

## How It Works

1. The meta-agent calls the hook script at startup
2. The script checks if `agent-browser` command is available
3. If not found:
   - Installs agent-browser globally via npm
   - Downloads Chromium browser
   - Verifies the installation
4. If already installed, confirms it's working

## Usage in Agents

### In the meta-agent

The meta-agent now automatically runs the hook on startup:

```bash
python3 .claude/hooks/ensure-agent-browser.py
```

### Using agent-browser in your agents

Once agent-browser is installed, your agents can use it via the Bash tool:

```bash
# Navigate to a URL and capture content
agent-browser open https://example.com --output json

# Click elements
agent-browser click "button.submit"

# Extract content
agent-browser dump --format markdown

# Take screenshots
agent-browser screenshot --path ./output.png

# Get accessibility tree (optimized for AI)
agent-browser snapshot --format json
```

### Common agent-browser commands:

- **Navigation**: `open <url>`, `back`, `forward`, `reload`
- **Interaction**: `click <selector>`, `type <selector> <text>`, `fill <selector> <text>`
- **Data extraction**: `dump`, `snapshot`, `screenshot`
- **Evaluation**: `eval <js>` - Run JavaScript in the page context

## Requirements

- **Node.js and npm** must be installed on the system
- **~170MB disk space** for Chromium browser
- On Linux: may need additional system dependencies

## Troubleshooting

If agent-browser fails to install:

1. **Check npm is installed**: `npm --version`
2. **Check permissions**: May need sudo for global npm installs
3. **Manual installation**:
   ```bash
   npm install -g agent-browser
   agent-browser install
   ```
4. **Linux systems**: May need to install dependencies:
   ```bash
   agent-browser install --with-deps
   ```

## When to Use agent-browser vs WebFetch

**Use WebFetch for:**
- Simple static HTML pages
- Documentation sites
- REST API documentation
- Lightweight scraping

**Use agent-browser for:**
- JavaScript-heavy applications
- Single Page Applications (SPAs)
- Sites requiring interaction (clicking, scrolling)
- Dynamic content that loads after page load
- Sites with complex authentication flows
- When you need screenshots or PDFs

## Integration Example

Here's how an agent might use both tools:

```markdown
---
name: web-researcher
description: Research and extract information from web sources
tools: Bash, WebFetch, Read, Write
---

# Purpose
Research topics by scraping and analyzing web content.

## Instructions

1. **Ensure agent-browser is available**:
   ```bash
   python3 .claude/hooks/ensure-agent-browser.py
   ```

2. **For simple pages, use WebFetch**:
   ```
   WebFetch tool with URL and prompt
   ```

3. **For complex pages, use agent-browser**:
   ```bash
   agent-browser open <url> --output json
   agent-browser snapshot --format json > content.json
   ```

4. **Process and analyze the content**
5. **Generate report**
```

## References

- [agent-browser GitHub](https://github.com/vercel-labs/agent-browser)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
