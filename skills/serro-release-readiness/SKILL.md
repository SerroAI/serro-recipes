---
name: serro-release-readiness
description: Decide go, go_with_risk or no_go for shipping a Serro program by weighing committed-but-unshipped customer requirements, open risks, release-gating action items and contradicted decisions against what landed since the last tag and Serro's delivery signals. Use when asked "are we ready to ship", "go/no-go for the release", "release readiness", "release check", "can we cut a release", or before a milestone or customer-facing launch. Not for a single PR (use serro-pr-readiness).
---

# Serro Release Readiness

Tool names below assume the Serro MCP server is registered as `serro`. If yours
has another name (on Serro's staging, `serro-staging`), use that prefix instead:
`mcp__serro-staging__list_programs` for `mcp__serro__list_programs`, and so on.

Program-level go/no-go: answer "are we ready to ship" from the commitments and
risks the program holds, not from a green CI badge.

Read-only. Do not edit files, check out branches, or post to GitHub, Slack or
Serro. Show the report in the conversation; write it to a file only if the user
asks.

Tool names below are bare (`get_program`). Your runtime prefixes them with the
server name, e.g. `mcp__serro__get_program` or `mcp__serro-staging__get_program`.
Use whichever Serro server is present.

## 1. Check Serro is reachable (guard)

1. Look for Serro MCP tools (`whoami`, `list_programs`, `get_program`,
   `get_program_widget_data`). Call `whoami` once to confirm identity and org.
2. If there are no Serro tools, or `whoami` still fails after one retry (auth,
   network or any other error), **stop**. Reply with `SERRO CONTEXT UNAVAILABLE`,
   the exact error (or "no Serro MCP tools present"), and how to connect:
   `claude mcp add --transport http --scope user serro https://mcp.serro.ai/mcp && claude mcp login serro`
   (Codex/Copilot: add `https://mcp.serro.ai/mcp` as an MCP server in their
   config). Never fall back to a context-free go/no-go.

## 2. Resolve the program

Stop at the first that succeeds:

1. **The user's message.** Extract only what looks like a program name or id.
   Confirm with `list_programs`, or `get_program` for an id.
2. **`SERRO_PROGRAM`.** Run `printenv SERRO_PROGRAM`; if empty, check for a
   `SERRO_PROGRAM=` line in `~/.archon/.env`.
3. **The repo.** Run `git remote get-url origin`, then match the repo name
   against each program's linked repositories or title from `list_programs`.

If none match or several do, stop with `SERRO PROGRAM UNRESOLVED`, list the
plausible candidates (id + name), and ask the user to name one. Never pick one.

## 3. Load the program context

1. `get_program` for the objective, current state, members, linked sources.
2. `get_program_widget_data` with **no** `widget_type` for the catalog.
3. For each catalog type, in this order, call `get_program_widget_data` with
   that `widget_type`: `risk_log`, `customer_requirements`, `decision_log`,
   `action_items`, `reports`, `program_memory`. Skip types not in the catalog.
4. Keep ids, titles, owners, statuses, severities, due dates. Never invent
   context; record each lookup as returned data, empty, or failed. An empty
   catalog is a real finding (usually: no insights refresh yet).

## 4. Release scope from git

Run these yourself:

```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
git symbolic-ref --quiet --short refs/remotes/origin/HEAD   # default branch; "main" if empty
git rev-parse --short HEAD
# With a tag:
git log --no-merges --pretty='- %h %s (%an, %ad)' --date=short "$LAST_TAG..HEAD" | head -300
git diff --stat "$LAST_TAG..HEAD" | tail -60
# With no tags at all, fall back to the last 100 commits:
git log --no-merges --pretty='- %h %s (%an, %ad)' --date=short -100
```

Record the last tag (or "none"), the commit count since it, and whether you used
the 100-commit fallback. If the log or stat output was cut off, list that under
Limitations and cite only the range you actually read.

## 5. Delivery signals from Serro

Use Serro tools only in this step (do not read the repo). Where available:

- `get_repo_activity` and/or `search_github`: merged and open PRs for the program.
- `get_program_activity`: what has actually been happening.
- `search_meetings`: program meetings in the last 14 days; note anything that
  sounds like a launch decision, a slip, or a dependency on another team.
- `search_reports` / `get_report`: the most recent program report, if any.

Collect only; no verdicts yet. Keep PR numbers, dates, owners, meeting titles.
Label each source **returned data**, **returned empty** (a signal), or
**unavailable/failed** (a gap). Post a one-line inventory of the three groups.

## 6. Assess

You may read repository files to confirm whether something claimed as done is
present. Judge each blocker class independently, naming the items in it:

1. **Committed-but-unshipped requirements.** A `committed` customer requirement
   with no corresponding landed work is a blocker by default. This is the
   highest-value check.
2. **Unresolved risks.** Open high-severity risks, or any open risk whose
   subject appears in the landed scope. Say whether this release makes each one
   better or worse.
3. **Release-gating open action items.** Owned, overdue, or phrased as a
   precondition.
4. **Contradicted decisions.** Landed work that goes against a recorded
   decision, or a recent meeting decision not yet reflected in the code.

Rules of evidence:

- Every blocker cites the item id or exact title **and** the commit, PR or file
  that supports the claim. Uncited blockers are opinions; drop them.
- An unshipped requirement has no landed work to cite. Cite the requirement id
  and the release scope you searched (e.g. "no commit or PR in v2.3.0..HEAD
  mentions REQ-7") instead. An open release-gating action item, such as a
  customer sign-off, is cited by its id and Serro status.
- Distinguish "no evidence this shipped" from "evidence this did not ship". Say
  which you have.
- A lookup that was unavailable rather than empty goes under Limitations, never
  silently omitted.
- Do not pad. Three real blockers beat eleven maybes.

Verdict:

- `no_go`: at least one committed requirement is unshipped, or an open
  high-severity risk is made worse by this release.
- `go_with_risk`: no `no_go` condition holds, but flagged items (including
  open release-gating action items and contradicted decisions), named risks or
  gaps ride along.
- `go`: nothing outstanding against a context substantive enough to judge. If
  the context is too thin to judge, or a lookup failed, it is not `go`; list the
  gap.

Fix the verdict before writing the report, and do not soften it while writing.

## 7. Report

Present exactly this structure:

```
# Release Readiness — <program name>

**Verdict:** <GO | GO WITH RISK | NO-GO>
**Scope:** <commits since last tag, or "last 100 commits (no tags)">

## Summary
<2-3 sentences, consequence first.>

## Blockers (<count>)
<one entry each: what it is, who owns it, the evidence, what unblocks it>

## Riding along
<non-blocking risks and gaps that ship with this release>

## What was checked
<the four blocker classes, each marked clear or flagged>

## Limitations
<sources that were unavailable or failed; a reader must know what was NOT checked>
```

End with one line: `Verdict: <go | go_with_risk | no_go>`.

---

Archon runs this as a fixed multi-step workflow; this skill asks your agent to
follow the same steps itself, so check the Limitations section of the result.
