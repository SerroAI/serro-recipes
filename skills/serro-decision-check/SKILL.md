---
name: serro-decision-check
description: Check whether a question has already been decided for a program before re-opening it, using Serro's decision log and meeting record — and if it has, surface the decision, its date, its rationale, and what it constrains. Use when someone asks "has this been decided", "why is it built this way", "can we change X", "who decided Y", "didn't we discuss this", or when a proposal appears to contradict an earlier choice.
---

# Serro Decision Check

Re-litigating a settled decision is one of the most expensive things a team does,
and it happens because the decision is invisible: it lives in a meeting three
weeks ago that half the room missed. Serro records decisions with rationale and
date. Check before re-opening.

This skill has one job: **find out whether the question is already answered, and
report the answer with its provenance.** It does not decide anything.

## Look it up

1. Resolve the program — `mcp__serro__list_programs`, or `SERRO-CONTEXT.md` if you
   are in a repo.
2. `mcp__serro__get_program_decisions` — the primary source. Match on the subject
   of the question, not its exact wording; the same decision gets described
   several ways.
3. `mcp__serro__get_program_widget_data` with `widget_type: decision_log` — for
   the widget's view, including status and any linked items.
4. If the decision log is thin or the match is loose, go to where decisions are
   actually made:
   - `mcp__serro__search_meetings` then `mcp__serro__get_meeting_transcript` —
     quote the moment it was decided
   - `mcp__serro__search_slack` / `mcp__serro__get_slack_thread` — decisions made
     in chat frequently never reach the log
   - `mcp__serro__get_program_widget_data` with `widget_type: program_memory`

Search on the **subject**, and search more than once with different phrasings
before concluding nothing exists. A false "no decision found" causes exactly the
re-litigation this skill exists to prevent.

## Report one of four outcomes

Be explicit about which one. The difference matters more than the detail.

**1. Decided and current.**
```
DECIDED — <date>
Decision: <what was decided, verbatim where possible>
Rationale: <why>
Source: <decision id, meeting, or thread>
Constrains: <what this rules in or out>
```
Then stop. If the user wants to change it, that is a reversal — see below.

**2. Decided, but the premises have changed.** Report the decision, then name
precisely what changed since (a new risk, a customer commitment, a technical
finding) and note that it may warrant revisiting. Do not revisit it yourself.

**3. Discussed but never decided.** The most common and most useful outcome.
Report what was discussed, where it stalled, and what specifically is needed to
close it — usually a named person and a single answerable question.

**4. No record.** Say so plainly, and say where you looked. Do not reconstruct a
decision from the code: what the code does is evidence of what was built, never
evidence of what was decided or why.

## If the user wants to reverse a decision

Do not quietly help them. Surface, in this order:

1. The decision, its date, and its stated rationale
2. What it currently constrains — code, commitments, other decisions that assume it
3. What has changed that makes reversal reasonable
4. Who needs to agree

Then let the human decide. A reversal made deliberately is fine; a reversal made
by an agent that did not know it was reversing anything is how architectures rot.

## Quoting

Quote decisions and transcripts rather than paraphrasing. Paraphrase drifts, and
drift is how a decision gets remembered as something it never said. Always
include the date — a decision from last week and one from last year carry very
different weight.
