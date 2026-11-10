## What changes

Hard bugs get debugged in parallel by people and agents who don't talk enough:
one retries the cache theory another ruled out an hour ago, and when the fix
lands nobody can say why the other theories were wrong. With this skill, the
hunt lives on a **board in Serro**: each hypothesis is a row with who is testing
it, how, and the evidence. Every agent reads the board before testing anything.

**Beta.** It needs datasets with declared schemas enabled for your workspace.
The skill includes the board's schema; you create it once in Ask Serro.

## How it works

1. **Read the board.** Joining an investigation, the agent first summarises
   what's confirmed, what's ruled out and why, what's being tested and by whom.
2. **Add hypotheses.** Each one is a falsifiable sentence with the cheapest
   test that would kill it, drawing on meetings, Slack, decisions and recent PRs
   in Serro.
3. **Claim and test.** An agent claims a hypothesis, runs the decisive test and
   records the verdict with its evidence. Serro refuses a verdict without
   evidence, and the agent drops a claim if someone else took the hypothesis
   first.
4. **Fan out.** One person can start a subagent per open hypothesis; teammates'
   agents join the same board.
5. **Close.** When a confirmed hypothesis explains every symptom, the root cause
   is recorded with its proof and the fix PR.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Pick up the duplicate-invoice investigation.

**Agent:** Board for INV-212:
- Ruled out: retry storm in the webhook (no duplicate deliveries in 3 days of logs)
- Ruled out: clock skew (both duplicates share one request id)
- Testing: race in the idempotency check (priya@acme.dev, Claude Code)
- Open: the nightly backfill re-sends unpaid invoices

I'll take the backfill one. Claim it?

**User:** Yes.

**Agent:** Ran the backfill against yesterday's snapshot: 14 invoices re-sent,
all 14 match this week's duplicates. Recording it as confirmed with that
evidence. Apply it?
```
