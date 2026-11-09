## What it checks

Design PR Review compares a PR to the design the team says it is building, and
to the design decisions the program has recorded. It is not a full code review.
Style, naming, tests and performance are out of scope unless the design
document speaks to them.

The design comes from two places:

- **The repo.** Tracked Markdown files whose names match
  `design|architecture|spec|prd|rfc`, found with `git ls-files` so build output
  is never scanned.
- **Serro.** Linked program documents, the program objective and the decision
  log. A committed `design.md` can go stale within weeks. The decision log
  records what the team agreed, and when.

Where the two disagree, the review says so instead of picking a side.

## Finding types

| Type | Meaning |
| --- | --- |
| Contradiction | The change does what the design says not to do |
| Decision reversal | The change reverses a recorded design decision, quoted with its date |
| Silent extension | A new concept, boundary or state the design does not cover |
| Stale design | The document describes something the code has moved past |

Every finding quotes the design and cites the diff location. If the design can't
be quoted, the finding is inference and is dropped.

## Running it

Pass a PR number. To pin the design document, add its path:

```bash
archon workflow run serro-design-pr-review "1234"
archon workflow run serro-design-pr-review "1234 docs/design.md"
```

Without a PR number it falls back to the diff of the current branch.

## Reading the report

- **No design source** is a real result. The report says what to create so the
  next run can check something. The workflow does not rebuild a design from the
  code, because that would make the review circular.
- **Stale design** means fix the document, not the code. Suggested document
  edits are listed for a person to apply. The workflow never edits the design.
- The report ends with a line naming what it did not examine, so nobody reads it
  as a full code review.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Design Review — Checkout Revamp

**Verdict:** DRIFT
**Design source:** docs/design.md (plus 2 linked program documents)
**Change:** #1234 "Move tax calculation to the payment step"

## Summary
The PR reverses a recorded decision on where tax is calculated. It also adds a
retry state the design does not describe.

## Findings (3)
1. **Decision reversal.** DEC-3 (2026-09-12): "Tax is computed at cart time so
   the total matches the quote." `src/tax/calc.ts:14` now computes tax in the
   payment step. Smallest fix: keep the cart-time calculation and reuse it.
2. **Contradiction.** docs/design.md, "Payments": "The payment step never
   mutates the cart." `src/payments/step.ts:57` rewrites line totals.
3. **Silent extension.** `src/payments/retry.ts:12` adds a `RETRYING` state.
   The design lists only `PENDING`, `PAID` and `FAILED`.

## Suggested design updates
- docs/design.md, "Payment states": add `RETRYING`, or remove it from the PR.

## Out of scope
Style, tests, performance and security were not examined. This is not a full
code review.
```
