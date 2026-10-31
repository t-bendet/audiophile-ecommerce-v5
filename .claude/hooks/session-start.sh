#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"
hashes=node_modules/.session-start.sha256
inputs=(.claude/hooks/session-start.sh pnpm-lock.yaml packages/database/prisma/schema/*.prisma)

if sha256sum --check --status "$hashes" 2>/dev/null; then
  exit 0
fi

# A stale hash file would skip the retry after a failed install, so drop it first.
rm -f "$hashes"
pnpm install --frozen-lockfile
pnpm db:generate
sha256sum "${inputs[@]}" > "$hashes"
