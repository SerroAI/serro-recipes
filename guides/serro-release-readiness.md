## What it checks

A green build says the code works. It doesn't say you kept your promises.
Release Readiness checks four kinds of blocker that only the program knows
about:

| Blocker | Why it needs Serro |
| --- | --- |
| Committed but unshipped requirements | Only Serro knows what was promised to which customer, and its status |
| Unresolved risks | Whether this release makes each open risk better or worse |
| Release-gating action items | Owned, overdue, or written as a precondition |
| Contradicted decisions | Shipped work that reverses a decision, or a meeting decision not yet in the code |

## What goes into the verdict

It combines three inputs:

- **Program context** from Serro: risks, requirements, decisions and action
  items.
- **Release scope** from git: up to 300 commits since the last tag and the
  last 60 lines of `git diff --stat`. Without any tags it uses the last 100
  commits and lists no files.
- **Delivery signals** from Serro: merged PRs, program activity, recent meetings
  and the latest report.

```bash
archon workflow run serro-release-readiness "Checkout Revamp"
```

## Reading the report

- **Limitations** lists every lookup that was unavailable rather than empty, so
  you always know what was not checked.
- "No evidence this shipped" and "evidence this did not ship" are reported
  separately. They lead to different conversations.
- Blockers are ranked by consequence, not counted. Three real blockers beat
  eleven maybes.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Release Readiness — Checkout Revamp

**Verdict:** NO-GO
**Scope:** 47 commits since v2.3.0

## Summary
One committed Northwind requirement shows no evidence of shipping, and one open
risk gets worse in this release. Everything else is manageable.

## Blockers (2)
1. **REQ-7 "Saved cards for guest checkout"** (committed, Northwind). Owner:
   Priya. No evidence this shipped: no merged PR or commit in scope mentions it.
   Unblocks when the guest path merges, or the commitment is moved with Northwind.
2. **RISK-12 "Duplicate charges on retry"** (high). PR #1234 adds a retry loop
   without an idempotency key. Unblocks with the key, or a feature flag.

## Riding along
- RISK-15 "Slow tax API at peak" (medium) is unchanged and ships open.
- AI-21 "Load test the payment step" is overdue but not release-gating.

## What was checked
- Committed but unshipped requirements: flagged (REQ-7)
- Unresolved risks: flagged (RISK-12)
- Release-gating action items: clear
- Contradicted decisions: clear (DEC-3 matches the code)

## Limitations
- Recent meetings could not be read, so a decision made in a meeting this week
  would not appear here.
```
