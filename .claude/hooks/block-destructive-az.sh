#!/bin/bash
# Hook: Block destructive az CLI commands — only read-only operations allowed
# Source: TB CLAUDE.md → "NUNCA usar az CLI para crear, modificar o eliminar recursos"

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Check if command uses az CLI
if echo "$COMMAND" | grep -qE '\baz\s+'; then
    # Block destructive verbs
    if echo "$COMMAND" | grep -qE '\b(create|delete|update|start|stop|restart|purge|remove|set)\b'; then
        echo "Blocked: Destructive az CLI commands are not allowed. Only read-only operations (list, show, get) are permitted. All changes must go through Terraform and ADO pipelines." >&2
        exit 2
    fi
fi

exit 0
