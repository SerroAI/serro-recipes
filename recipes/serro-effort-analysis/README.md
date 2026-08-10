# serro-effort-analysis

Where engineering effort actually went over a window, split four ways, per
engineer and per workstream.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-effort-analysis
archon workflow run serro-effort-analysis "last quarter, Checkout Revamp"
```

## The four categories

| Code | Category | Covers |
|---|---|---|
| `NC` | New capabilities | feature and delivery work |
| `KTLO` | Keep-the-lights-on | incidents, bug fixes, ops maintenance |
| `IP` | Internal productivity | planning, spikes, tooling, dev experience |
| `QI` | Quality improvement | hardening, tech debt, reliability |

## What it reads

Jira issues worked, with type, assignee and status changes; PRs and commits by
author; code churn per author where available; a work-mix CSV if one exists, for
its existing distribution; and programs and their activity, to map work onto
workstreams.

Every Serro call is a read. The workflow never writes back.

## Output

`$ARTIFACTS_DIR/effort-analysis.md`, containing the overall split as
percentages, a per-engineer breakdown, a per-workstream breakdown, two or three
observations a program lead could act on, and — importantly — a data-confidence
note separating what was directly sourced from what was inferred.

That last section is the one to read first. A four-way percentage split looks
equally authoritative whether it rests on complete data or on a third of it, so
the report states its own basis. If a source came back empty, that folds into the
confidence note rather than becoming a percentage the data cannot support.

Read-only: no worktree, no changes to your checkout, and nothing posted anywhere.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- A time window to analyse, in the run message
- Jira connected — the classification leans heavily on issue activity

## Notes

- Per-engineer numbers are approximations with a stated basis, not timesheets.
  Treat them as a distribution, not an evaluation.
- Scope resolves from the run message, then `SERRO_PROGRAM`, then a repo-name
  match. If none resolve it analyses the whole window and says so.
