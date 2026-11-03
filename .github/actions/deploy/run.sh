#!/usr/bin/env bash
# For every tool of a repository (a folder with a forgeron.config.ts), runs `forgeron test`,
# `forgeron change check` and `forgeron deploy`, in that order (docs/sdk.md §15, D-004).
# Usage: run.sh [root]
#   FORGERON_CMD     the command line of the CLI (default: npx forgeron)
#   FORGERON_ENV     environment to deploy to (default: preview)
#   FORGERON_ARGS    extra arguments for `forgeron deploy`, such as --allow-destructive
#   FORGERON_TOKEN   deployment token; without it (pull requests from forks) nothing is deployed
set -euo pipefail

root="${1:-.}"
read -r -a forgeron <<<"${FORGERON_CMD:-npx forgeron}"
read -r -a extra <<<"${FORGERON_ARGS:-}"

tools=()
while IFS= read -r config; do
  tools+=("$(dirname "$config")")
done < <(find "$root" -name forgeron.config.ts -not -path '*/node_modules/*' -not -path '*/.forgeron/*' | sort)

if [ "${#tools[@]}" -eq 0 ]; then
  echo "No tool found under $root: a tool is a folder with a forgeron.config.ts." >&2
  exit 1
fi

for dir in "${tools[@]}"; do
  echo "::group::$dir"
  (
    cd "$dir"
    "${forgeron[@]}" test
    "${forgeron[@]}" change check
    if [ -n "${FORGERON_TOKEN:-}" ]; then
      "${forgeron[@]}" deploy --env "${FORGERON_ENV:-preview}" ${extra[@]+"${extra[@]}"}
    else
      echo "::notice::FORGERON_TOKEN is not set: $dir was tested and checked, not deployed."
    fi
  )
  echo "::endgroup::"
done
