#!/bin/bash
# Hook: Enforce pnpm — block npm usage
# Source: CLAUDE.md → "NEVER use npm — always use pnpm"

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Replace "pnpm" with placeholder to avoid false positives, then check for "npm"
SANITIZED=$(echo "$COMMAND" | sed 's/pnpm/__PNPM__/g')

if echo "$SANITIZED" | grep -qw "npm"; then
    echo "Blocked: Use pnpm instead of npm. This project requires pnpm for all frontend operations (install, run, build, test)." >&2
    exit 2
fi

exit 0
