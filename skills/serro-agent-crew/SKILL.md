---
name: serro-agent-crew
description: Split a large sweep (repos, services, ticket projects, documents) across several subagents that coordinate through the program's Serro Agent Exchange workspace, then merge their findings into a Serro dataset as approved batches, each credited to the worker that found it. Beta. Use when someone asks to "fan out", "split this across agents", "have several agents fill the dataset", "sweep every repo/service and put it in Serro", or when one agent filling a dataset would take too long.
---

# Serro Agent Crew (beta)

Some datasets are too big for one agent in one pass: every service's owner and
on-call, every open commitment across five ticket projects, every dependency in
a monorepo. This skill makes you the **lead** of a small crew. You split the work
into areas, your subagents each take one, and they coordinate through the
program's **Agent Exchange**: a shared, versioned workspace in Serro with
presence (who is working on what) and leases (who owns which path). You merge
their rows and land them in the dataset, crediting each worker in the dataset's
History.

Beta: this needs Agent Exchange and datasets enabled for the workspace, a dataset
that already exists (you cannot create one over MCP), and contributor access to
the program. It works best in a runtime with subagents (Claude Code, Codex). If
yours has none, run the areas yourself one after another with the same protocol.

## Lead: set up

1. Resolve the program (`mcp__serro__list_programs`, or `SERRO-CONTEXT.md`) and
   the dataset (`mcp__serro__get_program_widget_data` shows `Dataset:` lines). If
   more than one dataset could match, ask.
2. `mcp__serro__describe_dataset(dataset_id)`: `keyColumns`, `columns` and their
   types (on a declared dataset, each says whether it is `source` or `curated`),
   `refresh` and `rules`, the `checks`, `edits` and `maxRowsPerBatch`.
   **Stop unless `edits` includes `row_upsert`**: tell the user the
   `rowEditsBlocked` reason and start no workers. If `refresh` is `keeps_rows` on
   an undeclared dataset, tell the user the crew's values last only until a
   refresh returns those rows again.
3. Read the current rows with `mcp__serro__get_dataset` (page through them) or
   `mcp__serro__query_dataset`, so you know which keys already exist.
4. `mcp__serro__program_join(program_id, role: "lead", working_on: "<sweep>",
   agent_label: "lead")`. Keep the `agent_id`.
5. Pick a run id (`crew-<yyyymmdd-hhmm>`) and split the sweep into **3 to 6 areas**
   that don't overlap: one per repo, service group, ticket project or document
   set. More areas than workers is fine; workers take the next free one.
6. Write the plan with `mcp__serro__program_fs_write(program_id, agent_id,
   path: "crew/<run>/plan.md", if_version: 0, content)`. It holds: the dataset
   id, the key and the columns the crew fills, their types, the checks, the areas
   (one line each), and the row format below. Workers read it; it is the contract.

Row format, one JSON object per line in `rows.jsonl`. A row carries the key and
**only the columns the worker found a value for**, each with its source:

```json
{"row": {"<key col>": "…", "<col>": "…"}, "sources": {"<col>": "<file:line | ticket | meeting>"}}
```

## Workers: one area each

Start one subagent per area (up to the number of areas, at most 6). Give each the
program id, the run id, its worker name (`worker-1`, `worker-2`, …) and these
steps:

1. `program_join(program_id, role: "worker", working_on: "<area>",
   agent_label: "worker-N")`. Keep its own `agent_id`.
2. Read `crew/<run>/plan.md` and `crew/<run>/status.log`. Skip areas that are
   already done (listed in the log, or with a `rows.jsonl`). Take one nobody holds:
   `program_fs_claim(program_id, agent_id, path: "crew/<run>/areas/<area>/",
   ttl_s: 1800)` and keep the `fence`. `lease_held` means another worker has it;
   take the next one.
3. **Call `program_heartbeat` at least every 10 minutes while you hold the
   lease**, whatever other program calls you make. Only a heartbeat renews the
   lease; other calls just keep you present.
4. Gather rows for that area only. One source per value; leave out a column you
   found nothing for (never write a guess, and never `null` it); match the column
   types and checks; keys exactly as the dataset holds them.
5. Write `crew/<run>/areas/<area>/rows.jsonl` with `program_fs_write`
   (`if_version: 0`, the `fence`), and a few lines in `notes.md` beside it: what
   was covered, what was skipped and why. If a write returns `stale_fence` or
   `lease_held`, your lease lapsed: re-claim the area with your fence; if another
   worker holds it now, stop and report that to the lead instead of writing.
6. Append one line to `crew/<run>/status.log` with `program_fs_append`
   (`<worker> done <area> <n> rows`), then `program_fs_release`, take the next
   free area or `program_leave`.
7. The worker returns its `agent_id` and the areas it finished to the lead.

## Lead: watch, merge, land

1. Follow progress with `program_fs_changes(program_id, agent_id, wait_s: 25)`
   and `program_who`, and `program_heartbeat` your own presence. An area whose
   lease expired with no `rows.jsonl` is free again: start a new worker for it,
   or do it yourself.
2. When every area has `rows.jsonl`, read them all and merge by key, so **each
   key ends up in exactly one row**:
   - Same key from several workers: combine their columns into one row, and
     credit it to the worker who found most of it.
   - Same key, same column, different values: keep the one with the stronger
     source. If you can't tell, leave that column out of the row and list it as
     a conflict for the user.
   - Drop rows that fail the types or checks you can see, and list them.
3. Build the batches. **Every row in a batch sets the same columns, and a `null`
   clears a cell**, so never pad a row with values nobody found:
   - Group each worker's rows by the exact columns they set; each group is one
     batch. A worker can have several.
   - Never copy a current value into a batch. Values read back may be clipped
     (long cells come back cut at 1,000 characters) or stale by the time the
     batch applies.
   - A new row may leave out columns; they start empty.
4. Write `crew/<run>/merged.md`: counts per worker, conflicts, dropped rows.
5. Land the batches, each credited to its worker, so History names who found
   what. For each:
   `mcp__serro__propose_dataset_edit(dataset_id, verb: "row_upsert", rows)` (up
   to 200 rows; split larger sets). If Serro refuses it, it names the failing
   rows and checks: fix or drop them and propose again. Check what each
   proposal returned: every changed cell should be one the crew meant to change;
   if anything else changes, stop and find out why.
6. Show the user what the proposals returned: rows added and changed per worker,
   the changes as a before → after sample with sources, and the conflicts. Ask
   whether to apply them, and **wait for their answer**. Don't propose and
   confirm in the same turn, unless a result says the user already allowed edits
   to this dataset without asking.
7. When they say yes, confirm each batch with that worker's id:
   `mcp__serro__confirm_dataset_edit(dataset_id, proposal_id, agent_id: <that
   worker's agent_id>)`. Their app may also ask them to approve, and can offer to
   allow the rest for the session. A proposal expires after an hour; if one
   expired, propose it again. If Serro says a row changed since you looked,
   someone else edited it: re-read it, and if it now holds a value different
   from the one you were about to replace, show the user before proposing again.
8. Append the outcome to `crew/<run>/status.log` and `program_leave`.

## Report

Use what each confirm returned; don't name version numbers.

```
CREW <run> — dataset <name>
worker-1  <area>  <Serro's summary, e.g. "added 6 rows and changed 18">
worker-2  <area>  <Serro's summary>
Conflicts left for you: <n> (see crew/<run>/merged.md)
Dropped: <n> — <reasons>
```

History shows each batch as, for example, "added 40 rows · via worker-2 (Claude
Code)". The crew's files stay in the program's workspace (recent versions are
kept for 7 days), so another agent can pick up where this run stopped.

## Rules

- Never write rows outside your claimed area, and never write without the fence
  of a lease you hold.
- Never invent a value to complete a row, never copy one in to pad a batch, and
  never clear a value that is there.
- The user approves every dataset change. Don't route around that.
