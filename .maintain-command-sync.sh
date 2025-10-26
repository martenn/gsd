#!/bin/bash
# Script to keep .claude/commands/ and .cursor/commands/ in sync
# Both directories serve different tools:
# - .claude/commands/ : Claude Code (this IDE)
# - .cursor/commands/ : Cursor IDE

SOURCE_DIR=".claude/commands"
TARGET_DIR=".cursor/commands"

echo "Syncing commands between $SOURCE_DIR and $TARGET_DIR..."

# Copy all .md files from .claude/commands to .cursor/commands
cp -v "$SOURCE_DIR"/*.md "$TARGET_DIR"/ 2>/dev/null

# Copy all .md files from .cursor/commands to .claude/commands
cp -v "$TARGET_DIR"/*.md "$SOURCE_DIR"/ 2>/dev/null

echo "✓ Command directories are now in sync"
