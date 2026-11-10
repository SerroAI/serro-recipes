---
name: serro-release-ledger
description: Keep a release's readiness as a shared ledger in Serro - one row per PR with its verdict, blockers, evidence and the commit it was assessed at - so any agent can record a PR's readiness, "is the release ready" becomes a query instead of re-checking every PR, stale verdicts are caught when a PR changes, and the team sees release state in a widget. Beta. Use when someone asks "is release X ready", "what's blocking the release", "assess this PR for the release", "record this PR in the release ledger", "what changed since we checked", or is preparing a release cut.
---

# Serro Release Ledger (beta)

Release readiness gets re-derived from scratch every time someone asks: each
agent re-reads every PR, re-runs the same checks, and the answer lives in one
chat. This skill keeps one row per PR in a **ledger in Serro**: its verdict, what
blocks it, the evidence, and the exact commit it was assessed at. Any agent adds
or refreshes rows; anyone asks "is it ready" and gets an answer from the ledger,
re-checking only what changed.

## The ledger

One dataset per program; the `release` column separates releases. If it doesn't
exist, give the user this to paste into **Ask Serro** on the program (answer
**All time** if asked for a backfill):

> Create a custom widget called "Release ledger" whose rows only people and
> agents fill, with this declared schema:

```json
{
  "columns": [
    {"name": "release", "type": "VARCHAR", "maintained_by": "curated", "description": "Release name or version, e.g. 2026.11.2"},
    {"name": "pr", "type": "VARCHAR", "maintained_by": "curated", "description": "owner/repo#number"},
    {"name": "title", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "author", "type": "VARCHAR", "maintained_by": "curated", "description": "PR author's email when known"},
    {"name": "verdict", "type": "VARCHAR", "maintained_by": "curated", "description": "ready, needs_work, blocked or excluded"},
    {"name": "risk", "type": "VARCHAR", "maintained_by": "curated", "description": "low, medium or high"},
    {"name": "blockers", "type": "VARCHAR", "maintained_by": "curated", "description": "What must happen before it ships, one per line"},
    {"name": "evidence", "type": "VARCHAR", "maintained_by": "curated", "description": "Checks, tests, reviews and Serro context the verdict rests on"},
    {"name": "head_sha", "type": "VARCHAR", "maintained_by": "curated", "description": "The PR head commit the verdict was assessed at"},
    {"name": "merged", "type": "BOOLEAN", "maintained_by": "curated"},
    {"name": "assessed_at", "type": "TIMESTAMP", "maintained_by": "curated"},
    {"name": "assessed_by", "type": "VARCHAR", "maintained_by": "curated", "description": "Email of whose agent assessed it"}
  ],
  "key": ["release", "pr"],
  "checks": [
    {"name": "known verdict", "kind": "sql", "sql": "SELECT release, pr FROM result WHERE verdict NOT IN ('ready','needs_work','blocked','excluded')"},
    {"name": "known risk", "kind": "sql", "sql": "SELECT release, pr FROM result WHERE risk IS NOT NULL AND risk NOT IN ('low','medium','high')"},
    {"name": "blocked says why", "kind": "sql", "sql": "SELECT release, pr FROM result WHERE verdict IN ('blocked','needs_work') AND (blockers IS NULL OR blockers = '')"},
    {"name": "assessed at a commit", "kind": "sql", "sql": "SELECT release, pr FROM result WHERE verdict <> 'excluded' AND (head_sha IS NULL OR length(head_sha) < 7)"},
    {"name": "assessor is a member", "kind": "org_member_email", "column": "assessed_by"}
  ]
}
```

Find it each time: resolve the program (`mcp__serro__list_programs` or
`SERRO-CONTEXT.md`), its `Dataset:` line from `mcp__serro__get_program_widget_data`,
and `mcp__serro__describe_dataset(dataset_id)`. Writing needs `row_upsert` in
`edits`.

**How every write works.** `mcp__serro__propose_dataset_edit(dataset_id, verb:
"row_upsert", rows)` with the key and only the columns you set (up to 200 rows);
show the user the verdicts; confirm with `mcp__serro__confirm_dataset_edit` after
their yes, or right away if they already allowed edits to this ledger. If Serro
says a row changed since you looked, another agent assessed it meanwhile: re-read
and keep the newer assessment unless yours is at a newer commit.

Times are UTC in ISO 8601, for example `date -u +%Y-%m-%dT%H:%M:%SZ`; Serro
refuses other offsets.

**Live GitHub is required** for an assessment: the head commit, checks, review
decision and mergeability must be read live, with the `gh` CLI (or the GitHub
API or a GitHub connector). Serro's `mcp__serro__search_github` (`result_type:
"prs"`) is good for finding PRs and their context, but it doesn't give live head
commits or check results; if you have nothing live, say so and stop rather than
writing verdicts.

**Reading the whole ledger.** `mcp__serro__query_dataset` returns at most 200
rows (50 by default) and says `truncated` when there are more. Page with
`LIMIT` and `OFFSET` until it isn't before deciding a PR is missing.

## Assess a PR

1. Get the PR live: `gh pr view <n> --json number,title,author,headRefOid,mergeable,statusCheckRollup,reviewDecision,files`.
2. Judge it on evidence, not on the description:
   - **CI and tests:** failing or missing checks; tests for the changed behavior.
   - **Review:** approved, changes requested, or unreviewed.
   - **Serro context:** open risks touching it (`mcp__serro__get_program_widget_data`
     `widget_type: risk_log`), customer asks it affects (`customer_requirements`),
     and decisions it contradicts (`mcp__serro__get_program_decisions`).
   - **Migrations, flags, config:** anything that must be done in order at deploy.
3. Verdict: `ready`, `needs_work` (fixable before the cut), `blocked` (needs
   someone else or a decision), or `excluded` (not going in this release). Risk:
   low, medium or high, with one line on why.
4. Upsert `{release, pr, title, author, verdict, risk, blockers, evidence,
   head_sha, merged, assessed_at, assessed_by}`. Keep `evidence` short and
   checkable: check names, test files, risk ids, decision ids.

## Is the release ready?

1. Get **all** the release's PRs from the user's definition, merged ones
   included: a milestone or label
   (`gh pr list --state all --limit 1000 --search "milestone:<x>"`; if it returns
   the limit, narrow the search and repeat), a commit range between the last
   release tag and the branch to cut, or a list.
2. Read the ledger for the release, paged until not `truncated`:
   `SELECT * FROM ds WHERE release = '<release>' ORDER BY pr LIMIT 200 OFFSET <n>`.
3. Refresh the live state of **every** PR in the release (head commit, checks,
   review decision, mergeability): it's cheap, and a verdict can go stale at the
   same commit when CI is re-run or a reviewer requests changes.
4. Work out what needs assessing, and only assess those:
   - **missing:** in the release, not in the ledger
   - **stale:** the PR's current head commit isn't the ledger's `head_sha`
   - **worse since:** same commit, but checks now fail, changes were requested,
     or it no longer merges cleanly: re-assess, never report the old `ready`
   - **dropped:** in the ledger, no longer in the release (mark `excluded`, ask
     first)
5. Assess those PRs as above (subagents can take one PR each; the ledger takes
   all their rows) and write them back in one batch.
6. Report:

```
RELEASE <release>: GO | NO-GO
<n> ready, <n> needs work, <n> blocked, <n> excluded   (<n> re-assessed this run)
Blocking:
  <pr> <title>: <blockers>  (risk <r>)
High risk but ready:
  <pr> <title>: <why>
```

NO-GO when anything in the release is `blocked` or `needs_work`. Say which rows
you assessed now and which you trusted from the ledger.

## Rules

- A verdict is tied to a commit. A newer commit makes it stale; never report a
  stale verdict as current.
- Don't overwrite another agent's assessment at the same commit unless you found
  something it missed; then say what.
- The ledger doesn't merge or deploy anything.
