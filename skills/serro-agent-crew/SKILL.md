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
2. `mcp__serro__describe_dataset(dataset_id)`: columns, types, which are
   `curated`, the key, the checks, `maxRowsPerBatch`.
3. `mcp__serro__program_join(program_id, role: "lead", working_on: "<sweep>",
   agent_label: "lead")`. Keep the `agent_id`.
4. Pick a run id (`crew-<yyyymmdd-hhmm>`) and split the sweep into **3 to 6 areas**
   that don't overlap: one per repo, service group, ticket project or document
   set. More areas than workers is fine; workers take the next free one.
5. Write the plan with `mcp__serro__program_fs_write(program_id, agent_id,
   path: "crew/<run>/plan.md", if_version: 0, content)`. It holds: the dataset
   id, the key and columns every row must set, the checks, the areas (one line
   each), and the row format below. Workers read it; it is the contract.

Row format, one JSON object per line in `rows.jsonl`:

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
3. Gather rows for that area only. One source per value; unknown stays `null`;
   match the column types and checks; every row sets the plan's columns.
4. Write `crew/<run>/areas/<area>/rows.jsonl` with `program_fs_write`
   (`if_version: 0`, the `fence`), and a few lines in `notes.md` beside it: what
   was covered, what was skipped and why.
5. `program_heartbeat` if a step runs longer than a few minutes without other
   program calls (presence drops after 10 minutes of silence).
6. Append one line to `crew/<run>/status.log` with `program_fs_append`
   (`<worker> done <area> <n> rows`), then `program_fs_release`, take the next
   free area or `program_leave`.
7. The worker returns its `agent_id` and the areas it finished to the lead.

## Lead: watch, merge, land

1. Follow progress with `program_fs_changes(program_id, agent_id, wait_s: 25)`
   and `program_who`. An area whose lease expired with no `rows.jsonl` is free
   again: start a new worker for it, or do it yourself.
2. When every area has `rows.jsonl`, read them all and merge by key:
   - Same key, same values: keep one, credit the first worker.
   - Same key, different values: keep the one with the stronger source. If you
     can't tell, leave the value out and list it as a conflict for the user.
   - Drop rows that fail the types or checks you can see, and list them.
3. Write `crew/<run>/merged.md`: counts per worker, conflicts, dropped rows.
4. Tell the user the totals (rows to add and change, per worker), the conflicts,
   and a short sample with sources.
5. Land **one batch per worker**, so History names who found what:
   `mcp__serro__propose_dataset_edit(dataset_id, verb: "row_upsert", rows)` with
   that worker's rows (up to 200; split larger sets), then
   `mcp__serro__confirm_dataset_edit(dataset_id, proposal_id, agent_id: <that
   worker's agent_id>)`. The user approves the first batch in their app and can
   allow the rest for the session. If Serro refuses a batch, it names the
   failing rows and checks: fix or drop them and propose again.
6. Append the outcome to `crew/<run>/status.log` and `program_leave`.

## Report

```
CREW <run> — dataset <name>
worker-1  <area>  +<added> ~<changed>  v<version>
worker-2  <area>  +<added> ~<changed>  v<version>
Conflicts left for you: <n> (see crew/<run>/merged.md)
Dropped: <n> — <reasons>
```

History shows each batch as, for example, "added 40 rows · via worker-2 (Claude
Code)". The crew's files stay in the program's workspace (recent versions are
kept for 7 days), so another agent can pick up where this run stopped.

## Rules

- Never write rows outside your claimed area, and never write without the fence
  of a lease you hold.
- Never invent a value to complete a row. Empty is fine.
- The user approves every dataset change. Don't route around that prompt.
