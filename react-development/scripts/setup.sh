#!/bin/bash

# React Development Plugin Setup Script
# This script verifies and installs required dependencies for the plugin
# Includes unified quality checker based on bartolli/claude-code-typescript-hooks

set -e

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SETUP_LOG="${PLUGIN_ROOT}/.setup.log"

echo "React Development Plugin - Setup" | tee -a "$SETUP_LOG"
echo "================================" | tee -a "$SETUP_LOG"
echo "" | tee -a "$SETUP_LOG"

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to log messages
log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$SETUP_LOG"
}

# Check for Node.js
log_message "Checking for Node.js..."
if ! command_exists node; then
  log_message "ERROR: Node.js is not installed. Please install Node.js (v18+) from https://nodejs.org"
  exit 1
fi
NODE_VERSION=$(node --version)
log_message "✓ Node.js found: $NODE_VERSION"

# Verify Node.js version is 18+
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  log_message "WARNING: Node.js v18+ recommended. You have $NODE_VERSION"
fi

# Check for npm
log_message "Checking for npm..."
if ! command_exists npm; then
  log_message "ERROR: npm is not installed. Please install npm as part of Node.js"
  exit 1
fi
log_message "✓ npm found: $(npm --version)"

echo "" | tee -a "$SETUP_LOG"

# Make quality-check.js executable
log_message "Setting up quality check script..."
QUALITY_CHECK="${PLUGIN_ROOT}/scripts/quality-check.js"
if [ -f "$QUALITY_CHECK" ]; then
  chmod +x "$QUALITY_CHECK"
  log_message "✓ Quality check script configured"
else
  log_message "WARNING: quality-check.js not found at $QUALITY_CHECK"
fi

# Check and install Prettier (global fallback)
log_message "Checking for Prettier..."
if command_exists prettier; then
  PRETTIER_VERSION=$(prettier --version)
  log_message "✓ Prettier is already installed: $PRETTIER_VERSION"
else
  log_message "Installing Prettier (global fallback)..."
  npm install --global prettier@latest
  log_message "✓ Prettier installed: $(prettier --version)"
fi

# Check and install TypeScript (global fallback)
log_message "Checking for TypeScript..."
if command_exists tsc; then
  TS_VERSION=$(tsc --version)
  log_message "✓ TypeScript is already installed: $TS_VERSION"
else
  log_message "Installing TypeScript (global fallback)..."
  npm install --global typescript@latest
  log_message "✓ TypeScript installed: $(tsc --version)"
fi

# Check and install ESLint (global fallback)
log_message "Checking for ESLint..."
if command_exists eslint; then
  ESLINT_VERSION=$(eslint --version)
  log_message "✓ ESLint is already installed: $ESLINT_VERSION"
else
  log_message "Installing ESLint and related packages (global fallback)..."
  npm install --global eslint@latest @typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest eslint-config-prettier@latest
  log_message "✓ ESLint installed: $(eslint --version)"
fi

# Run ESLint setup to create configuration files
log_message "Configuring ESLint..."
ESLINT_SETUP_SCRIPT="${PLUGIN_ROOT}/scripts/eslint-setup.sh"
if [ -f "$ESLINT_SETUP_SCRIPT" ]; then
  bash "$ESLINT_SETUP_SCRIPT"
else
  log_message "WARNING: ESLint setup script not found at $ESLINT_SETUP_SCRIPT"
fi

echo "" | tee -a "$SETUP_LOG"
log_message "Setup complete! All dependencies are ready."
log_message ""
log_message "Quality checker features:"
log_message "  • TypeScript compilation checking"
log_message "  • ESLint with auto-fix"
log_message "  • Prettier with auto-fix"
log_message "  • React pattern detection"
log_message "  • Custom issue detection (as any, debugger, etc.)"
log_message ""
log_message "Configure via: ${PLUGIN_ROOT}/config/hook-config.json"
log_message "Setup log saved to: $SETUP_LOG"
