---
name: serro-context
description: Load the program context (objective, open risks, committed customer requirements, recorded decisions, open action items) that governs work in this repository. Use at the start of any non-trivial task — planning, implementing, reviewing, or estimating — and whenever a change might touch a customer commitment, a known risk, or a decision the team already made. Also use when asked "why is it built this way", "has this been decided", "who asked for this", or "is this still open".
---

# Serro Program Context

Tool names below assume the Serro MCP server is registered as `serro`. If yours
has another name (on Serro's staging, `serro-staging`), use that prefix instead:
`mcp__serro-staging__list_programs` for `mcp__serro__list_programs`, and so on.

This repository is governed by a **program** — a shared source of truth Serro
maintains across meetings, tickets, code and chat. The program knows things the
code does not: what was promised to which customer, which risks are open, and
which decisions are already settled.

Ignoring that context is how correct-looking work becomes wrong work.

## How to load it

1. **Read `SERRO-CONTEXT.md` at the repository root.** That is the compiled
   context pack. Read it before planning, not after.

2. **Check whether it is stale.** The file states its generation date. If it is
   more than about two weeks old, or the task concerns something the file does
   not mention, treat it as incomplete rather than authoritative.

3. **Prefer live context when available.** If `mcp__serro__*` tools are present,
   they beat the file:
   - `mcp__serro__get_program` — objective and current state
   - `mcp__serro__get_program_widget_data` — call with no `widget_type` for the
     catalog, then per type (`risk_log`, `customer_requirements`,
     `decision_log`, `action_items`)
   - `mcp__serro__get_program_decisions` — decisions with rationale
   - `mcp__serro__search_meetings`, `mcp__serro__get_meeting_transcript` — where
     a decision was actually made, when the log is terse

4. **If neither exists**, say so once, plainly, and proceed on the code alone.
   Do not invent program context, and do not infer commitments from code
   comments — a fabricated commitment is worse than an acknowledged gap.

## How to use it

- **Decisions bind.** If a recorded decision covers the task, follow it. If the
  task requires reversing it, stop and say which decision you would be
  reversing, its date, and why the reversal is needed. Never reverse one
  silently.
- **Committed requirements are scope.** A requirement marked `committed` is
  promised to a named customer. Partially implementing one is the most expensive
  failure available: it looks shipped and the promise is still open.
- **Open risks are hypotheses to test.** If the change touches a risk's subject,
  state whether it improves, worsens, or invalidates that risk.
- **Cite, do not paraphrase.** Reference items by id and title, so a human can
  verify you read the real thing.
- **Report conflicts before writing code.** If the request contradicts the
  program context, surface the conflict first. Resolving it is the user's call,
  not yours.

## Refreshing the pack

If the repo has Archon installed:

```bash
archon workflow run serro-context-pack "<program name>"
```

That regenerates `SERRO-CONTEXT.md` from live Serro data. Review the diff before
committing it — it is a committed file, so it is also a shared statement about what
the program currently holds.

Without Archon, and with Serro MCP available, you can do the same work directly:
read the program context through the `mcp__serro__*` tools listed above and write
`SERRO-CONTEXT.md` yourself. Keep it specific, keep every item's id and status, and
state the date it was generated — stale context that looks current is the failure
mode worth avoiding.
