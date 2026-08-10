# serro-decision-drift-detector

Finds where the code stopped honouring what the team decided — auditing the
checked-out repo against a program's locked decisions, committed customer
requirements and open risks.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-decision-drift-detector
archon workflow run serro-decision-drift-detector "Checkout Revamp"
```

## The standard comes from Serro, never from the repo

This is the design decision the whole workflow rests on. The constraints are
pulled from the program's `decision_log`, `customer_requirements` and `risk_log`
— never inferred from the code, because the code is the thing being audited.
Deriving the standard from the subject would make the audit vacuous.

The same logic drives the guard: if Serro is unreachable, or no program resolves,
or a program yields no checkable constraints, the run **fails**. Zero constraints
would otherwise render as a clean audit, which is precisely the failure this
workflow exists to prevent.

Program resolution stops at the first of: a name or id in the run message,
`SERRO_PROGRAM`, or the repository name matched against programs' linked repos.
If none resolve it stops rather than guessing — an audit against the wrong
program is worse than no audit.

## Verdicts

| Verdict | Meaning |
|---|---|
| `ALIGNED` | Code matches the decision |
| `DRIFT` | Code contradicts or no longer satisfies it |
| `UNVERIFIED` | The relevant code could not be found with confidence |

`UNVERIFIED` is deliberately not folded into either of the others. "We could not
check" and "we checked and it's fine" lead to different conversations.

## It proves it was read-only

The run opens by snapshotting the working tree and closes by asserting the tree
is identical, via `scripts/capture-diff.sh` and `scripts/assert-diff-unchanged.sh`
in this bundle. If the audit modified anything, the final node fails and says so.

The snapshot records `git status --porcelain` as well as the diff, because a diff
alone ignores untracked files — an agent that created a file would otherwise pass
an unchanged-diff check.

It also runs in a worktree (`worktree.enabled: true`), so the agent reads an
isolated checkout rather than your live one.

## Output

`$ARTIFACTS_DIR/decision-drift-report.md` — a TL;DR with verdict counts and the
single most important drift, then drift findings high-severity first, each with
`file:line` evidence, the Serro source it contradicts and a suggested fix
direction, then unverified items, then aligned collapsed to a count.

Nothing is written to Serro and nothing is posted anywhere.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- A resolvable program **with a populated decision log** — an empty program fails
  the guard rather than reporting no drift
- The repository you want audited, checked out

## When not to use it

| You want | Use instead |
|---|---|
| To fix the drift | feed high-severity findings into a grounded ticket; this is read-only |
| A review of one PR | `serro-pr-readiness` or `serro-design-pr-review` |
