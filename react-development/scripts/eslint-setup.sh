#!/bin/bash

# React Development Plugin - ESLint Setup Script
# This script installs ESLint and creates a basic configuration

set -e

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ESLINT_CONFIG="${PLUGIN_ROOT}/.eslintrc.json"
ESLINT_IGNORE="${PLUGIN_ROOT}/.eslintignore"
SETUP_LOG="${PLUGIN_ROOT}/.setup.log"

# Function to log messages
log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$SETUP_LOG"
}

log_message "Setting up ESLint..."

# Check if eslint is available
if ! command -v eslint >/dev/null 2>&1; then
  log_message "ERROR: ESLint is not installed. Please run 'npm install --global eslint' first."
  exit 1
fi

# Create ESLint configuration if it doesn't exist
if [ ! -f "$ESLINT_CONFIG" ]; then
  log_message "Creating .eslintrc.json configuration..."
  cat > "$ESLINT_CONFIG" << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "env": {
    "es2020": true,
    "node": true,
    "browser": true
  }
}
EOF
  log_message "✓ Created .eslintrc.json"
else
  log_message "✓ .eslintrc.json already exists"
fi

# Create .eslintignore if it doesn't exist
if [ ! -f "$ESLINT_IGNORE" ]; then
  log_message "Creating .eslintignore..."
  cat > "$ESLINT_IGNORE" << 'EOF'
node_modules/
dist/
build/
.next/
coverage/
*.min.js
EOF
  log_message "✓ Created .eslintignore"
else
  log_message "✓ .eslintignore already exists"
fi

log_message "ESLint setup complete!"
