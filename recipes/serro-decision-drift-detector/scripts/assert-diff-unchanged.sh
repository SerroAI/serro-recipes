#!/usr/bin/env bash
#
# Fail the run if the working tree diverged from the snapshot capture-diff.sh
# took. This is what makes "read-only" an assertion the workflow enforces rather
# than an instruction the prompt hopes the agent followed.
set -euo pipefail

expected="${1:-${ARTIFACTS_DIR}/starting-state.diff}"

if [[ ! -f "$expected" ]]; then
  echo "READ-ONLY ASSERTION: no snapshot at $expected, so nothing can be proven." >&2
  exit 1
fi

actual="$(mktemp)"
trap 'rm -f "$actual"' EXIT

# Re-capture with the sibling script so both snapshots are directly comparable.
# Resolved relative to this file rather than the cwd, so the assertion survives a
# node that runs from a subdirectory.
bash "$(dirname "$0")/capture-diff.sh" "$actual" >/dev/null

if ! cmp -s "$expected" "$actual"; then
  echo "READ-ONLY ASSERTION FAILED: the checkout changed during the audit." >&2
  echo "Current git status:" >&2
  git status --short >&2
  echo "Difference from the starting snapshot:" >&2
  diff -u "$expected" "$actual" >&2 || true
  exit 1
fi

echo "unchanged"
