## What it checks

Decision Drift Detector audits the checked-out repo against what the program has
locked in: recorded decisions, committed customer requirements and open risks.
It reports where the code no longer honours them.

The standard always comes from Serro, never from the repo. The code is the thing
being audited, so deriving the standard from it would make the audit empty.

## When it refuses to run

The run fails, rather than reporting a clean audit, if:

- Serro can't be reached.
- No program resolves. The program comes from the run message, then
  `SERRO_PROGRAM`, then the repository name matched against linked repos.
- The program has no checkable constraints, for example an empty decision log.

Zero constraints would otherwise look like zero drift.

## Verdicts

| Verdict | Meaning |
| --- | --- |
| `ALIGNED` | The code matches the decision |
| `DRIFT` | The code contradicts it or no longer satisfies it |
| `UNVERIFIED` | The relevant code could not be found with confidence |

`UNVERIFIED` is kept separate on purpose. "We could not check" and "we checked
and it's fine" lead to different conversations.

## Running it

```bash
archon workflow run serro-decision-drift-detector "Checkout Revamp"
```

Check out the revision you want audited first. The run works in an isolated
worktree, and it is read-only. It snapshots the working tree at the start and
asserts at the end that nothing changed. If the audit modified anything, the
final step fails and says so. Nothing is written to Serro or posted anywhere.

## Reading the report

- The summary gives verdict counts and the single most important drift.
- Drift findings come next, high severity first. Each has `file:line` evidence,
  the Serro item it contradicts, and a suggested direction for the fix.
- Unverified items follow. Aligned items are collapsed into a count.

For one PR, use [PR Readiness](/docs/guides/serro-pr-readiness) or
[Design PR Review](/docs/guides/serro-design-pr-review) instead.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Decision Drift Report — Checkout Revamp

## TL;DR
ALIGNED 5 · DRIFT 2 · UNVERIFIED 1. Most important: tax is now computed at
payment time, against DEC-3.

## Drift found
### DEC-3 "Tax is computed at cart time" (high)
- Evidence: `src/tax/calc.ts:14` calls `computeTax` from the payment step.
- Source: decision_log DEC-3, 2026-09-12.
- Fix direction: reuse the cart-time total and drop the second calculation.

### REQ-7 "Saved cards for guest checkout" (medium)
- Evidence: `src/checkout/cards.ts:88` returns early for guest sessions.
- Source: customer_requirements REQ-7 (committed, Northwind).
- Fix direction: finish the guest path, or move the commitment with Northwind.

## Unverified
- RISK-15 "Slow tax API at peak": no caching or timeout code found with confidence.

## Aligned
5 constraints aligned.
```
