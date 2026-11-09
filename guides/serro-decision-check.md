## What changes

Re-opening a settled decision is expensive, and it happens because the decision
is invisible: it was made in a meeting three weeks ago that half the room missed.
With this skill installed, your agent checks Serro before re-opening the
question. It does one job: find out whether the question is already answered, and
report the answer with its source. It does not decide anything.

## Where it looks

1. The program's decision log, matched on the subject of the question rather than
   its exact wording.
2. If the log is thin or the match is loose, meetings and transcripts, Slack
   threads, and program memory. Decisions made in chat often never reach the log.

It searches more than once, with different phrasings, before concluding nothing
exists. A false "no decision found" causes the re-litigation this skill is meant
to prevent.

## The four outcomes

The agent says which one applies.

1. **Decided and current.** It reports the date, the decision (verbatim where
   possible), the rationale, the source and what it constrains.
2. **Decided, but the premises have changed.** It reports the decision, then names
   what changed since. It notes it may be worth revisiting but doesn't revisit it.
3. **Discussed but never decided.** The most common outcome. It reports what was
   discussed, where it stalled and what is needed to close it, usually a named
   person and one answerable question.
4. **No record.** It says so and says where it looked. It does not reconstruct a
   decision from the code, because code shows what was built, not what was decided.

## If you want to reverse a decision

The agent won't quietly help. It surfaces the decision, its date and rationale;
what it constrains; what has changed; and who needs to agree. Then you decide.

It quotes decisions and transcripts instead of paraphrasing, and always includes
the date.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Can we move tax calculation to the payment step?

**Agent:** This has been decided.

DECIDED — 2026-09-12
Decision: "Tax is computed at cart time so the total matches the quote."
Rationale: Totals shown in the cart must equal what the customer is charged.
Source: DEC-3, Checkout sync (2026-09-12)
Constrains: Cart totals, the payment step, and the Northwind quote export (REQ-9).

Moving tax to the payment step would reverse DEC-3. If you want to pursue it:
- Constrains: the cart total display and REQ-9 invoice export both assume
  cart-time tax.
- Since then: RISK-15 "Slow tax API at peak" was logged, which could justify
  revisiting.
- Who needs to agree: Priya, who owns the decision.

I haven't changed anything. How do you want to proceed?
```
