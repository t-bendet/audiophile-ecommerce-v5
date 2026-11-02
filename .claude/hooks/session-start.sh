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

# The image preinstalls one Chromium build under PLAYWRIGHT_BROWSERS_PATH and the proxy blocks the
# Playwright CDN, so a newer @playwright/test pin cannot download the revision it wants. Alias the
# installed build under that revision; CI still downloads the real one.
alias_playwright_browsers() {
  local browsers_path="${PLAYWRIGHT_BROWSERS_PATH:-}"
  if [ -z "$browsers_path" ] || [ ! -w "$browsers_path" ]; then
    echo "playwright: PLAYWRIGHT_BROWSERS_PATH is unset or not writable; no browser aliases created" >&2
    return 0
  fi

  local wanted
  wanted=$(node -e '
    const path = require("path");
    const dirOf = (id, from) => path.dirname(require.resolve(id + "/package.json", { paths: [from] }));
    const test = dirOf("@playwright/test", path.resolve("apps/e2e"));
    const core = dirOf("playwright-core", dirOf("playwright", test));
    const { browsers } = require(path.join(core, "browsers.json"));
    for (const { name, revision } of browsers) {
      if (["chromium", "chromium-headless-shell", "ffmpeg"].includes(name)) {
        console.log(name.replace(/-/g, "_"), revision);
      }
    }
  ' 2>/dev/null) || {
    echo "playwright: could not read browsers.json through apps/e2e; no browser aliases created" >&2
    return 0
  }

  local name revision alias installed candidate
  while read -r name revision; do
    alias="$browsers_path/$name-$revision"
    [ -e "$alias" ] && continue
    installed=()
    for candidate in "$browsers_path/$name"-*; do
      [ -d "$candidate" ] && [ ! -L "$candidate" ] && installed+=("$candidate")
    done
    if [ "${#installed[@]}" -ne 1 ]; then
      echo "playwright: ${#installed[@]} installed builds of $name; cannot alias $name-$revision" >&2
      continue
    fi
    ln -sfn "${installed[0]}" "$alias"
    echo "playwright: $alias -> ${installed[0]}"
  done <<< "$wanted"
}

start_docker_daemon
install_when_inputs_changed
alias_playwright_browsers

# Workspace packages publish types from dist/, so consumers type-check only after a build.
# Turbo caches by inputs; a repeat run is a cache hit.
pnpm turbo run build --filter=@repo/domain
