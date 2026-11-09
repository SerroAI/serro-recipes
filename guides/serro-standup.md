## What changes

With this skill installed, your agent drafts a status update from what actually
happened, not from what someone remembers happening. It reads Serro's record of
meetings, commits, PRs, decisions, risks and action items, so every line can
point at something specific. It drafts. You send.

## What it does

1. **Finds the program.** If you don't name one, it looks at your repo and
   `SERRO-CONTEXT.md`. If more than one program fits, it asks. A confident update
   about the wrong program is worse than a question.
2. **Gathers first.** It covers the last 7 days unless you say otherwise: program
   activity, risk, action item, decision and requirement data, merged PRs and
   commits, meetings in the window, and any recent program report so it doesn't
   contradict what was already sent.
3. **Writes it** in this order: Shipped, In progress, Blocked or needs a decision,
   Risks.

## Rules it follows

- Every claim carries evidence: a PR number, commit, meeting or item id.
- "Shipped" means merged or released. Not "PR opened", not "code complete".
- It leads with consequence, not chronology.
- Blocked items name the decision needed and who can make it.
- A quiet week is a two-line update. It does not pad.
- It never invents a percentage unless Serro holds that number.

## Tone and sources

It matches the audience you name. Default is plain and specific. For a customer
or an exec, ask it to drop internal shorthand. It ends with one line saying which
sources it used and which returned nothing, so "no risks" can be told apart from
a failed lookup.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Write my standup for Checkout Revamp.

**Agent:**
**Checkout Revamp** · Nov 2 to Nov 9

**Shipped**
- Cart totals rewrite, merged (PR #1229).
- Guest card form validation, merged (PR #1236).

**In progress**
- Payment retry loop (PR #1234). In review, waiting on an idempotency key.

**Blocked / needs a decision**
- Tax timing for the payment step: needs a call on whether to revisit DEC-3
  (tax at cart time). Owner: Priya.

**Risks**
- RISK-12 "Duplicate charges on retry" (high): PR #1234 touches it and is not
  yet safe against it.

Sources used: program activity, GitHub, risk log, decision log, meetings.
Action items returned nothing.
```
