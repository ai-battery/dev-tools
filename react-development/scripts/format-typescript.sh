#!/bin/bash

# React Development Plugin - TypeScript Formatter
# This script formats TypeScript/JavaScript files using Prettier

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

# Check if prettier is available
if ! command -v prettier >/dev/null 2>&1; then
  echo "ERROR: Prettier is not installed. Run 'npm install --global prettier' or execute the setup script."
  exit 1
fi

# Format the file with prettier
# Check file extension to apply appropriate parser
EXTENSION="${FILE_PATH##*.}"

case "$EXTENSION" in
  ts|tsx)
    prettier --write --parser typescript "$FILE_PATH"
    ;;
  js|jsx|mjs|cjs)
    prettier --write --parser babel "$FILE_PATH"
    ;;
  json)
    prettier --write --parser json "$FILE_PATH"
    ;;
  *)
    # Default to typescript parser for unknown extensions
    prettier --write --parser typescript "$FILE_PATH"
    ;;
esac

echo "✓ Formatted: $FILE_PATH"
