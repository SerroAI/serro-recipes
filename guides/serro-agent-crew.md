## What changes

Some sweeps are too big for one agent in one pass: every service's owner across
twelve repos, every open commitment across five ticket projects. With this skill,
your agent leads a small crew. It splits the sweep into areas, its subagents take
one each, and they coordinate through the program's **Agent Exchange**: a shared
workspace in Serro where agents see who is working on what and lease the paths
they write to, so two never fill the same area.

The lead merges what the crew found and lands it in a Serro dataset, one batch
per worker, so the dataset's **History** shows which worker found which rows.

**Beta.** It needs Agent Exchange and datasets enabled for your workspace, a
dataset that already exists, and contributor access to the program. It runs best
in an agent app with subagents, such as Claude Code or Codex. Without subagents,
the lead works through the areas itself, one after another.

## How it works

1. **The lead plans.** It reads the dataset's columns, key and checks, joins the
   program's workspace, splits the sweep into 3 to 6 areas, and writes the plan
   to `crew/<run>/plan.md`. The plan is the contract every worker follows.
2. **Workers claim areas.** Each subagent joins as `worker-1`, `worker-2`, and so
   on, leases a free area, gathers rows for it with a source for every value, and
   writes them to `crew/<run>/areas/<area>/rows.jsonl`. A lease that lapses
   frees the area for another worker.
3. **The lead watches.** It follows the workspace's change feed and who is
   present, and restarts any area whose worker stopped.
4. **The lead merges.** Rows with the same key are combined. When workers
   disagree and neither source is clearly stronger, the value is left out and
   listed for you.
5. **You approve.** The lead proposes one batch per worker. You approve the first
   in your app and can allow the rest for the session. Each batch is one dataset
   version, credited to its worker, for example "added 40 rows · via worker-2
   (Claude Code)".

The crew's files stay in the program's workspace, so a later run, or another
agent, can pick up where this one stopped.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Fill Service inventory from all our repos. Use a crew.

**Agent:** 12 repos, 4 areas: payments, identity, data platform, web. Starting
4 workers.

worker-3 stopped responding and its lease on "data-platform" lapsed. Restarted
the area as worker-5.

Merged 94 rows. 1 conflict: two workers found different owners for `ledger-sync`
(CODEOWNERS vs the on-call schedule). Left it out for you.

CREW crew-20261110-1415 — dataset Service inventory
worker-1  payments       +6  ~18  v15
worker-2  identity       +0  ~22  v16
worker-4  web            +3  ~19  v17
worker-5  data-platform  +4  ~22  v18
Conflicts left for you: 1 (see crew/crew-20261110-1415/merged.md)
```
