## What it gathers

Daily Brief is one short read for the start of your day. It takes no program
argument and runs as whoever the Serro connection belongs to.

| Source | Window |
| --- | --- |
| Meetings | Today |
| Jira issues | Updated in the last 24 hours |
| Program flags | Whatever the program surfaces as worth raising |

## Running it

```bash
archon workflow run serro-daily-brief
```

## An empty brief is never invented

If Serro can't be reached, the run fails with instructions to fix the
connection. It does not write an empty brief. An empty brief reads exactly like
a quiet day, and that is the mistake this check prevents.

The same split applies to each source. A source that really returned nothing is
stated in one line. "Nothing happened" and "the lookup failed" stay different.

## Reading the brief

- It is under 200 words.
- Time-sensitive items come first.
- It ends with a one-line focus for the day.
- It is saved as `daily-brief.md` and printed to the run log.

The run is read-only. It posts nothing and changes nothing in your checkout.

## When to use something else

For a weekly, program-scoped summary, use
[Digest Builder](/docs/guides/serro-digest-builder).

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Daily Brief — 2026-11-09

**Time-sensitive**
- 10:30 Checkout Revamp sync (6 attendees). Payment step review is on the agenda.
- 14:00 Northwind pilot prep call.
- CHK-231 "Retry loop without idempotency key" moved to In Review overnight.

**Jira movement (last 24h)**
- CHK-231 In Review
- CHK-229 "Guest card form validation" Done
- CHK-240 "Tax rounding on multi-item carts" opened

**Program flags**
- RISK-12 "Duplicate charges on retry" is still open and is touched by CHK-231.

Slack and decisions: no source data came back for these today.

**Focus for today:** get CHK-231 reviewed before the Northwind prep call.
```
