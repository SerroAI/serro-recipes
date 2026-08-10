#!/usr/bin/env bash
#
# Fail the run if the working tree diverged from the snapshot capture-diff.sh
# took. This is what makes "read-only" an assertion the workflow enforces rather
# than an instruction the prompt hopes the agent followed.
set -uo pipefail

BASE="${1:?usage: assert-diff-unchanged.sh <snapshot-file>}"

if [ ! -f "$BASE" ]; then
  echo "READ-ONLY ASSERTION: no snapshot at $BASE, so nothing can be proven." >&2
  exit 1
fi

NOW="$(mktemp)"
trap 'rm -f "$NOW"' EXIT

# Re-capture with the same script so the two snapshots are directly comparable.
bash "$(dirname "$0")/capture-diff.sh" "$NOW" >/dev/null

if diff -q "$BASE" "$NOW" >/dev/null 2>&1; then
  echo "unchanged — checkout is identical to the starting snapshot"
  exit 0
fi

echo "READ-ONLY ASSERTION FAILED: the checkout changed during the audit." >&2
echo "--- starting state vs. now ---" >&2
diff "$BASE" "$NOW" >&2
exit 1
