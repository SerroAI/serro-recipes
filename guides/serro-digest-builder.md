## What it gathers

Digest Builder condenses a week of program activity into something a person will
read. It is the weekly, program-scoped counterpart to
[Daily Brief](/docs/guides/serro-daily-brief). The brief is your day and your
identity. The digest is one program and its last seven days.

| Source | Window |
| --- | --- |
| Meetings | Last 7 days, with titles, dates and key points |
| Jira issues | Created or updated in the window |
| Slack | Notable discussion |
| Program status | Risks worth flagging |

## Running it

```bash
archon workflow run serro-digest-builder "Checkout Revamp"
```

## How the program is chosen

The first of these that resolves wins:

1. A program name or id in the run message.
2. The `SERRO_PROGRAM` environment variable.
3. The current repository's name, matched against each program's linked
   repositories.

If none resolve, the digest covers overall activity for your identity and notes
that it is unscoped. It does not guess a program.

## An empty digest is never invented

If Serro can't be reached, the run fails instead of producing an empty digest.
An empty digest reads exactly like a quiet week. A source that really returned
nothing is stated in one line, not padded.

## Reading the digest

- It is under 400 words.
- Sections run TL;DR, Meetings, Jira movement, Slack highlights, Risks to watch.
- Anything blocking or time-sensitive comes first.
- It is saved as `weekly-digest.md`. Nothing is posted anywhere.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Weekly Digest — Checkout Revamp (2026-11-02 to 2026-11-09)

## TL;DR
Cart and tax work landed. The payment step is in review and blocked on one
risk. Northwind pilot is still on for 2026-12-01.

## Meetings
- **Checkout sync (Nov 3):** agreed to keep tax at cart time (DEC-3 stands).
- **Northwind check-in (Nov 6):** they asked again about guest saved cards (REQ-7).

## Jira movement
- Done: CHK-229 guest card form validation, CHK-233 cart totals rewrite
- In review: CHK-231 retry loop for payments
- New: CHK-240 tax rounding on multi-item carts

## Slack highlights
- #checkout-eng: debate on whether retries need an idempotency key before launch.

## Risks to watch
- RISK-12 "Duplicate charges on retry" (high) is open and touched by CHK-231.
```
