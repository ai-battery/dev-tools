#!/bin/bash

# React Development Plugin - Uninstall Script
# This script removes the plugin's dependencies and configuration files

set -e

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNINSTALL_LOG="${PLUGIN_ROOT}/.uninstall.log"

echo "React Development Plugin - Uninstall" | tee -a "$UNINSTALL_LOG"
echo "====================================" | tee -a "$UNINSTALL_LOG"
echo "" | tee -a "$UNINSTALL_LOG"

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to log messages
log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$UNINSTALL_LOG"
}

# Function to safely uninstall global npm package
uninstall_package() {
  local package=$1
  if command_exists "$package"; then
    log_message "Uninstalling $package..."
    npm uninstall --global "$package" 2>/dev/null || log_message "⚠ Could not uninstall $package (may not be installed)"
  else
    log_message "✓ $package is not installed"
  fi
}

log_message "Starting uninstall process..."
echo "" | tee -a "$UNINSTALL_LOG"

# Uninstall global packages
log_message "Removing global npm packages..."
uninstall_package "prettier"
uninstall_package "typescript"
uninstall_package "typescript-language-server"
uninstall_package "eslint"
uninstall_package "@typescript-eslint/parser"
uninstall_package "@typescript-eslint/eslint-plugin"
uninstall_package "eslint-config-prettier"

echo "" | tee -a "$UNINSTALL_LOG"
log_message "Removing plugin configuration files..."

# Remove ESLint configuration
ESLINT_CONFIG="${PLUGIN_ROOT}/.eslintrc.json"
if [ -f "$ESLINT_CONFIG" ]; then
  log_message "Removing .eslintrc.json..."
  rm -f "$ESLINT_CONFIG"
  log_message "✓ Removed .eslintrc.json"
else
  log_message "✓ .eslintrc.json not found"
fi

# Remove ESLint ignore file
ESLINT_IGNORE="${PLUGIN_ROOT}/.eslintignore"
if [ -f "$ESLINT_IGNORE" ]; then
  log_message "Removing .eslintignore..."
  rm -f "$ESLINT_IGNORE"
  log_message "✓ Removed .eslintignore"
else
  log_message "✓ .eslintignore not found"
fi

# Remove setup log
SETUP_LOG="${PLUGIN_ROOT}/.setup.log"
if [ -f "$SETUP_LOG" ]; then
  log_message "Removing .setup.log..."
  rm -f "$SETUP_LOG"
  log_message "✓ Removed .setup.log"
else
  log_message "✓ .setup.log not found"
fi

echo "" | tee -a "$UNINSTALL_LOG"
log_message "Uninstall complete!"
log_message "Uninstall log saved to: $UNINSTALL_LOG"
