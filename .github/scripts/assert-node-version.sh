#!/usr/bin/env bash
# A misspelt setup-node input is only a warning, and the step then silently leaves
# the runner's own Node in place - this is what turns that into a failed job.
set -euo pipefail

want=$(cut -d. -f1 <.nvmrc | tr -cd '0-9')
have=$(node -p 'process.versions.node')

if [[ -z $want ]]; then
  echo "::error::.nvmrc does not name a numeric major: $(cat .nvmrc)"
  exit 1
fi

if [[ ${have%%.*} != "$want" ]]; then
  echo "::error::Node $have is running, but .nvmrc asks for $want. Check the actions/setup-node inputs."
  exit 1
fi

echo "Node $have matches .nvmrc ($want)"
