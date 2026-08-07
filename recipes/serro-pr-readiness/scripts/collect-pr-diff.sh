#!/usr/bin/env bash
# Collect the change under review into the run's artifacts directory.
#
# Resolution order:
#   1. A PR number found in $ARGUMENTS, fetched with `gh`
#   2. The current branch diffed against the remote default branch
#   3. The uncommitted working diff
#
# Writes: $ARTIFACTS_DIR/pr-diff.txt, $ARTIFACTS_DIR/pr-meta.txt
# Exit 1 when there is no change to review at all — a workflow that reviews an
# empty diff wastes a run and reports a false all-clear.
set -uo pipefail

OUT="${ARTIFACTS_DIR:-.}/pr-diff.txt"
META="${ARTIFACTS_DIR:-.}/pr-meta.txt"

PR_NUMBER=$(printf '%s' "${ARGUMENTS:-}" \
  | grep -oE '(^|[^0-9])[0-9]{1,7}([^0-9]|$)' \
  | grep -oE '[0-9]{1,7}' | head -1)

if [ -n "${PR_NUMBER:-}" ] && command -v gh >/dev/null 2>&1; then
  if gh pr view "$PR_NUMBER" \
      --json number,title,author,baseRefName,headRefName,url,body > "$META" 2>/dev/null; then
    gh pr diff "$PR_NUMBER" > "$OUT" 2>/dev/null || : > "$OUT"
  fi
fi

if [ ! -s "$OUT" ]; then
  BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
  BASE=${BASE:-main}
  git rev-parse --verify "origin/$BASE" >/dev/null 2>&1 || BASE=master

  if git rev-parse --verify "origin/$BASE" >/dev/null 2>&1; then
    git diff "origin/$BASE...HEAD" > "$OUT" 2>/dev/null || : > "$OUT"
  fi
  [ -s "$OUT" ] || git diff > "$OUT" 2>/dev/null || : > "$OUT"

  {
    echo "source=working-branch"
    echo "base=origin/$BASE"
    echo "head=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  } > "$META"
else
  { echo "source=pr"; echo "number=$PR_NUMBER"; } >> "$META"
fi

if [ ! -s "$OUT" ]; then
  echo "No change to review: no PR diff, no branch diff, no working diff." >&2
  exit 1
fi

echo "files_changed=$(grep -c '^diff --git' "$OUT" 2>/dev/null || echo 0)"
echo "diff_lines=$(wc -l < "$OUT" | tr -d ' ')"
echo "diff=$OUT"
echo "meta=$META"
