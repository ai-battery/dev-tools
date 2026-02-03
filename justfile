# Install and Maintain
set dotenv-load := true

# List all recipes
default:
  @just --list

# Install and run frontend
fe:
  cd apps/frontend && npm install && npm run dev

# Install and run backend
be:
  cd apps/backend && uv sync && uv run uvicorn main:app --

# Reset artifacts
reset:
  rm -rf apps/backend/.venv
  rm -rf apps/backend/starter.db
  rm -rf apps/frontend/node_modules
  rm -rf .claude/hooks/*.log
  rm -rf app_docs/install_results.md
  rm -rf app_docs/maintenance_results.md

# Deterministic codebase setup
cldi:
  claude --model opus --dangerously-skip-permissions --init

# Deterministic codebase maintenance
cldm:
  claude --model opus --dangerously-skip-permissions --maintenance

# Agentic codebase setup
cldii:
  claude --model opus --dangerously-skip-permissions --init "/install"

# Agentic codebase setup interactive
cldit:
  claude --model opus --dangerously-skip-permissions --init "/install true"

# Agentic codebase maintenance
cldmm:
  claude --model opus --dangerously-skip-permissions --maintenance "/maintenance"
