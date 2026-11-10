---
name: serro-known-failures
description: Check a shared ledger of known test and build failures in Serro before debugging one, so no agent re-debugs a flake, a broken test or an environment problem someone already understood - reuse the recorded cause and workaround, count the new occurrence, catch regressions of fixed failures, and record new ones once understood. Beta. Use when a test, build, lint or CI job fails, when someone asks "is this test flaky", "is this a known failure", "has anyone seen this error", "what are our flakiest tests", or after fixing a failure that should be marked fixed.
---

# Serro Known Failures (beta)

Every team has failures that everyone's agent rediscovers: the test that fails
on a clean checkout, the flake that passes on retry, the job that breaks when a
service is down. Each agent spends twenty minutes on it and the answer dies with
the session. This skill keeps those answers in a **ledger in Serro**, a dataset
every teammate's agent reads before debugging and writes to once it knows
something new.

Reading is cheap and should happen every time. Write only when you learned
something: a new failure understood, a recurrence, a fix.

## The ledger

One dataset per program. If it doesn't exist, give the user this to paste into
**Ask Serro** on the program (answer **All time** if asked for a backfill):

> Create a custom widget called "Known failures" whose rows only people and
> agents fill, with this declared schema:

```json
{
  "columns": [
    {"name": "signature", "type": "VARCHAR", "maintained_by": "curated", "description": "Normalised test id + error, see the skill"},
    {"name": "test", "type": "VARCHAR", "maintained_by": "curated", "description": "Test, job or command that fails"},
    {"name": "error", "type": "VARCHAR", "maintained_by": "curated", "description": "The first meaningful error line, verbatim"},
    {"name": "kind", "type": "VARCHAR", "maintained_by": "curated", "description": "flaky, broken, environment or product_bug"},
    {"name": "status", "type": "VARCHAR", "maintained_by": "curated", "description": "open, fixed or wont_fix"},
    {"name": "cause", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "workaround", "type": "VARCHAR", "maintained_by": "curated", "description": "What to do when you hit it, until it is fixed"},
    {"name": "ticket", "type": "VARCHAR", "maintained_by": "curated"},
    {"name": "fixed_by", "type": "VARCHAR", "maintained_by": "curated", "description": "PR that fixed it"},
    {"name": "occurrences", "type": "BIGINT", "maintained_by": "curated"},
    {"name": "first_seen", "type": "TIMESTAMP", "maintained_by": "curated"},
    {"name": "last_seen", "type": "TIMESTAMP", "maintained_by": "curated"},
    {"name": "last_seen_by", "type": "VARCHAR", "maintained_by": "curated", "description": "Email of whose run hit it last"}
  ],
  "key": ["signature"],
  "checks": [
    {"name": "known kind", "kind": "sql", "sql": "SELECT signature FROM result WHERE kind NOT IN ('flaky','broken','environment','product_bug')"},
    {"name": "known status", "kind": "sql", "sql": "SELECT signature FROM result WHERE status NOT IN ('open','fixed','wont_fix')"},
    {"name": "fixed has a PR", "kind": "sql", "sql": "SELECT signature FROM result WHERE status = 'fixed' AND (fixed_by IS NULL OR fixed_by = '')"},
    {"name": "seen by a member", "kind": "org_member_email", "column": "last_seen_by"}
  ]
}
```

Find it each time: resolve the program (`mcp__serro__list_programs` or
`SERRO-CONTEXT.md`), its `Dataset:` line from `mcp__serro__get_program_widget_data`,
and `mcp__serro__describe_dataset(dataset_id)`. Writing needs `row_upsert` in
`edits`; reading doesn't.

## The signature

The key has to come out the same on everyone's machine. Build it as
`<test id> :: <error>`, where:

- **test id** is the test's stable name (`path/to/file.test.ts > suite > case`,
  `tests/x.py::TestY::test_z`, or the CI job and step).
- **error** is the first line that says what went wrong (the assertion or
  exception class and message), with run-specific parts replaced: numbers by
  `N`, hex and UUIDs by `ID`, absolute or temp paths by their repo-relative form,
  timestamps and durations removed.

Example: `src/tests/unit/ses-test-guard.test.ts > blocks real SES :: AssertionError: expected N calls to be N`.

## When something fails

1. Build the signature, then look it up:
   `SELECT * FROM ds WHERE signature = '<sig>'`. If nothing matches, search
   wider before concluding it's new:
   `SELECT * FROM ds WHERE test = '<test id>' OR error ILIKE '%<distinctive words>%'`.
2. **Known and open:** tell the user straight away what it is, the cause and the
   workaround, and apply the workaround if it's safe (a retry, a missing env
   var). Don't re-debug it. Record the occurrence (below).
3. **Known and fixed:** this is a **regression**. Say so prominently, with the
   PR that fixed it, then debug it as new: the old cause is a lead, not an
   answer. Once understood, set `status: open` with the new cause.
4. **Not known:** debug it normally. Re-run once to tell `flaky` from `broken`.
   Check whether it fails on the base branch too (then it isn't this change).
   Once you understand it, add a row: `signature, test, error, kind, status:
   open, cause, workaround, occurrences: 1, first_seen, last_seen, last_seen_by`.
   If you can't explain it, say so and still add it with `cause` empty: a known
   unknown beats a rediscovery.

**Recording an occurrence.** Upsert `{signature, occurrences: <current + 1>,
last_seen: <now>, last_seen_by: <user's email>}`, using the count you just read.
If Serro says the row changed since you looked, re-read and add one to the new
count. Do this once per failing run, not per retry.

**How every write works.** `mcp__serro__propose_dataset_edit(dataset_id, verb:
"row_upsert", rows)` with the key and only the columns you set; show the user the
change; confirm with `mcp__serro__confirm_dataset_edit` after their yes, or right
away if they already allowed edits to this ledger. Suggest allowing it for the
session: occurrences are small, frequent writes.

## After a fix

When a PR fixes a ledger failure, upsert `{signature, status: "fixed", fixed_by:
<PR url>, cause: <final cause if it changed>}`. Don't delete rows: a fixed row is
how the next agent spots a regression.

## Reports

When asked for the worst offenders:

```sql
SELECT test, kind, occurrences, last_seen, workaround
FROM ds WHERE status = 'open' ORDER BY occurrences DESC LIMIT 10
```

Also flag `open` rows not seen in 30 days (likely fixed without anyone saying
so: ask before closing) and `flaky` rows whose occurrences keep climbing (worth
a ticket).

## Rules

- Look up before debugging, every time.
- Never mark something fixed without a PR or the user saying so.
- `error` is verbatim; `cause` is your understanding. Keep them apart.
