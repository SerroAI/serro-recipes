# serro-digest-builder

A week of program activity — meetings, Jira movement, Slack discussion, open
risks — condensed into something someone will actually read.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-digest-builder
archon workflow run serro-digest-builder "Checkout Revamp"
```

The weekly, program-scoped counterpart to `serro-daily-brief`. Where the brief is
your day and your identity, this is a program and its last seven days.

## What it gathers

| Source | Window |
|---|---|
| Meetings | last 7 days, with titles, dates and key points |
| Jira issues | created or updated in the window |
| Slack | notable discussion |
| Program status | risks worth flagging |

## How the program gets resolved

In this order, stopping at the first that resolves:

1. a program name or id in the run message
2. the `SERRO_PROGRAM` environment variable
3. the current repository's name matched against each program's linked
   repositories

If none resolve it covers overall activity for your identity instead and records
in its notes that the digest is unscoped — rather than picking a program and
producing a digest about the wrong thing.

## An empty digest is never invented

If Serro is unreachable, the gather node returns empty arrays with the exact
error in its notes, and a deterministic `guard` node fails the run. Without it an
unreachable Serro produces an empty digest, which reads exactly like a quiet
week.

A source that genuinely returns nothing is stated in one line instead of padded,
so "nothing happened" stays distinguishable from "the lookup failed".

## Output

`$ARTIFACTS_DIR/weekly-digest.md` — under 400 words, structured as TL;DR,
Meetings, Jira movement, Slack highlights, Risks to watch, with anything blocking
or time-sensitive first.

Read-only: no worktree, no changes to your checkout, and nothing posted anywhere.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- A resolvable program, or acceptance of an unscoped digest
- Jira and Slack connected for those sections — it reports which sources came
  back empty

## When not to use it

| You want | Use instead |
|---|---|
| Today, scoped to you | `serro-daily-brief` |
| Deep research on a single topic | ask the agent directly |
