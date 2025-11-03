#!/bin/bash
# Script to update the "Last Updated" date in project-tracker.md
# 
# Options:
#   - Use git commit date (most accurate): ./scripts/update-tracker-date.sh --git
#   - Use current system date: ./scripts/update-tracker-date.sh (default)
#
# Usage: ./scripts/update-tracker-date.sh [--git]

TRACKER_FILE=".ai/project-tracker.md"

if [ ! -f "$TRACKER_FILE" ]; then
  echo "Error: $TRACKER_FILE not found"
  exit 1
fi

# Determine which date to use
if [ "$1" == "--git" ]; then
  # Use git commit date (most accurate - when file was last committed)
  DATE=$(git log -1 --format="%ai" --date=short "$TRACKER_FILE" 2>/dev/null | cut -d' ' -f1)
  if [ -z "$DATE" ]; then
    echo "Warning: Could not get git date, falling back to today's date"
    DATE=$(date +%Y-%m-%d)
  fi
  echo "Using git commit date: $DATE"
else
  # Use today's date
  DATE=$(date +%Y-%m-%d)
  echo "Using today's date: $DATE"
fi

# Update the Last Updated line using sed (works on macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS version
  sed -i '' "s/\*\*Last Updated:\*\* [0-9-]*/\*\*Last Updated:\*\* $DATE/" "$TRACKER_FILE"
else
  # Linux version
  sed -i "s/\*\*Last Updated:\*\* [0-9-]*/\*\*Last Updated:\*\* $DATE/" "$TRACKER_FILE"
fi

echo "✓ Updated Last Updated date to $DATE in $TRACKER_FILE"

