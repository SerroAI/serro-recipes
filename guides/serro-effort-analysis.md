## What it does

Effort Analysis shows where engineering time went over a window you choose. It
sorts the work into four categories and breaks it down per engineer and per
workstream.

| Code | Category | Covers |
| --- | --- | --- |
| `NC` | New capabilities | Feature and delivery work |
| `KTLO` | Keep-the-lights-on | Incidents, bug fixes, ops maintenance |
| `IP` | Internal productivity | Planning, spikes, tooling, developer experience |
| `QI` | Quality improvement | Hardening, tech debt, reliability |

## What it reads

- Jira issues worked, with type, assignee and status changes
- PRs and commits by author
- Code churn per author, where available
- A work-mix CSV, if one exists, for its existing distribution
- Programs and their activity, to map work onto workstreams

Every call is a read. Nothing is written back to Serro, and nothing is posted.

## Running it

Put the window in the run message. Add a program or repo scope if you want one:

```bash
archon workflow run serro-effort-analysis "last quarter, Checkout Revamp"
```

Scope is resolved from the run message, then `SERRO_PROGRAM`, then a repo-name
match. If none resolve, it analyses the whole window and says so.

## Reading the report

Read the data-confidence note first. A four-way percentage split looks equally
sure whether it rests on complete data or a third of it, so the report states
what was sourced directly and what was inferred. If a source came back empty,
that goes into the note instead of becoming a percentage the data can't support.

Per-engineer numbers are approximations with a stated basis. They are not
timesheets. Treat them as a distribution, not an evaluation.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Effort Analysis — Checkout Revamp (last quarter)

## Overall split
- NC 52% · KTLO 24% · IP 9% · QI 15%

## Per engineer (approximate share of attributed work)
| Engineer | NC | KTLO | IP | QI | Basis |
| --- | --- | --- | --- | --- | --- |
| Priya | 60% | 10% | 5% | 25% | 31 PRs, 22 Jira issues |
| Marcus | 35% | 45% | 10% | 10% | 18 PRs, 27 Jira issues |

## Per workstream
- Cart and tax: NC 70%, QI 20%, KTLO 10%
- Payments: NC 40%, KTLO 35%, QI 25%

## Observations
1. KTLO is concentrated in Payments, mostly duplicate-charge fixes (RISK-12).
2. IP is under 10%. No spikes were logged for the guest checkout work.
3. QI rose in the second half, led by the tax rounding fixes.

## Data confidence
- Directly sourced: Jira type and assignee, PR authors.
- Inferred: category for 41 issues with no type set, and all churn weighting.
- No work-mix CSV was found, so there was nothing to compare the split against.
```
