#!/bin/sh
# Runs a command while holding a machine-wide lock, so only one full check runs at a time
# (parallel worktrees each running the whole suite exhausted memory). Waits for the lock.
set -eu
lock="${TMPDIR:-/tmp}/forgeron-check.lock"
waited=0
while ! mkdir "$lock" 2>/dev/null; do
  holder=$(cat "$lock/pid" 2>/dev/null || true)
  if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
    rm -rf "$lock"
    continue
  fi
  if [ "$waited" -eq 0 ]; then echo "check: another run holds the lock (pid ${holder:-?}), waiting..."; fi
  waited=1
  sleep 5
done
echo $$ >"$lock/pid"
trap 'rm -rf "$lock"' EXIT INT TERM
"$@"
