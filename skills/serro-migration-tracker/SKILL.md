---
name: serro-migration-tracker
description: Run a long migration, upgrade or sweep as a shared board in a Serro dataset that every teammate's agent (or one person's subagents) works from - seed one row per unit (file, package, service), pick the next open row, claim it, do the work, and record branch, PR, status and blockers. The widget is the team's burn-down. Beta. Use when someone says "migrate the rest of X", "pick up the next item in the migration", "how far along is the migration", "seed the migration board", "who is working on what in the upgrade", or names a migration, deprecation, dependency upgrade or codebase-wide sweep.
---

# Serro Migration Tracker (beta)

Long migrations die in the middle: thirty files left, nobody sure which are
claimed, two people fixing the same one, and the PM asking for status in Slack.
This skill keeps the migration on a **board in Serro**, a dataset the whole team
and their agents share. Any agent, in anyone's session, reads the board, takes
the next open unit, and writes back what happened. People watch the widget.

The board is the source of truth. Write to it only on real transitions (claimed,
PR opened, done, blocked), never for progress chatter.

## The board

One dataset per migration, created once in Serro. If it doesn't exist, give the
user this to paste into **Ask Serro** on the program (answer **All time** if asked
for a backfill), with the migration's name filled in:

> Create a custom widget called "Migration: <name>" whose rows only people and
> agents fill, with this declared schema:

```json
{
  "columns": [
    {"name": "unit", "type": "VARCHAR", "maintained_by": "curated", "description": "What gets migrated: a file path, package, service or module"},
    {"name": "area", "type": "VARCHAR", "maintained_by": "curated", "description": "Grouping for ordering and reports, e.g. a directory or team"},
    {"name": "status", "type": "VARCHAR", "maintained_by": "curated", "description": "todo, in_progress, in_review, done, blocked or wont_do"},
    {"name": "owner", "type": "VARCHAR", "maintained_by": "curated", "description": "Email of the person whose agent holds it"},
    {"name": "agent", "type": "VARCHAR", "maintained_by": "curated", "description": "The agent app, e.g. Claude Code"},
    {"name": "branch", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "pr_url", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "blocker", "type": "VARCHAR", "maintained_by": "curated", "description": "Why it is blocked, in one line"},
    {"name": "notes", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "updated_at", "type": "TIMESTAMP", "maintained_by": "curated"}
  ],
  "key": ["unit"],
  "checks": [
    {"name": "known status", "kind": "sql", "sql": "SELECT unit FROM result WHERE status NOT IN ('todo','in_progress','in_review','done','blocked','wont_do')"},
    {"name": "claimed rows have an owner", "kind": "sql", "sql": "SELECT unit FROM result WHERE status IN ('in_progress','in_review','done') AND (owner IS NULL OR owner = '')"},
    {"name": "blocked rows say why", "kind": "sql", "sql": "SELECT unit FROM result WHERE status = 'blocked' AND (blocker IS NULL OR blocker = '')"},
    {"name": "in review has a PR", "kind": "sql", "sql": "SELECT unit FROM result WHERE status = 'in_review' AND (pr_url IS NULL OR pr_url = '')"},
    {"name": "owner is a member", "kind": "org_member_email", "column": "owner"}
  ]
}
```

## Every time: find the board

1. Resolve the program (`mcp__serro__list_programs`, or `SERRO-CONTEXT.md`).
2. `mcp__serro__get_program_widget_data` shows each widget's `Dataset:` line.
   Pick the migration's board; if several could match, ask.
3. `mcp__serro__describe_dataset(dataset_id)`. Stop unless `edits` includes
   `row_upsert` (tell the user the `rowEditsBlocked` reason).
4. Suggest the user allows edits to this board for the session when Serro first
   asks them to approve one: the board takes several small writes.

**How every write works.** `mcp__serro__propose_dataset_edit(dataset_id, verb:
"row_upsert", rows)` with the key and **only the columns you are changing**, then
show the user the change and confirm with `mcp__serro__confirm_dataset_edit`
after their yes (right away if they already allowed edits to this board). Never
send `null` over a value someone else wrote. If Serro says the row changed since
you looked, someone else got there first: re-read it and act on what it says now.

Times are UTC in ISO 8601, for example `date -u +%Y-%m-%dT%H:%M:%SZ`; Serro
refuses other offsets.

**Claiming safely.** Serro only refuses a confirm when the row changed *after*
your proposal, so check the proposal itself: its preview lists each changed
column with its `before` value. Confirm a claim only when the preview shows
`status` changing **from `todo`**. If `status` isn't in the changes, or its
`before` is anything else, someone claimed it between your read and your
proposal: don't confirm (the proposal simply expires) and take another unit.
Do this even when edits to the board are allowed without asking.

**Reading the whole board.** `mcp__serro__query_dataset` returns at most 200 rows
(50 by default). To read everything, pass `limit: 200` and page in the SQL with
a stable order: `... ORDER BY unit LIMIT 200 OFFSET <0, 200, 400, ...>`, until a
page comes back with fewer than 200 rows. Don't stop on `truncated`: it only
describes one page. To check specific units, ask `WHERE unit IN (...)` instead.

## Seed the board

When the user starts a migration:

1. Find every unit with a command they can re-run, for example
   `rg -l "from '@radix-ui/themes'" src`. Say the command in the report and in
   `notes` of the first row, so the next seed finds the same set.
2. Find which of those units are already on the board, by asking in chunks
   (`SELECT unit FROM ds WHERE unit IN ('a', 'b', ...)`), never from one
   unpaged read. Add only units that aren't there, as `status: todo` with an
   `area`, in batches of up to 200.
3. Before confirming a seed batch, check its preview: it must only add rows
   (`updates: 0`). If it would change any existing row, something was missed in
   step 2: don't confirm; re-check those units.
4. Units on the board that the command no longer finds and that are still
   `todo`: list them and ask before marking them `done` or `wont_do`.

## Pick up the next unit

1. Query the open work, oldest area first:
   `SELECT unit, area, notes FROM ds WHERE status = 'todo' ORDER BY area, unit LIMIT 10`.
   Respect a unit or area the user names.
2. Claim it: upsert `{unit, status: "in_progress", owner: <user's email>, agent:
   <your app and, for a subagent, its name, e.g. "Claude Code / worker-2">,
   updated_at: <now>}`, and confirm only as described in **Claiming safely**.
   If the claim isn't clean, or Serro refuses it, take the next unit.
3. Do the migration for that unit only, in a branch. Run the checks the repo
   uses.
4. When the PR is open: upsert `{unit, status: "in_review", branch, pr_url,
   updated_at}`. When it merges (or the user says so): `{unit, status: "done",
   updated_at}`.
5. If you can't finish: `{unit, status: "blocked", blocker: "<one line>",
   updated_at}`, or release it back with `{unit, status: "todo", owner: null,
   agent: null, updated_at}` when it's simply not done. Clearing your own claim
   is the one time `null` is right.

**Fanning out.** One person can run several units at once: start a subagent per
unit, each claiming its own row the same way and checking its proposal before
confirming, so two agents never both take the same `todo` row. If Agent Exchange is enabled,
the lead may also `mcp__serro__program_join` and have each subagent join, so
`program_who` shows who is on what live; the board stays the record.

## Status

`SELECT status, count(*) FROM ds GROUP BY status`, plus by `area`. Then flag:

- **Stale claims:** `in_progress` with `updated_at` older than a day and no
  `pr_url`. Name the owner; don't take their unit without asking.
- **Blocked:** each `blocker`, grouped. Blockers that repeat are the real
  migration problem.
- **In review too long:** `in_review` older than three days.

```
MIGRATION <name>: <done>/<total> done, <in_progress> in progress, <in_review> in review, <blocked> blocked
Stale: <unit> (<owner>, since <date>)
Blocked: <blocker> (<n> units)
Next up: <units>
```

## Rules

- One unit per claim. Don't migrate units you haven't claimed.
- Never overwrite another owner's claim or clear their values; ask them.
- The board records facts: a PR link, a blocker, a status. Not progress notes.
