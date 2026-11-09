## What it does

Incident Response runs the whole incident loop in one go. It characterises the
issue from Serro context, proposes a fix, drafts a five-whys SOP, then asks for
one approval that covers three writes.

**This is the only workflow in the set that can push code.** On approval
it files an issue in Serro, publishes the SOP to Confluence and, if you gave it a
repo path, pushes a branch and opens a draft PR. Without a Confluence write tool,
the SOP stays as a local artifact. Read the gate before you approve.

## What happens when

| Phase | Steps | Touches |
| --- | --- | --- |
| Read | intake, guard | Nothing. Serro reads only |
| Draft | propose-fix, draft-sop | Local artifacts only |
| Gate | approve-writes | You decide once, for all three |
| Write | report-issue, publish-sop, open-pr | Serro, Confluence, your repo |

There is one gate on purpose. You see the full set of writes in one decision
instead of three. Rejecting cancels the run before any write step starts:
nothing is filed, published or pushed, and the drafts stay as artifacts. After
an approval, each write step reads your approval comment again and does nothing
if it does not read as an approval.

## Running it

```bash
archon workflow run serro-incident-response "the checkout timeout on Tuesday"
```

The reference can be a Slack thread, a meeting, a Jira key, a repo or PR, or a
free description.

## The PR step needs a repo path

The PR step only runs if your run message names a local repo path. Without one it
does not pick a repository. It prints the `git` and `gh` commands to apply the
fix by hand and reports "PR step deferred".

When it does run, it creates a branch, applies the change, commits, pushes and
opens a **draft** PR. It never opens a ready-for-review PR and never merges.
Archon locks only the run's own working path, not the repo path you name, so
don't run two incident responses against the same repo at once.

## Why the guard matters here

Everything after intake gets filed, published or pushed on approval. An invented
symptom would become a real ticket and a real patch. If Serro can't be reached,
the run fails before anything is drafted.

## Outputs

| File | Contents |
| --- | --- |
| `fix-proposal.md` | Root-cause hypothesis, patch, PR title and description |
| `sop.md` | Five-whys SOP and runbook |
| `incident-summary.md` | What was filed, published and pushed, and anything skipped and why |

The summary is written after every write step has finished. If a write step
failed, the summary may not be written at all, so check each write step's result
in the run log to see what exists. For just the runbook, use
[SOP Writer](/docs/guides/serro-sop-writer).

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Incident Summary: Checkout timeout on Tuesday

## Approval
Approved once for: Serro issue, Confluence SOP, draft PR.

## Issue reported
- Filed in Serro as a tracked task: "Checkout timeouts from slow tax API"
  (severity high). Linked to existing CHK-244.

## SOP
- Published to Confluence, space ENG: "SOP: Checkout timeout on Tuesday".
- Local copy: sop.md

## Fix
- Branch `incident/checkout-tax-timeout` pushed.
- Draft PR #1251 "Add 2s timeout and cart-time fallback for tax calls".

## Skipped
- Nothing skipped.

## Notes
- Fix follows DEC-3 (tax at cart time). Related risk: RISK-15.
```
