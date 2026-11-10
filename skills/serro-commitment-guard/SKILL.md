---
name: serro-commitment-guard
description: Before a coding agent changes behavior, check the program's customer requirements in Serro for promises the change touches and flag conflicts; after it ships, record which PR delivered, changed or put at risk which customer ask in a shared ledger, so product sees engineering's impact on commitments without asking. Beta. Use when about to change user-facing behavior, an API, pricing, limits, data retention or a workflow customers rely on; when someone asks "does this break anything we promised", "which customers care about this", "did we deliver X for <customer>", or after merging a PR that relates to a customer ask.
---

# Serro Commitment Guard (beta)

Customer promises live with product: in Serro's **customer requirements**
(each ask with its customers and its state, requested → committed → shipped).
Code changes live with engineering. The two meet only when something breaks. This
skill makes a coding agent check the promises before it changes behavior, and
afterwards write down which PR touched which ask, in a **ledger in Serro** that
product and every agent can read.

The requirements are product's. This skill never edits them; it reads them and
keeps its own ledger of links.

## Before a change: check

1. Resolve the program (`mcp__serro__list_programs` or `SERRO-CONTEXT.md`).
2. Describe the change in one line, and list what it touches: features, API
   endpoints, UI flows, limits, defaults, data the customer sees. Use the diff
   or the plan, not the ticket title.
3. Read the asks: `mcp__serro__get_program_widget_data` with `widget_type:
   customer_requirements`. Match on meaning, not words: "export as CSV" and
   "download reports" may be the same promise. Also read the ledger below for
   earlier PRs on the same asks.
4. Check decisions too (`mcp__serro__get_program_decisions`): a requirement is
   often narrowed by a decision.
5. Report, then stop and let the user decide:

```
COMMITMENTS touched by <change>
<ask> (<customers>, <state>): DELIVERS | CHANGES | RISKS | UNRELATED-BUT-CLOSE
  why: <one line>   earlier: <PRs from the ledger>
No match: <say so, and what you searched>
```

`RISKS` means the change could break or narrow a committed or shipped ask. Name
the customers. Don't argue the user out of the change; make sure it's deliberate.

## The ledger

One dataset per program. If it doesn't exist, give the user this to paste into
**Ask Serro** on the program (answer **All time** if asked for a backfill):

> Create a custom widget called "Commitment ledger" whose rows only people and
> agents fill, with this declared schema:

```json
{
  "columns": [
    {"name": "requirement", "type": "VARCHAR", "maintained_by": "curated", "description": "The customer ask, as titled in Serro's customer requirements"},
    {"name": "pr", "type": "VARCHAR", "maintained_by": "curated", "description": "owner/repo#number"},
    {"name": "impact", "type": "VARCHAR", "maintained_by": "curated", "description": "delivers, partially_delivers, changes or risks"},
    {"name": "customers", "type": "VARCHAR", "maintained_by": "curated", "description": "Customers the ask names, comma-separated"},
    {"name": "summary", "type": "VARCHAR", "maintained_by": "curated", "description": "What the PR does to the ask, in one line"},
    {"name": "shipped", "type": "BOOLEAN", "maintained_by": "curated", "description": "True once the PR is merged and deployed"},
    {"name": "acknowledged_by", "type": "VARCHAR", "maintained_by": "curated", "description": "Email of who accepted a risks or changes impact"},
    {"name": "recorded_by", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "recorded_at", "type": "TIMESTAMP", "maintained_by": "curated"}
  ],
  "key": ["requirement", "pr"],
  "checks": [
    {"name": "known impact", "kind": "sql", "sql": "SELECT requirement, pr FROM result WHERE impact NOT IN ('delivers','partially_delivers','changes','risks')"},
    {"name": "risks are acknowledged", "kind": "sql", "sql": "SELECT requirement, pr FROM result WHERE impact IN ('risks','changes') AND (acknowledged_by IS NULL OR acknowledged_by = '')"},
    {"name": "acknowledger is a member", "kind": "org_member_email", "column": "acknowledged_by"},
    {"name": "recorder is a member", "kind": "org_member_email", "column": "recorded_by"}
  ]
}
```

Find it: the `Dataset:` line from `mcp__serro__get_program_widget_data`, then
`mcp__serro__describe_dataset(dataset_id)`; writing needs `row_upsert` in `edits`.
Query it with `mcp__serro__query_dataset`, e.g.
`SELECT * FROM ds WHERE requirement = '<ask>' ORDER BY recorded_at`.

## After the change: record

When the PR is open or merged, for each ask the check matched as DELIVERS,
CHANGES or RISKS:

- Upsert `{requirement, pr, impact, customers, summary, shipped,
  recorded_by: <user's email>, recorded_at}`.
- A `risks` or `changes` row needs `acknowledged_by`: the person who accepted
  the impact, usually the user, after they said so. If nobody has, don't write
  the row; tell the user who should acknowledge it (the ask's owner if Serro
  shows one).
- When the PR deploys, update `{requirement, pr, shipped: true}`.

**How every write works.** `mcp__serro__propose_dataset_edit(dataset_id, verb:
"row_upsert", rows)` with the key and only the columns you set; show the user the
rows; confirm with `mcp__serro__confirm_dataset_edit` after their yes. The ledger
records facts product will rely on: always wait for the yes unless the user
already allowed edits to it.

Times are UTC in ISO 8601, for example `date -u +%Y-%m-%dT%H:%M:%SZ`; Serro
refuses other offsets.

Tell the user when a PR fully delivers a committed ask: product may want to
mark it shipped in Serro. Don't do that yourself.

## Answering product's questions

- "Did we deliver X for <customer>?": ledger rows for the ask, with `shipped`.
- "What changed for <customer> this month?":
  `SELECT * FROM ds WHERE customers ILIKE '%<customer>%' AND recorded_at >= '<date>'`.
- "Which commitments are at risk?": `impact = 'risks' AND NOT shipped`, plus asks
  with no `delivers` row yet that are committed in Serro.

## Rules

- Check before changing behavior, every time, and report even when nothing
  matches.
- Never edit customer requirements; record links in the ledger.
- A risk to a promise is recorded only with a named person who accepted it.
