---
name: serro-pr-readiness
description: Judge whether a pull request is safe to merge for its Serro program by checking the diff against the program's open risks, committed customer requirements, recorded decisions and open action items, and return ready, ready_with_caveats or not_ready with cited evidence. Use when asked "is this PR ready to merge", "is this PR safe to merge", "PR readiness", "readiness check", or "check this PR against the program". Not a style, test or correctness review.
---

# Serro PR Readiness

Decide whether a change is safe to merge **for this program**, using what the
program already knows. You are not a style reviewer: ignore naming, formatting,
test coverage and idiom unless they directly threaten an item in the program
context.

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
   config). Never fall back to a context-free review.

## 2. Resolve the program

Stop at the first that succeeds:

1. **The user's message.** It may also hold a PR number or other noise; extract
   only what looks like a program name or id. Confirm with `list_programs`, or
   `get_program` for an id.
2. **`SERRO_PROGRAM`.** Run `printenv SERRO_PROGRAM`; if empty, check for a
   `SERRO_PROGRAM=` line in `~/.archon/.env`.
3. **The repo.** Run `git remote get-url origin`, then match the repo name
   against each program's linked repositories or title from `list_programs`.

If none match or several do, stop with `SERRO PROGRAM UNRESOLVED`, list the
plausible candidates (id + name), and ask the user to name one. Never pick one.

## 3. Load the program context

1. `get_program` for the objective, current state, members, linked sources.
2. `get_program_widget_data` with **no** `widget_type`, to get the catalog of
   widget types this program actually has. Read it; do not assume it.
3. For each catalog type, in this order, call `get_program_widget_data` with
   that `widget_type`: `risk_log`, `customer_requirements`, `decision_log`,
   `action_items`, `reports`, `program_memory`. Skip types not in the catalog.
4. Keep ids, titles, owners, statuses, severities and dates. You will cite them.
5. Never invent context. Record each lookup as returned data, returned empty,
   or failed. An empty catalog is a real finding (usually: no insights refresh
   yet).

Post a short status block before continuing:
`Program: <name> (<id>)` · risks open/total · requirements committed/shipped/requested ·
decisions · open action items · gaps.

## 4. Collect the diff

Do this yourself with git/gh, in this order:

1. If the request contains a PR number (1–7 digits) and `gh` is installed:
   `gh pr view <n> --json number,title,author,baseRefName,headRefName,url,body`
   then `gh pr diff <n>`.
2. If that gave no diff (no number, no `gh`, or `gh` failed), diff the current
   branch against the remote default branch:
   `BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's|^origin/||')`;
   use `main` if empty; if `git rev-parse --verify origin/$BASE` fails, use
   `master`. Then `git diff origin/$BASE...HEAD`.
3. If that is empty too, use the uncommitted diff, staged and unstaged:
   `git diff HEAD`.
4. If all three are empty, stop: "No change to review: no PR diff, no branch
   diff, no working diff." Never report an all-clear on an empty diff.

Note the source (PR number and title, or branch name and base). For large
diffs, list files first (`gh pr diff <n> --name-only` or
`git diff --stat origin/$BASE...HEAD`) and read per file. You may read
surrounding repository files to understand the change.

## 5. Assess

Work through four lenses, in order:

1. **Open risks.** Does the change touch an open risk's subject? Does it
   mitigate it, worsen it, or silently invalidate the assumption it was logged
   under? A change that resolves a risk is a finding too.
2. **Committed customer requirements.** Does it contradict, break, or only
   *partially* implement a requirement committed to a named customer? Partial
   implementation is the most expensive failure: it ships, looks done, and the
   commitment is still open.
3. **Recorded decisions.** Does it go against a decision already made? Quote
   the decision. A reversal may be right, but it must be deliberate.
4. **Open action items.** Is the change blocked by, or does it complete, one?

Rules of evidence:

- Every finding cites **both** sides: the diff location (`path:line` or hunk
  header) **and** the context item (id or exact title). One-sided findings are
  speculation; drop them.
- If the context is thin (no risks, no requirements, empty widget catalog), say
  so plainly. A finding that meets `not_ready` still decides the verdict;
  otherwise return `ready_with_caveats` with that caveat. Do not manufacture
  findings.
- Rank findings by consequence, not count. Mark each blocking or not.

Verdict:

- `not_ready`: at least one finding contradicts a committed requirement or a
  recorded decision, or materially worsens an open high-severity risk.
- `ready_with_caveats`: findings exist but none block, or the program context
  was too thin to judge confidently.
- `ready`: no conflicts against a program context substantive enough to check.

Fix the verdict before writing the report, and do not soften it while writing.

## 6. Report

Present exactly this structure:

```
# PR Readiness — <program name>

**Verdict:** <ready | ready with caveats | NOT READY>
**Change:** <PR title and number, or branch name>
**Checked against:** <n> open risks, <n> committed requirements, <n> decisions, <n> open action items

## Summary
<2-3 sentences. Lead with the consequence, not the process.>

## Findings
<most consequential first. For each: what the diff does (path:line), which
context item it collides with (id/title), and what to do about it.>

## Checked and clear
<one line per lens that came back clean, so the reader knows what was examined
rather than skipped.>

## Limitations
<Serro lookups that failed or were unavailable (not empty), the diff source if
it fell back from a PR, and any part of the diff you did not read. "None" if
none.>
```

End with one line: `Verdict: <ready | ready_with_caveats | not_ready>`.

---

Archon runs this as a fixed multi-step workflow; this skill asks your agent to
follow the same steps itself, so check the Limitations section of the result.
