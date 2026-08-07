# serro-release-readiness

Program-level go/no-go. Answers "are we ready to ship" using commitments and
risks the program holds, not just a green CI badge.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-release-readiness
archon workflow run serro-release-readiness "Checkout Revamp"
```

## What it checks

| Blocker class | Why it needs Serro |
|---|---|
| Committed-but-unshipped requirements | Only Serro knows what was promised to which customer, and in what status |
| Unresolved risks | Whether this release makes each open risk better or worse |
| Release-gating action items | Owned, overdue, or phrased as a precondition |
| Contradicted decisions | Landed work that reverses a decision, or a meeting decision not yet in the code |

It combines three inputs: the program context, deterministic git scope (commits
and files since the last tag), and cross-tool delivery signals pulled from Serro
(merged PRs, program activity, recent meetings, latest report).

## Verdicts

| Verdict | Meaning |
|---|---|
| `no_go` | A committed requirement is unshipped, or an open high-severity risk is made worse |
| `go_with_risk` | No hard blockers, but named risks or gaps ship along |
| `go` | Nothing outstanding against context substantive enough to judge |

## Output

`$ARTIFACTS_DIR/release-readiness.md`, plus `release-scope.txt` and
`delivery-signals.md`.

The report carries an explicit **Limitations** section listing any lookup that
was unavailable rather than empty — so a reader always knows what was *not*
checked. Nothing is posted anywhere; your codebase is not modified.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- A resolvable program — from the run message, `SERRO_PROGRAM`, or a repo-name
  match
- Git tags improve the scope section; without any tags it falls back to the last
  100 commits

## Notes

- "No evidence this shipped" and "evidence this did not ship" are reported as
  different claims. They lead to different conversations.
- Blockers are ranked by consequence, not counted for effect — three real
  blockers beat eleven maybes.
