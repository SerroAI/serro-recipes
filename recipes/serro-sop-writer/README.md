# serro-sop-writer

Turns an incident into a runbook, root cause included — reconstructed from the
meeting, Slack and Jira context around it.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-sop-writer
archon workflow run serro-sop-writer "the checkout timeout on Tuesday"
```

The incident reference can be a meeting title, a Slack thread, a Jira key, or
just a description.

## This one can publish — behind a gate

Unlike the other recipes here, `serro-sop-writer` has an external write: it can
publish the finished SOP to Confluence. That write sits behind an explicit
approval node, and it is the only node in the workflow that writes anywhere.

The sequence is: gather (reads only) → draft to a local artifact → **stop and ask
you** → publish only if you approve. Declining leaves the SOP at
`$ARTIFACTS_DIR/sop.md` and publishes nothing. The publish node re-checks your
decision rather than assuming it was reached.

It publishes as whatever identity `mcp__serro__whoami` reports, into that
identity's own workspace, and stops rather than proceeding if a tool would act
outside that scope.

Your codebase is never touched.

## SOP structure

1. Summary
2. Impact and scope
3. Timeline
4. Root cause — five whys, ending at an actual root cause
5. Resolution
6. Prevention
7. Runbook — numbered, copy-pasteable steps to detect and resolve a recurrence

## An invented SOP is worse than none

This matters more here than in the reporting recipes. An SOP gets followed under
pressure by someone who wasn't there, so a plausible-but-wrong timeline is
actively dangerous. If Serro is unreachable the gather node reports the error and
a deterministic `guard` node fails the run rather than drafting a hollow SOP that
still looks publishable.

Where a source came back empty, the affected section is marked incomplete instead
of being filled in with what probably happened.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- An incident with ingested context — the SOP is only as good as what can be
  reconstructed
- Confluence connected, only if you intend to publish. Without a Confluence write
  tool the workflow says so and leaves the SOP local.

## When not to use it

| You want | Use instead |
|---|---|
| General documentation, not an incident | ask the agent directly |
| To publish without review | not this — the gate is the point |
