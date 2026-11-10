## What changes

Eval results usually live in someone's terminal scrollback, so nobody can say
whether today's prompt beats last week's or which run is the baseline. With this
skill, every eval or benchmark run becomes a row in an **eval log in Serro**:
suite, model, prompt version, commit, score, passes, cost and latency. Any
teammate's agent appends to it and compares against it, and the team sees the
trend in the widget.

**Beta.** It needs datasets with declared schemas enabled for your workspace.
The skill includes the log's schema; you create it once in Ask Serro.

## How it works

1. **Log a run.** After a suite runs, the agent reads the numbers from its
   output (never from memory) and fills in what it can.
2. **Compare first.** Before writing, it compares the run with the suite's
   baseline and recent runs, and calls it better, the same within noise, or
   worse, saying how many runs that rests on.
3. **Baseline on request.** When you say a run is the new baseline, it moves the
   flag in one change, so each suite keeps one baseline.
4. **Answer from the log.** "Which model is best on this suite?", "did the
   prompt change regress?" and "what does a point of score cost?" are queries
   over everyone's runs.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Log this run of the answer-quality suite.

**Agent:** EVAL answer-quality — gpt-6.1-sol, prompt a41c9e @ 7d2f310
score 0.812 (baseline 0.794, +0.018)   passed 203/250   cost $4.10   p50 2,340 ms
Verdict: BETTER (the last 4 runs of the baseline prompt ranged 0.788–0.801)
Newly failing: citations-07, citations-19 (both cite a meeting instead of the ticket)

Adding the row to the eval log. Apply it?
```
