---
name: serro-design-pr-review
description: Review a pull request against its design source of truth (a design.md, PRD, spec or RFC in the repo, or a design doc linked to the Serro program) plus the program's recorded design decisions, and return aligned, extends_design, drift or no_design_source with quoted evidence. Use when asked "does this match the design", "design review", "check this PR against design.md", "design drift", or "spec compliance". Not for code correctness or merge safety (use serro-pr-readiness).
---

# Serro Design PR Review

Check a change against what the design says and what the team actually decided.
Style, naming, tests and performance are out of scope unless the design
explicitly speaks to them.

Read-only. Do not edit files (including the design document), check out
branches, or post to GitHub, Slack or Serro. Show the report in the
conversation; write it to a file only if the user asks.

Tool names below are bare (`get_program`). Your runtime prefixes them with the
server name, e.g. `mcp__serro__get_program` or `mcp__serro-staging__get_program`.
Use whichever Serro server is present.

## 1. Check Serro is reachable (guard)

1. Look for Serro MCP tools (`whoami`, `list_programs`, `get_program`,
   `get_program_widget_data`). Call `whoami` once to confirm identity and org.
2. If there are no Serro tools, or `whoami` fails with an auth error, **stop**.
   Reply with `SERRO CONTEXT UNAVAILABLE`, the exact error (or "no Serro MCP
   tools present"), and how to connect:
   `claude mcp add --transport http --scope user serro https://mcp.serro.ai/mcp && claude mcp login serro`
   (Codex/Copilot: add `https://mcp.serro.ai/mcp` as an MCP server in their
   config). Never fall back to a context-free review.

## 2. Resolve the program and load context

Resolve, stopping at the first that succeeds: (1) a program name or id in the
user's message (ignore PR numbers and file paths), confirmed with
`list_programs` or `get_program`; (2) `printenv SERRO_PROGRAM`, or a
`SERRO_PROGRAM=` line in `~/.archon/.env`; (3) `git remote get-url origin`
matched against each program's linked repositories or title from
`list_programs`. If none or several match, stop with `SERRO PROGRAM UNRESOLVED`,
list the candidates (id + name) and ask. Never pick one.

Then: `get_program`; `get_program_widget_data` with **no** `widget_type` for the
catalog; then, for catalog types only, in order: `risk_log`,
`customer_requirements`, `decision_log`, `action_items`, `reports`,
`program_memory`. Keep ids, titles, dates. Never invent context; record each
lookup as returned data, empty, or failed.

## 3. Collect the diff

1. If the request contains a PR number (1–7 digits) and `gh` is installed:
   `gh pr view <n> --json number,title,author,baseRefName,headRefName,url,body`
   then `gh pr diff <n>`.
2. If that gave no diff, diff the current branch against the remote default
   branch: `BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's|^origin/||')`;
   `main` if empty; `master` if `git rev-parse --verify origin/$BASE` fails.
   Then `git diff origin/$BASE...HEAD`.
3. If still empty: `git diff` (uncommitted changes).
4. If all are empty, stop: "No change to review: no PR diff, no branch diff, no
   working diff."

Note the source (PR number and title, or branch and base). For large diffs, list
files first (`--name-only` / `--stat`) and read per file.

## 4. Establish the design source of truth

You are not reviewing yet.

1. **Repo candidates** (tracked files only):
   ```bash
   git ls-files | grep -iE '(^|/)(design|architecture|spec|prd|rfc)[^/]*\.(md|mdx)$|(^|/)docs/.*(design|spec|prd|rfc)[^/]*\.(md|mdx)$' | head -40
   ```
   Read the plausible ones. A file path named in the user's message wins over
   anything discovered.
2. **Serro candidates:** `get_program_files` and `get_program` for linked design
   documents, objective and current state; `get_program_widget_data` with
   `widget_type: decision_log` (recorded design decisions are the highest-value
   input: a repo doc goes stale, the log records what was agreed and when);
   `search_confluence` or `drive` if the design lives outside the repo.
3. Post these notes before reviewing:
   - **Primary:** the authoritative document(s), path or URL, and why.
   - **Design intent:** specific, checkable assertions (structure, boundaries,
     naming, data flow, states, error behaviour), quoted. If you cannot quote
     it, it is not checkable; leave it out.
   - **Recorded design decisions:** id, date, what each constrains.
   - **Conflicts within the sources:** where the repo doc and the decision log
     disagree. Do not pick a side silently.
   - **Gaps:** areas the change touches that the design says nothing about.
4. If there is no design source in either place, write `DESIGN SOURCE: none`.
   Do not reconstruct a design from the code; that makes the review circular.

## 5. Review

Read the diff, then enough surrounding code to tell whether a deviation is real.
Finding types:

1. **Contradiction:** the change does what the design says not to, or does it
   differently from how the design says.
2. **Decision reversal:** goes against a recorded design decision. Quote it and
   its date.
3. **Silent extension:** a new concept, boundary or state the design does not
   cover. Not automatically wrong, but the design is now behind the code.
4. **Stale design:** the document describes something the code has moved past.
   The fix is to the document; say so.

Rules of evidence:

- Every finding quotes the design assertion **and** cites the diff location
  (`path:line` or hunk). If you cannot quote the design, you are inferring
  intent; drop it.
- Separate "contradicts the design" from "the design is silent".
- Rank by consequence: a boundary violation outranks a naming deviation.

Verdict:

- `drift`: at least one contradiction or decision reversal.
- `extends_design`: no contradictions, but the change goes beyond what the
  design covers and the design needs updating.
- `aligned`: consistent with a design source substantive enough to check.
- `no_design_source`: nothing authoritative to check against. Explain what to
  create so the next run is useful. This is a legitimate outcome.

## 6. Report

Present exactly this structure:

```
# Design Review — <program name>

**Verdict:** <ALIGNED | EXTENDS DESIGN | DRIFT | NO DESIGN SOURCE>
**Design source:** <path/URL, or none>
**Change:** <PR title and number, or branch name>

## Summary
<2-3 sentences, consequence first.>

## Findings (<count>)
<each: quoted design assertion, the diff location, why they conflict, and the
smallest change that resolves it>

## Suggested design updates
<where the document should change rather than the code>

## Out of scope
<one line naming what this review did not examine, so nobody reads it as a full
code review>

## Limitations
<Serro lookups that failed or were unavailable (not empty), the diff source if
it fell back from a PR, and any design doc or diff part you did not read.>
```

End with one line: `Verdict: <aligned | extends_design | drift | no_design_source>`.

---

Archon runs this as a fixed multi-step workflow; this skill asks your agent to
follow the same steps itself, so check the Limitations section of the result.
