#!/usr/bin/env bash
# Serro context guard.
#
# Deterministic gate between the context stage and every reasoning stage that
# follows it. Exits non-zero — failing the run — when Serro context is missing
# or the program did not resolve.
#
# This exists because the failure it catches is silent by nature: without it, a
# run with no Serro connection still completes, and emits a confident, generic
# answer that looks like a Serro answer. Better to fail with a fixable message.
#
# Reads:  $ARTIFACTS_DIR/serro-context.json  (written by the serro-context command)
# Exit 0: context present, program resolved
# Exit 1: anything else, with remediation on stderr
set -uo pipefail

CONTEXT_FILE="${ARTIFACTS_DIR:-.}/serro-context.json"

fail() {
  echo "SERRO CONTEXT GUARD: $1" >&2
  exit 1
}

[ -f "$CONTEXT_FILE" ] || fail "no context file at $CONTEXT_FILE — the context stage did not complete."

# Prefer jq when available; fall back to grep so the guard works on a bare box.
if command -v jq >/dev/null 2>&1; then
  jq -e . "$CONTEXT_FILE" >/dev/null 2>&1 || fail "context file is not valid JSON: $CONTEXT_FILE"
  AVAILABLE=$(jq -r '.serro_available // false' "$CONTEXT_FILE")
  PROGRAM_ID=$(jq -r '.program.id // empty' "$CONTEXT_FILE")
  PROGRAM_NAME=$(jq -r '.program.name // empty' "$CONTEXT_FILE")
  REASON=$(jq -r '.reason // empty' "$CONTEXT_FILE")
  REMEDY=$(jq -r '.remedy // empty' "$CONTEXT_FILE")
  CANDIDATES=$(jq -r '(.candidates // []) | map(.name // .id) | join(", ")' "$CONTEXT_FILE")
else
  grep -q '"serro_available"[[:space:]]*:[[:space:]]*true' "$CONTEXT_FILE" \
    && AVAILABLE=true || AVAILABLE=false
  PROGRAM_ID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  PROGRAM_NAME=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  REASON=$(grep -o '"reason"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  REMEDY=$(grep -o '"remedy"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  CANDIDATES=""
fi

if [ "$AVAILABLE" != "true" ]; then
  echo "SERRO CONTEXT GUARD: Serro MCP was not reachable." >&2
  [ -n "$REASON" ] && echo "  Reason: $REASON" >&2
  echo "  Fix: ${REMEDY:-claude mcp add --transport http --scope user serro https://mcp.serro.ai/mcp && claude mcp login serro}" >&2
  echo "  Note: a Serro connector added in the claude.ai UI is NOT visible to headless Archon runs." >&2
  exit 1
fi

if [ -z "$PROGRAM_ID" ]; then
  echo "SERRO CONTEXT GUARD: Serro is connected, but no program resolved." >&2
  [ -n "$CANDIDATES" ] && echo "  Candidates: $CANDIDATES" >&2
  echo "  Fix: name the program in the run message, e.g." >&2
  echo "       archon workflow run <workflow> \"<program name>\"" >&2
  echo "  Or set SERRO_PROGRAM in ~/.archon/.env" >&2
  exit 1
fi

echo "Serro context OK — program: ${PROGRAM_NAME:-unknown} (${PROGRAM_ID})"
