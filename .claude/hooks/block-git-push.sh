#!/bin/bash
# Hook: Block git push — user must push manually or give explicit permission
# Source: CLAUDE.md → "NUNCA hacer git push sin preguntar ANTES al usuario"

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE '\bgit\s+push\b'; then
    echo "Blocked: git push is not allowed via hooks. The user must push manually or explicitly approve the push." >&2
    exit 2
fi

exit 0
