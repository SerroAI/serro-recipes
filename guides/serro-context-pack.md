## What it does

Context Pack writes the program's live context into one file, `SERRO-CONTEXT.md`
at your repo root. Any agent can then read it as ordinary repository context,
with no Serro connection of its own. Claude Code, Codex, Cursor and Codepress
all read Markdown files already.

## What lands in the file

| Section | Notes |
| --- | --- |
| Objective | Verbatim where possible |
| Current state | 3 to 5 lines |
| Committed customer requirements | Committed and shipped only. The request backlog is left out so agents don't invent scope |
| Open risks | With severity and why it matters here |
| Decisions already made | The section that most changes agent behaviour: it stops an agent re-litigating a settled choice |
| Open action items | With owners |
| How to use this file | Imperative instructions for the reading agent |
| Not in this file | What the agent must not assume it knows |

Every item keeps its id and status, so an agent can say "RISK-12 says X"
instead of "there is some concern about X". The file states its own generation
date. Open risks and Decisions already made always appear, and say "None
recorded" when Serro has nothing, so a reader can tell absence from omission.
Other sections with no data are left out rather than guessed.

## Running it

```bash
archon workflow run serro-context-pack "Checkout Revamp"
```

This workflow writes to your repo. It creates or overwrites exactly one file,
`SERRO-CONTEXT.md`. Nothing is committed or pushed. Review the change before you
commit it:

```bash
git diff -- SERRO-CONTEXT.md   # after a regeneration
cat SERRO-CONTEXT.md           # first run: the file is new, so git diff shows nothing
```

A final check fails the run if the file is missing, shorter than 15 lines, or
missing its required sections, so a failed generation can't pass as a success.
Regeneration overwrites the file instead of merging, because a half-updated
context file is worse than a stale one.

## Before you commit it

The file is committed, so everyone with repo access can read it. The workflow is
told to leave out credentials, customer personal data and internal URLs behind
auth, and to note the omission. Read it anyway.

## The companion skill

The bundle ships the [Program Context](/docs/guides/serro-context) skill. It
teaches an agent when to read the pack, when to prefer live Serro tools, and what
to do when the two disagree:

```bash
mkdir -p .claude/skills/serro-context
cp .archon/skills/serro-context.md .claude/skills/serro-context/SKILL.md
```

## How often to run it

Re-run it when the program's insights refresh, or weekly. `SERRO-CONTEXT.md` is
a cache, not the source of truth.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
# Program Context: Checkout Revamp

> Generated from Serro on 2026-11-09. Regenerate with:
> `archon workflow run serro-context-pack "Checkout Revamp"`

## Objective
Cut checkout abandonment to under 18% by Q1 without adding payment providers.

## Current state
Cart and tax rewrite is merged. Payment step is in review. Northwind pilot
starts 2026-12-01.

## Committed customer requirements
| id | requirement | customers | status |
| --- | --- | --- | --- |
| REQ-7 | Saved cards for guest checkout | Northwind | committed |

## Open risks
| id | risk | severity | why it matters here |
| --- | --- | --- | --- |
| RISK-12 | Duplicate charges on retry | high | Retries must be idempotent |

## Decisions already made
| id | date | decision | what it constrains |
| --- | --- | --- | --- |
| DEC-3 | 2026-09-12 | Tax is computed at cart time | Totals must match the quote |

## Open action items
| id | item | owner | status |
| --- | --- | --- | --- |
| AI-21 | Load test the payment step | Priya | open |

## How to use this file
Check changes against open risks, do not contradict recorded decisions, and
treat committed requirements as scope.
```
