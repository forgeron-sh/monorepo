#!/usr/bin/env bash
# For every tool of a repository (a folder with a forgeron.config.ts), installs its dependencies, then
# runs `forgeron test`, `forgeron change check` and `forgeron deploy`, in that order (docs/sdk.md §15,
# D-004, D-123).
# Usage: run.sh [root]
#   FORGERON_CMD      the command line of the CLI (default: npx forgeron@<the version of this action>)
#   FORGERON_ARGS     extra arguments for `forgeron deploy`, such as --allow-destructive
#   FORGERON_TOKEN    deployment token. Without it, GitHub Actions' identity is used when the workflow
#                     has `id-token: write` (ACTIONS_ID_TOKEN_REQUEST_URL); with neither (a pull
#                     request from a fork), nothing is deployed
#   FORGERON_INSTALL  "false" skips installing the dependencies (bun if bun.lock, else npm)
#   FORGERON_CLOSE    "true": instead, close the preview of the branch (`forgeron preview close`), for
#                     every tool; nothing is installed, tested or deployed
#   GITHUB_OUTPUT     when set, `urls` gets one "<tool> <address>" line per deployed tool
set -euo pipefail

root="${1:-.}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# The CLI of the release this action belongs to: the action is read from a tag of the Forgeron
# repository, whose CLI package says the version (D-122).
command="${FORGERON_CMD:-}"
if [ -z "$command" ]; then
  version="$(sed -nE 's/^ *"version": *"([^"]+)".*/\1/p' "$here/../../../apps/cli/package.json" 2>/dev/null | head -n 1 || true)"
  command="npx --yes forgeron${version:+@$version}"
fi
read -r -a forgeron <<<"$command"
read -r -a extra <<<"${FORGERON_ARGS:-}"

can_deploy() { [ -n "${FORGERON_TOKEN:-}" ] || [ -n "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ]; }
NO_CREDENTIAL="FORGERON_TOKEN is not set and the workflow has no id-token: write"

has_lock() { [ -f "$1/bun.lock" ] || [ -f "$1/bun.lockb" ] || [ -f "$1/package-lock.json" ]; }

# The tool's own dependencies (its SDK, its test runner), as its lock file says.
install() {
  local dir="$1"
  [ "${FORGERON_INSTALL:-true}" = "false" ] && return 0
  [ -f "$dir/package.json" ] || return 0
  echo "Installing the dependencies of $dir"
  (
    cd "$dir"
    if [ -f bun.lock ] || [ -f bun.lockb ]; then
      if command -v bun >/dev/null 2>&1; then bun install --frozen-lockfile; else npx --yes bun install --frozen-lockfile; fi
    elif [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
  )
}

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

if [ "${FORGERON_CLOSE:-}" != "true" ]; then
  # Once at the root (a marketplace's workspaces, or a tool alone in its repository), then in a tool's
  # folder that has dependencies of its own.
  install "$root"
  for dir in "${tools[@]}"; do
    [ "$(cd "$dir" && pwd)" = "$(cd "$root" && pwd)" ] && continue
    if has_lock "$dir" || [ ! -f "$root/package.json" ]; then install "$dir"; fi
  done
fi

for dir in "${tools[@]}"; do
  echo "::group::$dir"
  (
    cd "$dir"
    if [ "${FORGERON_CLOSE:-}" = "true" ]; then
      if can_deploy; then
        "${forgeron[@]}" preview close
      else
        echo "::notice::$NO_CREDENTIAL: the preview of $dir was not closed."
      fi
      exit 0
    fi
    "${forgeron[@]}" test
    "${forgeron[@]}" change check
    if can_deploy; then
      # `Deployed <tool>@<version> to <branch>: <address>`: the address goes to the action's output.
      # A build goes to its branch's temporary channel; a release reaches the permanent channels that
      # follow the branch (D-125).
      out="$(mktemp)"
      "${forgeron[@]}" deploy ${extra[@]+"${extra[@]}"} | tee "$out"
      sed -nE 's/^Deployed ([^@ ]+)@[^ ]+ to [^ :]+: (https?:\/\/[^ ]+)$/\1 \2/p' "$out" >>"$deployed"
      rm -f "$out"
    else
      echo "::notice::$NO_CREDENTIAL: $dir was tested and checked, not deployed."
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
