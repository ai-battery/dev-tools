#!/bin/bash

# React Development Plugin - TypeScript Linter
# This script lints TypeScript/JavaScript files using ESLint

set -e

# Get the file path from the argument
FILE_PATH="$1"

# Check if file was provided
if [ -z "$FILE_PATH" ]; then
  echo "ERROR: No file path provided"
  exit 1
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
  echo "ERROR: File does not exist: $FILE_PATH"
  exit 1
fi

# Check if eslint is available
if ! command -v eslint >/dev/null 2>&1; then
  echo "ERROR: ESLint is not installed. Run the plugin setup script or install with 'npm install --global eslint'."
  exit 1
fi

# Get file extension
EXTENSION="${FILE_PATH##*.}"

# Only lint TypeScript and JavaScript files
case "$EXTENSION" in
  ts|tsx|js|jsx|mjs|cjs)
    eslint "$FILE_PATH" --fix
    echo "✓ Linted: $FILE_PATH"
    ;;
  *)
    # Skip non-JS/TS files silently
    exit 0
    ;;
esac
