# serro-pr-readiness

Judges a PR against what the program already knows, rather than against style.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-pr-readiness
archon workflow run serro-pr-readiness "1234"          # PR number
archon workflow run serro-pr-readiness "Checkout Revamp" # or a program name
```

## What it checks

Four questions, none of which a code reviewer without program context can
answer:

1. Does this diff touch an **open risk** — mitigating it, worsening it, or
   invalidating the assumption it was logged under?
2. Does it contradict or *partially* implement a **committed customer
   requirement**? Partial implementation is the expensive one: it ships, it looks
   done, and the commitment is still open.
3. Does it go against a **recorded decision**?
4. Is it blocked by, or does it complete, an **open action item**?

Every finding must cite both the diff location and the context item it collides
with. Findings citing only one side are dropped as speculation.

## Verdicts

| Verdict | Meaning |
|---|---|
| `not_ready` | Contradicts a committed requirement or recorded decision, or worsens an open high-severity risk |
| `ready_with_caveats` | Non-blocking findings, or program context too thin to judge confidently |
| `ready` | No conflicts against context substantive enough to check |

## Output

`$ARTIFACTS_DIR/pr-readiness-report.md`, plus `serro-context.json`,
`serro-context.md` and `pr-diff.txt` from the intermediate stages.

Nothing is posted to GitHub, Slack or Serro. Your codebase is not modified.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- `gh` CLI for PR-number mode; without it, the workflow falls back to diffing
  the current branch against the remote default branch
- A resolvable program — from the run message, `SERRO_PROGRAM`, or a repo-name
  match

## Notes

- If Serro is unreachable the run **fails** at the guard node instead of
  producing a generic review. That is deliberate: a context-free answer wearing
  Serro's name is the worst outcome.
- A program whose widget catalog is empty (no insights refresh yet) yields
  `ready_with_caveats` with the thin-context caveat stated, not invented
  findings.
