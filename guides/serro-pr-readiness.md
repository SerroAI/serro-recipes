## What it checks

A code reviewer reads the diff. PR Readiness also reads the program around it,
and asks four questions a reviewer without that context can't answer:

1. Does the diff touch an **open risk**: mitigate it, make it worse, or break
   the assumption it was logged under?
2. Does it contradict, or only **partly** implement, a **committed customer
   requirement**? Partial work is the expensive case. It ships, looks done, and
   the promise is still open.
3. Does it go against a **recorded decision**?
4. Is it blocked by an **open action item**, or does it complete one?

Every finding cites both the diff location and the program item it collides
with. Findings that cite only one side are dropped as speculation.

## Running it

Pass a PR number, or a program name to diff the current branch:

```bash
archon workflow run serro-pr-readiness "1234"
archon workflow run serro-pr-readiness "Checkout Revamp"
```

The program is found from the run message, the `SERRO_PROGRAM` environment
variable, or a match on the repository name. Any 1 to 7 digit number in the
message is read as a PR number, so for a program name like "Checkout 2026", set
`SERRO_PROGRAM` instead.

## When the context is thin

- If Serro can't be reached, the run **stops** at its first step rather than
  writing a generic review. An answer with no program context is the result
  this workflow exists to avoid.
- If the program has no insights yet, you get `ready_with_caveats` with the
  thin context stated, not invented findings.
- Nothing is posted to GitHub, Slack or Serro, and your code is not changed.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# PR Readiness — Checkout Revamp

**Verdict:** NOT READY
**Change:** #1234 "Move tax calculation to the payment step"
**Checked against:** 6 open risks, 4 committed requirements, 5 decisions, 3 open action items

## Summary
This PR drops the saved-card flow that Northwind was promised. It also reverses
a decision about where tax is calculated. Both need an answer before merge.

## Findings
1. **Partly implements a committed requirement.** `src/checkout/cards.ts:88`
   removes the saved-card path for guest users. REQ-7 "Saved cards for guest
   checkout" is committed for Northwind. The PR ships the logged-in half only.
   Finish the guest path or move REQ-7 out of committed first.
2. **Goes against a recorded decision.** `src/tax/calc.ts:14` computes tax at
   payment time. DEC-3 (2026-09-12) says tax is computed at cart time so totals
   match the quote. Confirm with the decision owner before changing it.
3. **Worsens an open risk.** The new retry loop in `src/payments/retry.ts:41`
   has no idempotency key. RISK-12 "Duplicate charges on retry" is high severity.

## Checked and clear
- Open action items: AI-21 is not blocked by this change and is not completed by it.
```
