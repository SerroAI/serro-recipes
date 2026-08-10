#!/usr/bin/env bash
#
# Snapshot the working tree so assert-diff-unchanged.sh can prove this run
# changed nothing.
#
# Untracked files are diffed against /dev/null rather than merely listed, so a
# file the agent CREATED is captured by content and not just by name.
# $ARTIFACTS_DIR is external to the checkout, so the snapshot never turns up in
# the status it is recording.
set -euo pipefail

output="${1:-${ARTIFACTS_DIR}/starting-state.diff}"

# Archon substitutes BASE_BRANCH into bash nodes, but a recipe installed by a
# stranger should degrade rather than hard-fail under `set -u` if it is absent.
# Both captures in a run use the same baseline, so the comparison holds either way.
base="${BASE_BRANCH:-HEAD}"

{
  echo "# Git status"
  git status --short
  echo
  echo "# Tracked changes from ${base}"
  git diff "$base" -- .

  while IFS= read -r file; do
    echo
    echo "# Untracked file: $file"
    git diff --no-index -- /dev/null "$file" || true
  done < <(git ls-files --others --exclude-standard)
} >"$output"

wc -c "$output"
