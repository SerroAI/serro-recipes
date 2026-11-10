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
   the key, which columns are curated, and the checks every row must pass. It
   reads the rows already there to tell new rows from gaps.
3. **Gathers rows.** Each value comes from a source it can name. A value it
   can't source stays empty. It prefers curated columns, because Serro's refresh
   overwrites the other columns.
4. **Shows, then proposes.** It tells you how many rows it will add and change,
   with a sample. Then it proposes one batch of up to 200 rows. Proposing writes
   nothing. Serro checks every row, and if one fails, nothing applies and the
   agent is told which rows failed which checks.
5. **You approve.** Your app asks you to apply the change. You can also allow
   edits to this dataset for the session or for an hour. The batch becomes one
   new version, and **History** shows it with your agent's name.

To undo it, restore the previous version from the widget's **Versions** tab.

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
Sample:
| service | owner | runbook | source |
| payments-api | priya@acme.dev | docs/runbooks/payments.md | CODEOWNERS:12 |

Proposing 27 rows… Serro accepted the batch. Approve it in your app.

DATASET Service inventory — v14
Added: 0 rows   Changed: 27 rows   Columns: owner, runbook
Left empty: owner on 3 rows (team alias, no person)
```
