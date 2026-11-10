## What changes

A Serro dataset is the versioned table behind a program widget: a service
inventory, a commitment tracker, an ownership map. Serro's refresh fills some
columns. Others are **curated**, filled only by people and agents, and they tend
to stay empty because nobody has time. Your agent can usually reach the evidence
that fills them: the repository, tickets, docs and meetings.

With this skill, your agent fills them for you, under the dataset's own rules,
and you approve the change before anything is written.

**Beta.** It needs datasets enabled for your workspace, and a dataset that
already exists. Your agent can't create one: declare a widget's dataset in
Serro, or use **Create dataset** on a widget's table, first.

## How it works

1. **Finds the dataset.** It lists the program's widgets and their datasets. If
   more than one could match, it asks you.
2. **Learns the rules.** `describe_dataset` gives it the columns and their types,
   the key, how a refresh treats edits, and the checks every row must pass. If
   the dataset can't take row edits (you can't edit the program, it has no key,
   or every refresh rebuilds it), the agent says why and stops before doing any
   work. It reads the rows already there to tell new rows from gaps.
3. **Gathers rows.** Each value comes from a source it can name. It never
   guesses, and it only sends values it found: rows are grouped by the columns
   they set, so columns it has nothing new for are left exactly as they are. Any
   filled cell it does propose to change shows up as before → after for you to
   review. On
   a dataset with a declared schema, it prefers curated columns, because Serro's
   refresh overwrites the others.
4. **Proposes, then asks you.** It proposes one or more batches of up to 200
   rows (one per set of columns, more if there are over 200 rows).
   Proposing writes nothing. Serro checks every row, and if one fails, nothing
   is proposed and the agent is told which rows failed which checks. Once Serro
   accepts the batch, the agent shows you the rows it adds and the before → after
   changes, and waits for your yes.
5. **You approve.** Your app may ask you to approve as well, and can let you
   allow edits to this dataset for the session or for an hour. Each batch
   becomes one new version, and **History** shows it with your agent's name.

To undo a run, restore the version from just before its first batch in the
widget's **Versions** tab. A restore also undoes anything else changed since
that version, so check **History** for other people's edits first.

## Good datasets to start with

- **Service ownership:** service, owner email, on-call rotation, runbook link.
  The evidence is in CODEOWNERS, service manifests and the on-call tool.
- **Customer commitments:** commitment, customer, due date, status. The evidence
  is in tickets, meeting transcripts and decision logs.
- **Dependency inventory:** package, version, owner, upgrade deadline. The
  evidence is in lockfiles and security advisories.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Fill the owner and runbook columns in Service inventory from this repo.

**Agent:** Service inventory has 34 services, keyed by `service`. `owner` and
`runbook` are curated; 21 owners and 30 runbooks are empty.

I can fill 18 owners (from CODEOWNERS) and 24 runbooks (from each service's
README). 3 owners stay empty: their CODEOWNERS entry is a team alias, not a person.
Serro accepted 3 batches (15 rows set owner and runbook, 3 set owner only, 9 set
runbook only): 27 rows changed. Before → after (sample):
| service | owner | runbook | sources |
| payments-api | — → priya@acme.dev | — → docs/runbooks/payments.md | CODEOWNERS:12, README |
Apply it?

**User:** Yes.

**Agent:**
DATASET Service inventory
changed 27 rows
Columns: owner, runbook
Kept as they were: owner on 3 rows (team alias, no person)
```
