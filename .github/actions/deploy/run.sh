#!/usr/bin/env bash
# For every tool of a repository (a folder with a forgeron.config.ts), runs `forgeron test`,
# `forgeron change check` and `forgeron deploy`, in that order (docs/sdk.md §15, D-004).
# Usage: run.sh [root]
#   FORGERON_CMD     the command line of the CLI (default: npx forgeron)
#   FORGERON_ENV     environment to deploy to (default: preview)
#   FORGERON_ARGS    extra arguments for `forgeron deploy`, such as --allow-destructive
#   FORGERON_TOKEN   deployment token; without it (pull requests from forks) nothing is deployed
#   FORGERON_CLOSE   "true": instead, close the preview of the pull request's branch (`forgeron
#                    preview close`), for every tool; nothing is tested or deployed
#   GITHUB_OUTPUT    when set, `urls` gets one "<tool> <address>" line per deployed tool
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

deployed="$(mktemp)"
trap 'rm -f "$deployed"' EXIT

for dir in "${tools[@]}"; do
  echo "::group::$dir"
  (
    cd "$dir"
    if [ "${FORGERON_CLOSE:-}" = "true" ]; then
      if [ -n "${FORGERON_TOKEN:-}" ]; then
        "${forgeron[@]}" preview close
      else
        echo "::notice::FORGERON_TOKEN is not set: the preview of $dir was not closed."
      fi
      exit 0
    fi
    "${forgeron[@]}" test
    "${forgeron[@]}" change check
    if [ -n "${FORGERON_TOKEN:-}" ]; then
      # `Deployed <tool>@<version> to <env>: <address>`: the address goes to the action's output.
      out="$(mktemp)"
      "${forgeron[@]}" deploy --env "${FORGERON_ENV:-preview}" ${extra[@]+"${extra[@]}"} | tee "$out"
      sed -nE 's/^Deployed ([^@ ]+)@[^ ]+ to [^ :]+: (https?:\/\/[^ ]+)$/\1 \2/p' "$out" >>"$deployed"
      rm -f "$out"
    else
      echo "::notice::FORGERON_TOKEN is not set: $dir was tested and checked, not deployed."
    fi
  )
  echo "::endgroup::"
done

if [ -n "${GITHUB_OUTPUT:-}" ] && [ -s "$deployed" ]; then
  {
    echo "urls<<FORGERON_URLS_EOF"
    cat "$deployed"
    echo "FORGERON_URLS_EOF"
  } >>"$GITHUB_OUTPUT"
fi
