#!/bin/sh
# Pre-push gate: the full check, one at a time, skipped when the push only touches documentation.
set -eu
base=$(git merge-base origin/main HEAD 2>/dev/null || true)
if [ -n "$base" ]; then
  other=$(git diff --name-only "$base" HEAD | grep -v -E '^docs/|\.md$' || true)
  if [ -z "$other" ]; then
    echo "pre-push: documentation only, full check skipped (CI still runs it)."
    exit 0
  fi
fi
exec sh scripts/with-check-lock.sh bun run check
