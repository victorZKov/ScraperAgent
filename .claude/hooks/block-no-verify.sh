#!/bin/bash
# Hook: Block --no-verify on git commands — never skip git hooks
# Source: Safety guardrail — never bypass pre-commit hooks

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE '\bgit\b.*--no-verify'; then
    echo "Blocked: --no-verify is not allowed. Never skip git hooks. Fix the underlying issue instead." >&2
    exit 2
fi

exit 0
