---
name: serro-dataset-fill
description: Fill or update rows of a Serro program dataset from evidence your agent can reach (the repo, tickets, docs, meetings), checked against the dataset's declared columns, key and quality checks, and applied in batches the user approves. Beta. Use when someone asks to "fill the dataset", "populate this table", "add these to the Serro dataset", "backfill the owner column", "update the tracker in Serro from the repo", or names a dataset and a source to fill it from.
---

# Serro Dataset Fill (beta)

Tool names below assume the Serro MCP server is registered as `serro`. If yours
has another name (on Serro's staging, `serro-staging`), use that prefix instead:
`mcp__serro-staging__list_programs` for `mcp__serro__list_programs`, and so on.

A Serro dataset is a versioned table behind a program widget: a service
inventory, a commitment tracker, an ownership map. Some of its columns are filled
by Serro's refresh. Others are **curated**: only people and agents fill them, and
a refresh never overwrites them. Those curated columns are usually empty because
nobody has had time to fill them. You can reach the evidence that fills them.

Your job: **find the dataset, learn its rules, gather rows with a source for every
value, and land them in batches the user approves.** Never guess a value to make
a row look complete.

Beta: this needs datasets enabled for the workspace and a dataset that already
exists. You cannot create one over MCP. If none fits, tell the user to create it
in Serro first (a widget with a declared dataset, or **Create dataset** from a
widget's table), then stop.

## 1. Find the dataset

1. Resolve the program: `mcp__serro__list_programs`, or `SERRO-CONTEXT.md` if
   you are in a repo.
2. `mcp__serro__get_program_widget_data` lists the program's widgets. A widget
   backed by a dataset shows a `Dataset:` line with its id.
3. If more than one dataset could match, ask the user which one. Do not pick.

## 2. Learn its rules, and check you can write

Call `mcp__serro__describe_dataset(dataset_id)`. It returns:

- `keyColumns`: the column or columns that name a row
- `columns` with their types. On a dataset with a declared schema
  (`declared: true`), each column also says who maintains it: `source` (Serro's
  refresh fills it) or `curated` (only people and agents do)
- `refresh` and `rules`: how a refresh treats your edits
- `checks` (and `memberChecks`): what every row must pass, for example "owner is
  the email of someone in the organization"
- `edits`: the edits you may make now, and `maxRowsPerBatch` (200)

**Stop here unless `edits` includes `row_upsert`.** Tell the user the
`rowEditsBlocked` reason in their words (no edit access, no key, or a dataset
every refresh rebuilds) and don't gather anything.

Read what `refresh` means for your edits:

- `manual`: nothing refreshes it; edits last.
- `keeps_rows`: an edit lasts until a refresh returns that key again; then the
  source's values replace the source-maintained columns. On a declared dataset,
  curated columns are never replaced, so prefer them. On an undeclared one, say
  that your values last only until the next refresh returns those rows.

Then read what is already there: `mcp__serro__get_dataset` for a page of rows
and a per-column profile, or `mcp__serro__query_dataset` with one read-only SQL
SELECT (for example, which keys have an empty `owner`). Note which keys already
exist and what their cells hold now.

## 3. Gather rows

Use whatever evidence fits the dataset: the repository (CODEOWNERS, manifests,
config, git history), Serro's tools (`mcp__serro__search_jira`,
`mcp__serro__search_meetings`, `mcp__serro__get_program_decisions`,
`mcp__serro__search_slack`), and docs the user points you to.

- **One source per value.** Keep a note of where each value came from (a file
  and line, a ticket, a meeting). You report it at the end.
- **Never guess.** A plausible guess is a defect someone will trust later.
- **Match the types and checks yourself first.** Dates as ISO dates, emails as
  real organization emails (`mcp__serro__search_people` or the dataset's
  existing values), enums spelled exactly as existing rows spell them. Keys
  exactly as the dataset holds them.

**Every row in a batch sets the same columns, and a `null` clears a cell.** So
only ever send values you found, and never pad a row with values you didn't:

- **Group rows by the columns they set.** Rows where you found `owner` and
  `runbook` go in one batch; rows where you found only `owner` go in another,
  with just the key and `owner`. Never copy a current value into a batch: the
  values you read may be clipped (long cells come back cut at 1,000 characters)
  or stale by the time the batch applies.
- A **new row** may leave out columns you have no source for; they start empty.
- Send `null` only to clear a cell on purpose, when the user asked for that.

## 4. Propose, show, wait

```
mcp__serro__propose_dataset_edit(
  dataset_id, verb: "row_upsert",
  rows: [ { <key columns>, <columns in this batch> }, ... ]   # 1 to 200
)
```

Proposing writes nothing. Serro checks every row; if any row fails, nothing is
proposed and the reply names each failing row and check. Fix those rows (or drop
them and say why) and propose again. More than 200 rows means several batches,
each its own proposal.

When the proposal is accepted, check what it returned: every changed cell
should be one you meant to change. If anything else changes, don't go on; find
out why. Then show the user what it returned: rows added and
changed, and the changes as a before → after table (a sample if there are many),
with your sources. Then ask whether to apply it, and **wait for their answer**.
Don't propose and confirm in the same turn. The one exception: the result says
the user already allowed edits to this dataset without asking; then confirm
right away and tell them what changed.

## 5. Confirm

When the user says yes: `mcp__serro__confirm_dataset_edit(dataset_id,
proposal_id)`. Their app may also ask them to approve the change, and can offer
to allow edits to this dataset for the session or for an hour. A proposal
expires after an hour; if it expired, propose again. If Serro says a row changed
since you looked, someone else edited it: re-read those rows, and if they now
hold a value different from the one you were about to replace, show the user
before proposing again rather than overwriting their edit.

If the user declines, stop and ask what to change. Don't re-propose the same rows.

## 6. Report

Report what Serro's confirm returned, plus what you left alone:

```
DATASET <name>
<Serro's summary, e.g. "added 3 rows and changed 24">
Columns: <list>
Left empty: <column> on <n> new rows (no source found)
Skipped: <key> — <reason>
Sources: <short list, or where the per-row notes are>
```

Don't name version numbers. Each batch is one new version, and the dataset's
**History** shows each as one entry with your app's name. To undo the whole run,
the user can restore the version from just before your first batch in the
widget's **Versions** tab. Say which batches the run made, and warn that a
restore also undoes any other edit or refresh since that version: they should
check **History** between your first and last batch before restoring. If your
run was the dataset's first fill (it had no rows before), there is no earlier
version to restore: undoing it means deleting the rows it added, each delete
proposed and approved separately (`row_delete`).
