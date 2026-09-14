#!/usr/bin/env bash
# Two ways the runtime goes quietly wrong: a misspelt setup-node input is only a
# warning, leaving the runner's own Node in place; and the Dockerfile can name a
# different major from .nvmrc, so we test on one and ship on another.
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

image=$(sed -n 's/^FROM node:\([0-9][0-9]*\).*/\1/p' apps/server/Dockerfile | head -1)

if [[ -z $image ]]; then
  echo "::error::No 'FROM node:<major>' found in apps/server/Dockerfile."
  exit 1
fi

if [[ $image != "$want" ]]; then
  echo "::error::apps/server/Dockerfile builds on Node $image, but .nvmrc asks for $want. Bump them together."
  exit 1
fi

echo "Node $have matches .nvmrc ($want), and so does apps/server/Dockerfile"
