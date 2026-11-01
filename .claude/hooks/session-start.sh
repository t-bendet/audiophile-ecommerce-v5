#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# The environment snapshot keeps the pulled mongo image but no running daemon.
start_docker_daemon() {
  docker info > /dev/null 2>&1 && return 0
  setsid nohup dockerd > /tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do
    docker info > /dev/null 2>&1 && return 0
    sleep 1
  done
  echo "dockerd did not start within 30s; see /tmp/dockerd.log" >&2
  return 0
}

install_when_inputs_changed() {
  local hashes=node_modules/.session-start.sha256
  local inputs=(.claude/hooks/session-start.sh pnpm-lock.yaml packages/database/prisma/schema/*.prisma)
  sha256sum --check --status "$hashes" 2>/dev/null && return 0
  # A stale hash file would skip the retry after a failed install, so drop it first.
  rm -f "$hashes"
  pnpm install --frozen-lockfile
  pnpm db:generate
  sha256sum "${inputs[@]}" > "$hashes"
}

start_docker_daemon
install_when_inputs_changed
