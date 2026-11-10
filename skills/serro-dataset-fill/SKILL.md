---
name: serro-dataset-fill
description: Fill or update rows of a Serro program dataset from evidence your agent can reach (the repo, tickets, docs, meetings), checked against the dataset's declared columns, key and quality checks, and applied as one batch the user approves. Beta. Use when someone asks to "fill the dataset", "populate this table", "add these to the Serro dataset", "backfill the owner column", "update the tracker in Serro from the repo", or names a dataset and a source to fill it from.
---

# Serro Dataset Fill (beta)

A Serro dataset is a versioned table behind a program widget: a service
inventory, a commitment tracker, an ownership map. Some of its columns are filled
by Serro's refresh. Others are **curated**: only people and agents fill them, and
a refresh never overwrites them. Those curated columns are usually empty because
nobody has had time to fill them. You can reach the evidence that fills them.

Your job: **find the dataset, learn its rules, gather rows with a source for every
value, and land them as one batch the user approves.** Never guess a value to make
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

## 2. Learn its rules

Call `mcp__serro__describe_dataset(dataset_id)`. It returns:

- the columns, each with its type and who maintains it (`source` or `curated`)
- the **key**: the column or columns that name a row
- the assumptions and the **checks** every row must pass (for example "owner is
  the email of someone in the organization")
- `maxRowsPerBatch` (200)

Then read what is already there: `mcp__serro__get_dataset` for a page of rows and
a per-column profile, or `mcp__serro__query_dataset` with one read-only SQL
SELECT (for example, which keys have an empty `owner`). Work out which rows are
new and which existing rows have gaps.

Prefer filling **curated** columns and adding new keys. A `source` column is
overwritten the next time the refresh returns that key, so writing one only lasts
until then. If the user asks you to change source columns anyway, say so first.

## 3. Gather rows

Use whatever evidence fits the dataset: the repository (CODEOWNERS, manifests,
config, git history), Serro's tools (`mcp__serro__search_jira`,
`mcp__serro__search_meetings`, `mcp__serro__get_program_decisions`,
`mcp__serro__search_slack`), and docs the user points you to.

- **One source per value.** Keep a note of where each value came from (a file
  and line, a ticket, a meeting). You report it at the end.
- **Unknown stays empty.** A `null` is honest; a plausible guess is a defect
  someone will trust later.
- **Match the types and checks yourself first.** Dates as ISO dates, emails as
  real organization emails (`mcp__serro__search_people` or the dataset's
  existing values), enums spelled exactly as existing rows spell them.
- **Every row in a batch sets the same columns**, and every row names every key
  column.

## 4. Show, then propose

Before proposing, tell the user in a few lines: how many rows you will add, how
many you will change, which columns, and a short sample with sources. Then:

```
mcp__serro__propose_dataset_edit(
  dataset_id, verb: "row_upsert",
  rows: [ { <key columns>, <columns you set> }, ... ]   # 1 to 200
)
```

Proposing writes nothing. Serro checks every row; if any row fails, nothing is
applied and the reply names each failing row and check. Fix those rows (or drop
them and say why) and propose again. More than 200 rows means several batches,
each its own proposal.

## 5. Confirm

`mcp__serro__confirm_dataset_edit(dataset_id, proposal_id)`. The user's app asks
them to approve the change; they can also allow edits to this dataset for the
session or for an hour. A proposal expires after an hour.

If the user declines, stop and ask what to change. Don't re-propose the same rows.

## 6. Report

```
DATASET <name> — v<version>
Added: <n> rows   Changed: <n> rows   Columns: <list>
Left empty: <column> on <n> rows (no source found)
Skipped: <key> — <reason>
Sources: <short list, or where the per-row notes are>
```

The batch is one new version, and the dataset's **History** shows it as one entry
with your app's name. To undo it, the user can restore the previous version from
the widget's **Versions** tab.
