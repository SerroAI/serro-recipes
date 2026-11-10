## What changes

Release readiness usually gets re-derived from scratch every time someone asks:
every agent re-reads every PR and re-runs the same checks, and the answer lives
in one chat. With this skill, each PR in a release is a row in a **ledger in
Serro**: its verdict, blockers, evidence and the exact commit it was assessed
at. Any agent adds or refreshes rows. "Is the release ready" becomes a query
that re-checks only what changed.

**Beta.** It needs datasets with declared schemas enabled for your workspace.
The skill includes the ledger's schema; you create it once in Ask Serro.

## How it works

1. **Assess a PR.** The agent judges it on evidence: CI and tests, review state,
   open risks and customer asks in Serro, decisions it contradicts, and anything
   that must happen in order at deploy. It records a verdict (ready, needs work,
   blocked or excluded), a risk level, blockers and evidence, tied to the PR's
   head commit.
2. **Ask if the release is ready.** It lists the release's PRs (a milestone, a
   label or a commit range), reads the ledger, and assesses only PRs that are
   missing or whose head commit changed since their verdict. Subagents can take
   one PR each.
3. **Answer GO or NO-GO.** It reports what blocks the release, high-risk PRs that
   are otherwise ready, and which verdicts it reused versus re-assessed.

It never merges or deploys anything, and never reports a verdict from an older
commit as current.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Is 2026.11.2 ready?

**Agent:** 18 PRs in the milestone. The ledger had 15; 2 changed since they were
assessed and 3 were missing, so I assessed 5 and reused 13.

RELEASE 2026.11.2: NO-GO
15 ready, 1 needs work, 1 blocked, 1 excluded   (5 re-assessed this run)
Blocking:
  acme/web#471 Usage-based limits: migration 0331 must run before deploy; no runbook step (risk high)
  acme/api#208 Export v2: e2e "export large org" failing since the last push
High risk but ready:
  acme/web#466 New auth callback: touches every sign-in; reviewed by two people
```
