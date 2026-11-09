## What changes

With this skill installed, your agent turns "I have a meeting in ten minutes"
into a short agenda built from what happened since the group last met. Anyone can
list topics. Only Serro knows what changed, what was promised and what was left
unresolved.

## What it does

1. **Finds the meeting and the program.** It locates the upcoming meeting or the
   recurring series, resolves the program, and finds the previous meeting in the
   same series as the baseline. If there is no previous meeting, it says so and
   writes an opening agenda instead of a delta. If it can't identify the meeting,
   it asks.
2. **Builds the delta.** From the previous transcript it pulls what was decided,
   promised and deferred. It then reads program and repo activity since that
   meeting, plus action items, decisions, risks and customer requirements. It
   checks Slack when a topic clearly continued there.
3. **Writes the prep** under these headings: Since last time, Still open from last
   meeting, Needs a decision today, Questions worth asking and, if useful, Not on
   the agenda but worth knowing.

## Rules it follows

- "Still open" needs evidence. It separates "no evidence this moved" from
  "evidence this did not move". Only one of those is an accusation.
- Decisions are phrased as answerable questions with realistic options.
- Questions are specific, not "any updates on the API?".
- It stops at five agenda items.
- It never invents attendance, dates or commitments. If ownership is ambiguous it
  says so.

If the meeting already happened, ask for a recap. It uses the same sources and
reports what was decided, who promised what and what is still open. It offers to
draft follow-ups but sends nothing.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Prep me for the Thursday Northwind sync.

**Agent:**
# Northwind sync · 2026-11-12
Program: Checkout Revamp · Last met: 2026-11-05

## Since last time
- Cart totals rewrite merged (PR #1229).
- RISK-12 "Duplicate charges on retry" is still open; PR #1234 is in review.

## Still open from last meeting
- Share a guest checkout date (REQ-7): Priya. No evidence of movement.
- Load test the payment step (AI-21): Marcus. In progress, no results yet.

## Needs a decision today
- Ship the pilot without guest saved cards, or move the pilot a week?

## Questions worth asking
- REQ-7 is still committed for Northwind with nothing landed. Is 2026-12-01
  still the date they need it by?
- Would the pilot be useful for them without guest saved cards?

## Not on the agenda but worth knowing
- Northwind asked about invoice export again in Slack on Nov 6.
```
