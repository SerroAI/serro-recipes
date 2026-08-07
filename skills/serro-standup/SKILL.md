---
name: serro-standup
description: Draft a status update, standup note, or progress summary for a program using real activity from Serro — what actually landed, what moved, what is blocked, what needs a decision. Use when asked for a status update, standup, weekly update, progress report, "what did we ship", "where are we on X", "write my update", or when preparing to report to a stakeholder or exec.
---

# Serro Standup

Write a status update from what actually happened, not from what someone
remembers happening. Serro holds the cross-tool record — meetings, commits, PRs,
decisions, risks, action items — so the update can cite specifics instead of
gesturing at progress.

## Resolve the program first

If the request does not name a program, resolve it before writing anything:

- `mcp__serro__list_programs` — match against what the user mentioned, or the
  repo you are working in
- `SERRO-CONTEXT.md` at the repo root, if present

If more than one program plausibly matches, ask which. A confident update about
the wrong program is worse than a question.

## Gather (do not skip to writing)

Pull the period the user asked for — default to the last 7 days:

1. `mcp__serro__get_program_activity` — the spine of the update. What actually
   moved.
2. `mcp__serro__get_program_widget_data` — call with no `widget_type` for the
   catalog, then fetch `risk_log`, `action_items`, `decision_log`, and
   `customer_requirements`.
3. `mcp__serro__get_repo_activity` or `mcp__serro__search_github` — merged PRs
   and commits in the window.
4. `mcp__serro__search_meetings` — meetings in the window; pull a transcript with
   `mcp__serro__get_meeting_transcript` only when the meeting looks like it
   changed direction.
5. `mcp__serro__search_reports` — if a recent program report exists, read it so
   your update does not contradict what was already sent.

Note anything you could not retrieve. A gap you name is fine; a gap you paper
over becomes a wrong update.

## Write it

Default shape — adapt length to the audience, keep the order:

```
**<Program name>** · <date range>

**Shipped**
- <what landed, with the PR number or commit that proves it>

**In progress**
- <what is moving, and what it is waiting on>

**Blocked / needs a decision**
- <the item, who owns it, and the specific decision or unblock needed>

**Risks**
- <only risks that changed status or became more likely this period>
```

Rules that make the difference between a useful update and noise:

- **Every claim carries evidence.** A PR number, commit, meeting, or item id. If
  you cannot point at something, do not assert it.
- **"Shipped" means merged or released.** Not "PR opened", not "code complete".
  Conflating these is how status updates lose credibility.
- **Lead with consequence, not chronology.** The reader wants to know what
  changed for the program, not a commit log.
- **Blocked items name the decision needed and who can make it.** "Waiting on
  design" is not actionable; "needs a call on whether tier-2 orgs get the flag —
  Aravind" is.
- **Do not pad.** A quiet week is a two-line update. Inventing motion to fill a
  template trains people to stop reading.
- **Never invent a percentage.** No "80% done" unless Serro actually holds that
  number.

## Tone

Match the audience the user names. Default to plain and specific: no
"successfully executed", no "leveraged", no "alignment" as a verb. If the update
is going to a customer or an exec, say so and drop internal shorthand and ticket
jargon.

## Before you finish

State plainly which sources you used and which returned nothing, in one line at
the end. The reader needs to know whether "no risks" means the risk log was
empty or the lookup failed.
