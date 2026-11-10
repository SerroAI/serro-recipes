## What changes

Every team has failures that everyone's agent rediscovers: the test that fails
on a clean checkout, the flake that passes on retry, the job that breaks when a
service is down. Each agent spends twenty minutes on it, and the answer dies
with the session. With this skill, the answers live in a **ledger in Serro**
that every teammate's agent checks before debugging.

**Beta.** It needs datasets with declared schemas enabled for your workspace.
The skill includes the ledger's schema; you create it once in Ask Serro.

## How it works

1. **Look up first.** When something fails, the agent builds a signature (the
   test plus its error, with run-specific numbers and paths stripped, so it
   matches on everyone's machine) and checks the ledger.
2. **Known:** it tells you the cause and workaround straight away, applies the
   workaround if it's safe, and counts the occurrence.
3. **Known but marked fixed:** that's a regression, and it says so loudly, with
   the PR that fixed it last time.
4. **New:** it debugs as usual, tells flaky from broken by re-running, checks
   whether the base branch fails too, and once it understands the failure adds
   it to the ledger with the cause and workaround.
5. **Fixed:** when a PR fixes a ledger failure, the row is marked fixed with the
   PR. Rows are never deleted, which is how the next regression gets caught.

Ask for the worst offenders to get the open failures ranked by occurrences.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** The unit suite failed on ses-test-guard. Is that us?

**Agent:** Known failure, not your change.
`ses-test-guard.test.ts > blocks real SES :: AssertionError: expected N calls to be N`
Kind: broken · open since Aug 14 · seen 23 times
Cause: the guard counts calls from a module another test imports first.
Workaround: run the file alone, or ignore it; it fails on staging too.

Recording the occurrence (23 → 24). Apply it?
```
