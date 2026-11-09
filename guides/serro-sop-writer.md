## What it does

SOP Writer turns an incident into a runbook. It reads the meeting, Slack and Jira
context around the incident from Serro, runs a five-whys root-cause analysis and
drafts a structured SOP. The incident reference can be a meeting title, a Slack
thread, a Jira key or a plain description.

```bash
archon workflow run serro-sop-writer "the checkout timeout on Tuesday"
```

Your codebase is never touched.

## The publish gate

This workflow can publish the finished SOP to Confluence. That is its only write,
and it sits behind an explicit approval step:

1. Gather the context. Reads only.
2. Draft the SOP to a local file, `sop.md`.
3. Stop and ask you.
4. Publish only if you approve.

Declining leaves the SOP at `sop.md` and publishes nothing. The publish step
checks your decision again instead of assuming it. It publishes as the identity
Serro reports for you, into that identity's own workspace. Without a Confluence
write tool it says so and leaves the SOP local.

## SOP structure

1. Summary
2. Impact and scope
3. Timeline
4. Root cause, as five whys ending at an actual root cause
5. Resolution
6. Prevention
7. Runbook: numbered, copy-pasteable steps to detect and resolve a recurrence

## Gaps are marked, not filled

Someone will follow this SOP under pressure and may not have been there. A
plausible but wrong timeline is dangerous. If Serro can't be reached, the run
fails instead of drafting a hollow SOP. If one source came back empty, the
affected section is marked incomplete rather than filled with a guess.

To file the issue and open a fix PR as well, use
[Incident Response](/docs/guides/serro-incident-response).

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# SOP: Checkout timeout on Tuesday

## 1. Summary
Checkout requests timed out for about 40 minutes on Tuesday. A slow tax API call
blocked the payment step. Fixed by a rollback and a timeout on the call.

## 2. Impact and scope
Guest and logged-in checkouts. Northwind pilot users were not affected.

## 3. Timeline
- 09:12 Alerts for p95 latency in #checkout-eng
- 09:25 CHK-244 opened
- 09:52 Rollback of the tax change completed

## 4. Root cause (five whys)
1. Why did checkout time out? The payment step waited on tax.
2. Why? The tax API was slow. ... 5. Why? No timeout or fallback was defined.

## 5. Resolution
Rolled back the release, then added a 2 second timeout.

## 6. Prevention
Add a load test (AI-21). Revisit RISK-15 "Slow tax API at peak".

## 7. Runbook
1. Check p95 latency on the payment step.
2. If tax calls exceed 2s, roll back the latest release.
3. Confirm in #checkout-eng and update CHK-244.

> Section 3 is incomplete: no Slack thread data came back for 09:25 to 09:50.
```
