# serro-context-pack

Compiles the program's live context into a single committed `SERRO-CONTEXT.md` at
your repo root — so **any** agent inherits it as ordinary repository context, with
no Serro connection of its own.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-context-pack
archon workflow run serro-context-pack "Checkout Revamp"
```

This is the cheapest way to get value out of Serro context outside Serro. Claude
Code, Codex, Cursor, Codepress — none of them need an integration. They read a
markdown file, which they already do.

## What lands in the file

| Section | Notes |
|---|---|
| Objective | Verbatim where possible |
| Current state | 3–5 lines |
| Committed customer requirements | `committed` and `shipped` only — the request backlog is deliberately excluded so agents don't invent scope |
| Open risks | With severity and why it matters here |
| Decisions already made | The section that most changes agent behaviour: it stops an agent re-litigating a settled choice |
| Open action items | With owners |
| How to use this file | Imperative instructions to the reading agent |
| Not in this file | What the agent must not assume it knows |

Every item keeps its id and status, so an agent can say "risk R-14 says X" rather
than "there's some concern about X". The file states its own generation date —
stale context that looks current is the failure mode to avoid.

## The companion skill

The bundle ships a Claude skill that teaches any Claude agent when to read the
pack, when to prefer live Serro tools, and how to behave when the two disagree:

```bash
mkdir -p .claude/skills/serro-context
cp .archon/skills/serro-context.md .claude/skills/serro-context/SKILL.md
```

The skill works with **or** without Archon. With Serro MCP connected it prefers
live tools; with only the file present it uses the file; with neither it says so
once and proceeds on the code alone rather than inventing context.

## This one writes to your repo

Unlike the other workflows here, this writes exactly one file —
`SERRO-CONTEXT.md` at the root. Nothing is committed or pushed.

```bash
git diff -- SERRO-CONTEXT.md
```

A `verify` node fails the run if the file is missing, under 15 lines, or missing
its required sections — so a failed generation cannot masquerade as a successful
one. Regeneration overwrites wholesale rather than merging: a half-updated context
file is the only outcome worse than a stale one.

## Secrets

The pack is committed, so the workflow is instructed to omit credentials,
customer PII and auth-gated internal URLs, and to note the omission. Review the
diff before committing — you are publishing a statement about what the program
holds to everyone with repo access.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- A resolvable program

## Suggested cadence

Re-run when the program's insights refresh lands, or weekly. `SERRO-CONTEXT.md`
is a cache, not a source of truth.
