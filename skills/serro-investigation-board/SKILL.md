---
name: serro-investigation-board
description: Hunt a hard bug as a team of agents sharing one investigation board in Serro - every hypothesis with who is testing it, what was tried, the evidence, and whether it was ruled out or confirmed - so parallel agents and teammates never retry a dead end and the root cause is recorded with its proof. Beta. Use when someone says "help me investigate", "split this debugging across agents", "what have we already ruled out", "pick up the investigation into X", or for a bug that has resisted one agent and needs several lines of attack.
---

# Serro Investigation Board (beta)

Hard bugs get debugged in parallel by people who don't talk enough: one agent
retries the cache theory another ruled out an hour ago, and when the fix lands
nobody can say why the other five theories were wrong. This skill puts the hunt
on a **board in Serro**: each hypothesis is a row with its owner, how it was
tested and the evidence. Every agent reads the board before testing anything and
writes back what it proved.

Write to the board on transitions only: a new hypothesis, claiming one, a
verdict.

## The board

One dataset per program; the `investigation` column separates bugs. If it
doesn't exist, give the user this to paste into **Ask Serro** on the program
(answer **All time** if asked for a backfill):

> Create a custom widget called "Investigations" whose rows only people and
> agents fill, with this declared schema:

```json
{
  "columns": [
    {"name": "investigation", "type": "VARCHAR", "maintained_by": "curated", "description": "Short slug for the bug, or its ticket key"},
    {"name": "hypothesis_id", "type": "VARCHAR", "maintained_by": "curated", "description": "Short slug for the hypothesis, unique within the investigation"},
    {"name": "hypothesis", "type": "VARCHAR", "maintained_by": "curated", "description": "One falsifiable sentence"},
    {"name": "status", "type": "VARCHAR", "maintained_by": "curated", "description": "open, testing, ruled_out, confirmed or root_cause"},
    {"name": "test", "type": "VARCHAR", "maintained_by": "curated", "description": "How it was or will be tested"},
    {"name": "evidence", "type": "VARCHAR", "maintained_by": "curated", "description": "What the test showed: output, log line, commit, measurement"},
    {"name": "owner", "type": "VARCHAR", "maintained_by": "curated", "description": "Email of the person whose agent is testing it"},
    {"name": "agent", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "updated_at", "type": "TIMESTAMP", "maintained_by": "curated"}
  ],
  "key": ["investigation", "hypothesis_id"],
  "checks": [
    {"name": "known status", "kind": "sql", "sql": "SELECT investigation, hypothesis_id FROM result WHERE status NOT IN ('open','testing','ruled_out','confirmed','root_cause')"},
    {"name": "verdicts carry evidence", "kind": "sql", "sql": "SELECT investigation, hypothesis_id FROM result WHERE status IN ('ruled_out','confirmed','root_cause') AND (evidence IS NULL OR evidence = '')"},
    {"name": "testing has an owner", "kind": "sql", "sql": "SELECT investigation, hypothesis_id FROM result WHERE status = 'testing' AND (owner IS NULL OR owner = '')"},
    {"name": "owner is a member", "kind": "org_member_email", "column": "owner"}
  ]
}
```

Find it each time: resolve the program (`mcp__serro__list_programs` or
`SERRO-CONTEXT.md`), its `Dataset:` line from `mcp__serro__get_program_widget_data`,
and `mcp__serro__describe_dataset(dataset_id)`. Stop unless `edits` includes
`row_upsert`.

**How every write works.** `mcp__serro__propose_dataset_edit(dataset_id, verb:
"row_upsert", rows)` with the key and only the columns you set; show the user the
change; confirm with `mcp__serro__confirm_dataset_edit` after their yes, or right
away if they already allowed edits to this board (suggest it for the session).
If Serro says the row changed since you looked, re-read it before acting.

## Join an investigation

1. Read the board for it:
   `SELECT hypothesis_id, hypothesis, status, owner, test, evidence FROM ds WHERE investigation = '<slug>' ORDER BY updated_at`.
   For a new bug, pick the slug (the ticket key if there is one) and tell the
   user.
2. Summarise for the user before doing anything: what's confirmed, what's ruled
   out and **why**, what's being tested and by whom, what's open.
3. Don't test anything already `ruled_out` unless you have new evidence that the
   ruling was wrong; then say what's new and re-open it.
4. Add hypotheses the board is missing, as `status: open`. Each is one
   falsifiable sentence with the cheapest test that would kill it. Use Serro
   context for leads: `mcp__serro__search_meetings`, `mcp__serro__search_slack`,
   `mcp__serro__get_program_decisions`, recent PRs (`mcp__serro__search_prs`).

## Test a hypothesis

1. Claim it: upsert `{investigation, hypothesis_id, status: "testing", owner:
   <user's email>, agent: <your app>, test: <plan>, updated_at}`. If Serro
   refuses because the row changed, someone else claimed it: pick another.
2. Run the cheapest decisive test. Prefer one that can only pass if the
   hypothesis is false.
3. Record the verdict: `{..., status: "ruled_out" | "confirmed", evidence: <the
   output, log line or measurement, verbatim and short>, updated_at}`. A
   hypothesis you couldn't settle goes back to `open` with what you learned in
   `evidence`.

**Fanning out.** To attack several hypotheses at once, start a subagent per open
hypothesis; each claims its own row. If Agent Exchange is enabled, they can also
`mcp__serro__program_join` so `program_who` shows who is testing what live, and
share large logs as files under `investigations/<slug>/` with
`mcp__serro__program_fs_write`; the board keeps the verdicts.

## Close it

When a confirmed hypothesis explains every symptom, add one row with
`hypothesis_id: "root-cause"`, `status: "root_cause"`, the explanation in
`hypothesis`, and the proof and fix PR in `evidence`. Then report:

```
INVESTIGATION <slug>
Root cause: <one sentence>   Proof: <evidence>   Fix: <PR>
Ruled out: <hypothesis> (<evidence>), ...
Still open: <anything that wasn't needed but wasn't settled>
```

## Rules

- Read the board before you test anything.
- A verdict without evidence is an opinion. The board refuses it.
- Never overwrite another owner's claim or verdict; add a new hypothesis that
  challenges it instead.
