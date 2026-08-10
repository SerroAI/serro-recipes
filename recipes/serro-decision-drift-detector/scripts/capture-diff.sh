#!/usr/bin/env bash
#
# Snapshot the working tree so assert-diff-unchanged.sh can prove this run
# changed nothing.
#
# Records `git status --porcelain` alongside the diff on purpose: `git diff`
# alone ignores untracked files, so an agent that CREATED a file would sail
# through an unchanged-diff check. $ARTIFACTS_DIR is external to the checkout,
# so the snapshot never appears in the status it is recording.
set -uo pipefail

OUT="${1:?usage: capture-diff.sh <output-file>}"
mkdir -p "$(dirname "$OUT")"

{
  echo "# status"
  git status --porcelain
  echo "# diff"
  # `git diff HEAD` covers staged and unstaged; it fails in a repo with no
  # commits yet, where plain `git diff` is the best available baseline.
  git diff HEAD 2>/dev/null || git diff
} >"$OUT"

echo "captured $(wc -l <"$OUT" | tr -d ' ') line(s) to $OUT"
