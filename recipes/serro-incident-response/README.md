# serro-incident-response

The full incident loop in one run: characterise the issue, propose a fix, draft a
runbook — then one approval covers all three writes.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-incident-response
archon workflow run serro-incident-response "the checkout timeout on Tuesday"
```

> [!WARNING]
> **This is the only recipe here that writes to your systems.** On approval it
> files an issue in Serro, publishes a page to Confluence, and — if you named a
> repo path — pushes a branch and opens a draft PR. Read the gate before
> approving it. Everything before the gate is read-only.

## Read the whole blast radius before running it

Every other recipe in this repo either reports or, in one case, publishes a single
document you approved. This one does three things at once, so it is worth being
precise about what happens when.

| Phase | Nodes | Touches |
|---|---|---|
| Read | intake, guard | nothing — Serro reads only |
| Draft | propose-fix, draft-sop | local artifacts only |
| **Gate** | approve-writes | you decide, once, for all three |
| Write | report-issue, publish-sop, open-pr | Serro, Confluence, your repo |

The single gate is deliberate: the approver sees the complete blast radius in one
decision rather than being asked three times and losing track of what they have
already agreed to. Each write node independently re-checks your decision and
reports "skipped" rather than acting on its own initiative.

Nothing is filed, published or pushed if you decline. The drafts remain as
artifacts.

## The PR step needs an explicit repo path

`open-pr` only operates when your run input names a local repo path. Without one
it refuses to pick a repository on its own and instead prints the exact `git` and
`gh` commands to apply `fix-proposal.md` by hand, reporting "PR step deferred".

When it does run, it creates a branch, applies the change, commits, pushes, and
opens a **draft** PR — never a ready-for-review one, and never a merge.

Because it can commit and push, this workflow declares `mutates_checkout: true`,
which keeps Archon's same-checkout path lock: a second run is refused while
another holds the path.

## An invented incident becomes an invented issue

The guard matters more here than anywhere else in this repo. Everything
downstream gets filed, published or pushed on approval, so a plausible-looking
but fabricated symptom becomes a real ticket and a real patch. If Serro is
unreachable the intake node reports the error and a deterministic `guard` node
fails the run before anything is drafted.

## Identity and scope

Every write acts as whatever identity `mcp__serro__whoami` reports, into that
identity's own workspace. No node may pass an organization id it was not handed
by the server, and any tool call that would act outside that scope stops and
reports instead of proceeding.

## Output

| Artifact | Contents |
|---|---|
| `fix-proposal.md` | root-cause hypothesis, patch, PR title and description |
| `sop.md` | five-whys SOP and runbook |
| `incident-summary.md` | what was filed, published and pushed, plus anything skipped and why |

The summary node runs on `all_done`, so a partial run still ends with an honest
account of what exists and what does not.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- An incident with ingested context — Slack, meeting or Jira
- Confluence connected, only if you intend to publish
- `gh` authenticated and a repo path in the run input, only if you want the PR

## When not to use it

| You want | Use instead |
|---|---|
| Just the runbook, no filing or pushing | `serro-sop-writer` |
| Anything you are not prepared to have filed, published and pushed | not this |
