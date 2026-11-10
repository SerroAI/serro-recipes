---
name: serro-eval-log
description: Record every eval or benchmark run (suite, model, prompt version, commit, score, pass count, cost, latency) in a shared Serro dataset, so any agent or teammate can compare a run with the baseline, catch regressions before merging a prompt or model change, and answer "which model or prompt is best" with a query instead of digging through terminals. Beta. Use after running an eval suite or benchmark, when someone asks "did this prompt change regress", "compare with the baseline", "which model scores best on X", "log this eval run", or before merging a change to prompts, models or retrieval.
---

# Serro Eval Log (beta)

Eval results usually live in one person's terminal scrollback, so nobody can say
whether today's prompt is better than last week's or which model run set the
baseline. This skill writes each run as a row in an **eval log in Serro**, a
dataset every teammate's agent appends to and reads, with the team watching
trends in the widget.

## The log

One dataset per program. If it doesn't exist, give the user this to paste into
**Ask Serro** on the program (answer **All time** if asked for a backfill):

> Create a custom widget called "Eval log" whose rows only people and agents
> fill, with this declared schema:

```json
{
  "columns": [
    {"name": "run_id", "type": "VARCHAR", "maintained_by": "curated", "description": "<suite>-<yyyymmddThhmmssZ>-<short sha>-<6 random hex>"},
    {"name": "suite", "type": "VARCHAR", "maintained_by": "curated", "description": "Eval suite or benchmark name"},
    {"name": "model", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "prompt_version", "type": "VARCHAR", "maintained_by": "curated", "description": "Prompt file hash, version tag or branch"},
    {"name": "git_sha", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "score", "type": "DOUBLE", "maintained_by": "curated", "description": "The suite's headline metric"},
    {"name": "passed", "type": "BIGINT", "maintained_by": "curated"},
    {"name": "total", "type": "BIGINT", "maintained_by": "curated"},
    {"name": "cost_usd", "type": "DOUBLE", "maintained_by": "curated"},
    {"name": "p50_latency_ms", "type": "DOUBLE", "maintained_by": "curated"},
    {"name": "baseline", "type": "BOOLEAN", "maintained_by": "curated", "description": "True for the run others are compared with"},
    {"name": "notes", "type": "VARCHAR", "maintained_by": "curated", "description": "What changed in this run, and failures worth reading"},
    {"name": "run_at", "type": "TIMESTAMP", "maintained_by": "curated"},
    {"name": "run_by", "type": "VARCHAR", "maintained_by": "curated", "description": "Email of whose agent ran it"}
  ],
  "key": ["run_id"],
  "checks": [
    {"name": "passed within total", "kind": "sql", "sql": "SELECT run_id FROM result WHERE passed IS NOT NULL AND total IS NOT NULL AND (passed < 0 OR passed > total)"},
    {"name": "non-negative cost", "kind": "sql", "sql": "SELECT run_id FROM result WHERE cost_usd < 0 OR p50_latency_ms < 0"},
    {"name": "suite and model named", "kind": "sql", "sql": "SELECT run_id FROM result WHERE suite IS NULL OR suite = '' OR model IS NULL OR model = ''"},
    {"name": "runner is a member", "kind": "org_member_email", "column": "run_by"}
  ]
}
```

Find it each time: resolve the program (`mcp__serro__list_programs` or
`SERRO-CONTEXT.md`), its `Dataset:` line from `mcp__serro__get_program_widget_data`,
and `mcp__serro__describe_dataset(dataset_id)`. Writing needs `row_upsert` in
`edits`.

## Log a run

1. Run the suite the way the repo does (or use the output the user just got).
   Read the numbers from the tool's output or results file, never from memory.
2. Make the `run_id` unique even when teammates run the same suite at the same
   commit in the same second: `<suite>-<UTC yyyymmddThhmmssZ>-<short sha>-<6
   random hex>` (for example from `openssl rand -hex 3`).
   Fill what you can: `suite`, `model`, `prompt_version` (a hash of the
   prompt files, or the tag), `git_sha`, `score`, `passed`/`total`, `cost_usd`,
   `p50_latency_ms`, `run_at`, `run_by`, and `notes` (what this run changes, and
   the failures worth reading). Leave out what the output doesn't give you.
3. Compare before writing:
   `SELECT * FROM ds WHERE suite = '<suite>' AND (baseline OR run_at >= now() - INTERVAL 14 DAY) ORDER BY run_at DESC`.
4. Upsert the row: `mcp__serro__propose_dataset_edit(dataset_id, verb:
   "row_upsert", rows: [<run>])`; show the user the row and the comparison;
   confirm with `mcp__serro__confirm_dataset_edit` after their yes, or right away
   if they already allowed edits to this log. The preview must show the row as
   added; if it would change an existing run, the `run_id` collided: make a new
   one.

   Times are UTC in ISO 8601, for example `date -u +%Y-%m-%dT%H:%M:%SZ`; Serro
   refuses other offsets.

```
EVAL <suite> — <model>, prompt <version> @ <sha>
score <s> (baseline <b>, <+/-delta>)   passed <p>/<t>   cost $<c>   p50 <ms> ms
Verdict: BETTER | SAME (within noise) | WORSE
Newly failing: <cases, if the output names them>
```

Call it SAME when the difference is within the spread of recent runs of the
same configuration; one run is noisy. Say how many runs you compared with.

## Set the baseline

Only when the user says so. Find the current one first
(`SELECT run_id FROM ds WHERE suite = '<suite>' AND baseline`), then upsert both in
one batch: `{run_id: <new>, baseline: true}` and `{run_id: <old>, baseline:
false}`. Keep one baseline per suite: Serro's checks only see the rows in a
batch, so this is on you:

- Confirm only when the preview shows the old run's `baseline` changing **from
  true**. If it isn't in the changes, someone moved the baseline after you
  looked: don't confirm; query again and start over.
- After confirming, query `SELECT run_id FROM ds WHERE suite = '<suite>' AND
  baseline`. If more than one comes back, tell the user which runs and ask
  which should keep it.

## Answer questions from the log

- "Which model is best on <suite>?": `SELECT model, avg(score), count(*) FROM ds
  WHERE suite = '<suite>' GROUP BY model ORDER BY 2 DESC`.
- "Did the prompt change regress?": the latest run for the new
  `prompt_version` against the baseline and recent runs.
- "What does a point of score cost?": score against `cost_usd` per model.

Always say how many runs an answer rests on.

## Rules

- Numbers come from the run's output, verbatim. Never estimate a score.
- Don't change past runs except `baseline` and `notes`.
- Before recommending a merge of a prompt or model change, compare with the
  baseline in this log.
