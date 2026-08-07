---
description: Resolve the Serro program for this repo and load its live context (risks, requirements, decisions, action items) into the run artifacts
argument-hint: [program name or id]
---

# Load Serro Program Context

**Input**: $ARGUMENTS

You are the context stage of a Serro workflow. Every downstream node reasons
against what you produce here. You do not review code, and you do not fix
anything — you resolve **which program** this run is about and load its **live
context**.

Two rules govern everything below:

1. **Never invent context.** If a tool call fails or returns nothing, record the
   absence. A downstream node reading "no open risks" must be able to trust that
   it means *Serro reported zero risks*, not *the lookup failed*.
2. **Fail loudly.** A run that silently proceeds without Serro context produces a
   generic answer wearing Serro's name. That is the worst possible outcome. Stop
   instead.

---

## Phase 1 — Verify Serro is reachable

List the tools available to you and find the ones named `mcp__serro__*`.

If there are none, or if the first Serro call fails with an auth error, write
this to `$ARTIFACTS_DIR/serro-context.json` and **stop immediately** — do not
continue to Phase 2:

```json
{
  "serro_available": false,
  "reason": "<the exact error, or 'no mcp__serro__* tools present'>",
  "remedy": "Run: claude mcp add --transport http --scope user serro https://mcp.serro.ai/mcp && claude mcp login serro. Note that a Serro connector configured in the claude.ai UI is NOT visible to headless Archon runs."
}
```

Then end your turn with the single line:

```
SERRO CONTEXT UNAVAILABLE
```

Otherwise, call `mcp__serro__whoami` once to confirm the identity and
organization the run is operating as, and continue.

## Phase 2 — Resolve the program

Resolve in this order, stopping at the first that succeeds:

1. **From `$ARGUMENTS`** — if it contains a program name or id. It may also
   contain a PR number or other noise; extract only what looks like a program
   reference. Confirm the match with `mcp__serro__list_programs` (or
   `mcp__serro__get_program` if you have an id).
2. **From the environment** — if `SERRO_PROGRAM` is set, use it.
3. **From the repository** — get the repo name (`git remote get-url origin`),
   then call `mcp__serro__list_programs` and match against each program's linked
   repositories or title.

If more than one program matches, or none do, write
`$ARTIFACTS_DIR/serro-context.json` with `"serro_available": true`,
`"program": null`, and a `"candidates"` array of the plausible programs
(id + name), then end your turn with:

```
SERRO PROGRAM UNRESOLVED
```

Do not pick one arbitrarily. Naming the wrong program silently is worse than
stopping.

## Phase 3 — Load the context

With the program resolved:

1. Call `mcp__serro__get_program` for the program overview — objective, current
   state, members, linked sources.
2. Call `mcp__serro__get_program_widget_data` **with no `widget_type`** first.
   That returns the catalog of widget types actually available for this program.
   Do not assume the catalog; read it.
3. For each widget type in the catalog relevant to engineering risk and scope,
   call `mcp__serro__get_program_widget_data` again with that `widget_type`.
   Prioritise, in order: `risk_log`, `customer_requirements`, `decision_log`,
   `action_items`, `reports`, `program_memory`. Skip types the catalog does not
   list.
4. If the catalog is empty or the program has no widget data, that is a valid
   and important finding — record it as such. It usually means the program has
   not had an insights refresh yet.

Keep the raw payloads. Do not summarise away specifics: ids, titles, owners,
statuses, and dates are exactly what downstream nodes need in order to cite
evidence rather than gesture at it.

## Phase 4 — Write the artifacts

Write **both** files.

`$ARTIFACTS_DIR/serro-context.json` — the machine-readable handoff:

```json
{
  "serro_available": true,
  "organization": "<from whoami>",
  "program": { "id": "...", "name": "...", "objective": "..." },
  "widget_catalog": ["risk_log", "..."],
  "risks": [
    { "id": "...", "title": "...", "severity": "...", "status": "...", "owner": "...", "summary": "..." }
  ],
  "customer_requirements": [
    { "id": "...", "title": "...", "customers": ["..."], "status": "request|committed|shipped", "summary": "..." }
  ],
  "decisions": [
    { "id": "...", "title": "...", "decided_at": "...", "summary": "...", "rationale": "..." }
  ],
  "action_items": [
    { "id": "...", "title": "...", "owner": "...", "status": "...", "due": "..." }
  ],
  "reports": [{ "id": "...", "title": "...", "generated_at": "..." }],
  "program_memory": "<verbatim or null>",
  "notes": ["anything that was empty, failed, or looked stale"]
}
```

Omit any key whose lookup you did not make. Use `[]` only when Serro actually
returned an empty set, and say so in `notes`. Use `null` where a value is
genuinely unknown.

`$ARTIFACTS_DIR/serro-context.md` — the same content as compact readable
markdown, one section per area, most severe or most recent first. This is what a
human skims when the run finishes.

## Output

End your turn with a short summary in this shape — nothing else:

```
SERRO CONTEXT LOADED
Program: <name> (<id>)
Risks: <n> open / <n> total
Requirements: <n> committed, <n> shipped, <n> requested
Decisions: <n>
Action items: <n> open
Gaps: <one line, or "none">
```
