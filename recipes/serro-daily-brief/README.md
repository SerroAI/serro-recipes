# serro-daily-brief

One digest of what is actually on today — meetings, Jira movement and anything
the program is flagging — pulled live from Serro.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-daily-brief
archon workflow run serro-daily-brief
```

Unlike the review recipes, this one takes no program argument. It runs as
whoever the Serro connection belongs to.

## What it gathers

| Source | Window |
|---|---|
| Meetings | today |
| Jira issues | updated in the last 24 hours |
| Program flags | whatever the program surfaces as worth raising |

Everything comes from the user-scoped `serro` MCP server, and identity is
established by a single `mcp__serro__whoami` call rather than an organization id
passed in — so there is no per-repo MCP config to install and the workflow runs
unchanged from any project. It uses whichever `mcp__serro__*` tools exist in the
run's tool list instead of assuming names, so a renamed tool degrades to a
recorded gap rather than a failed run.

## An empty brief is never invented

This is the part worth understanding before you trust it. If Serro is
unreachable, the gather node returns empty arrays with the exact error in its
notes, and a deterministic `guard` node then fails the run with the fix
instructions. Without that guard an unreachable Serro produces an empty brief,
which reads exactly like a quiet day.

The same distinction holds one level down: a source that genuinely returns
nothing is recorded in the notes and stated in the brief in one line, so
"nothing happened" never gets confused with "the lookup failed".

## Output

`$ARTIFACTS_DIR/daily-brief.md` — under 200 words, time-sensitive items first,
ending with a one-line focus for the day. It is printed to the run log too.

Read-only: no worktree, no changes to your checkout, and nothing posted
anywhere.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- Meetings ingested and Jira connected — the brief only reflects activity Serro
  can actually read

## When not to use it

| You want | Use instead |
|---|---|
| A weekly, program-scoped status report | `serro-digest-builder` |
| Deep research on a single topic | ask the agent directly |
