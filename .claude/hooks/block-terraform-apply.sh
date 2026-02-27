#!/bin/bash
# Hook: Block terraform apply — deployments go through CR + ADO pipelines
# Source: TB CLAUDE.md → "NUNCA ejecutar terraform apply"

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE '\bterraform\s+apply\b'; then
    echo "Blocked: terraform apply is not allowed. All deployments must go through Change Request (CR) and ADO pipelines. Use 'terraform plan' for validation only." >&2
    exit 2
fi

exit 0
