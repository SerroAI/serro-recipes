---
name: serro-meeting-prep
description: Prepare for an upcoming program meeting using Serro — what changed since the last one, which action items are still open, which decisions are pending, and the specific questions worth asking. Use when asked to prep for a meeting, build an agenda, "what should I ask", "what's changed since last time", "get me ready for the sync", or before a customer, review, or steering call.
---

# Serro Meeting Prep

Tool names below assume the Serro MCP server is registered as `serro`. If yours
has another name (on Serro's staging, `serro-staging`), use that prefix instead:
`mcp__serro-staging__list_programs` for `mcp__serro__list_programs`, and so on.

Turn "I have a meeting in ten minutes" into a short, specific agenda grounded in
what actually happened since the last one.

The value here is entirely in the delta. Anyone can list topics; only Serro knows
what changed since this group last met, what they committed to, and what they left
unresolved.

## Find the meeting and the program

1. `mcp__serro__search_meetings` — locate the upcoming meeting, or the recurring
   series if the user names it loosely ("the Thursday sync").
2. Resolve the program via `mcp__serro__list_programs`, or from
   `SERRO-CONTEXT.md` if you are in a repo.
3. Find the **previous** meeting in the same series. That is your baseline. If
   there isn't one, say so — the prep becomes an opening agenda instead of a
   delta.

If you cannot identify the meeting, ask. Do not prep a generic agenda and present
it as tailored.

## Build the delta

1. `mcp__serro__get_meeting_transcript` on the previous meeting — extract what was
   **decided**, what was **promised**, and what was **deferred**. Those three
   lists drive everything below.
2. `mcp__serro__get_program_activity` and `mcp__serro__get_repo_activity` for the
   window since that meeting — what actually moved.
3. `mcp__serro__get_program_widget_data`: catalog first, then `action_items`
   (which of last meeting's promises are still open), `decision_log` (what has
   been settled since), `risk_log` (what is new or worse),
   `customer_requirements` (what changed status).
4. `mcp__serro__search_slack` or `mcp__serro__get_slack_thread` if a topic clearly
   continued in chat after the meeting — that is often where the real
   disagreement lives.

## Write the prep

```
# <Meeting> · <date>
Program: <name> · Last met: <date>

## Since last time
- <what changed, with evidence>

## Still open from last meeting
- <promise made> — <owner> — <current status, with evidence or "no evidence of movement">

## Needs a decision today
- <the question, the options, and who has to answer>

## Questions worth asking
- <3-5 sharp questions, each one tied to something above>

## Not on the agenda but worth knowing
- <one or two items, or omit this section entirely>
```

Rules:

- **"Still open" needs evidence, not inference.** Distinguish "no evidence this
  moved" from "evidence this did not move" — they lead to different
  conversations, and only one of them is an accusation.
- **Decisions needed must be phrased as answerable questions**, with the realistic
  options. "Discuss the migration" wastes the meeting; "do we cut tier-2 orgs from
  the first migration wave, or delay a week?" ends it.
- **Questions must be specific enough to be uncomfortable.** "Any updates on the
  API?" is filler. "Requirement CR-12 is still `committed` for the customer who
  asked for it, with nothing landed — is that still the date?" is prep.
- **Cap it.** Five agenda items maximum. A prep doc nobody finishes reading before
  the call has failed, however complete it is.
- **Never invent attendance, dates, or commitments.** If the transcript is
  ambiguous about who owns something, say it is ambiguous — that is itself worth
  raising.

## If the meeting has already happened

The user may want the reverse: a recap. Same sources, different output — what was
decided, what was promised and by whom, and what remains open. Offer to draft
follow-ups, but do not send anything.
