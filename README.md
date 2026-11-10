# Serro Recipes

Portable, context-aware automations you can install into any repo and run with
[Archon](https://archon.diy).

A recipe here is not just a prompt. Every recipe in this repo starts by pulling
**live program context out of Serro** — open risks, committed customer
requirements, decisions, action items, linked reports — and then reasons against
your actual code. That is the whole point: the same YAML behaves differently in
your repo than in ours, because the context is yours.

> **Context makes recipes smart.** Serro holds the context; recipes are the
> portable unit that reads it, reasons, and acts.

### Two kinds of recipe

| Kind | Lives in | Runs on | Installed by |
|---|---|---|---|
| **Workflow** — a multi-step DAG that gathers context, reasons, and writes a report | `recipes/<slug>/` | Archon | `archon workflow install` |
| **Skill** — instructions an agent loads when the task calls for it | `skills/<slug>/` | Claude Code, Codex, Copilot, Archon; ChatGPT by copy-paste | copy `SKILL.md` into the runtime's skills directory |

A workflow is something you *run*. A skill is something an agent *knows*. They
share the context contract — both read program state through Serro MCP — and
differ only in packaging.

Some workflows also ship an **Agent Skill edition** at `skills/<slug>/SKILL.md`
(marked `agentSkill` in `catalog.json`): the same review written as steps your
agent follows itself, so Claude Code, Codex and Copilot can run it without
Archon. Archon still gives the most consistent results, because it runs the
steps as a fixed workflow; the skill edition reports what it could not check.
Today that covers `serro-pr-readiness`, `serro-release-readiness` and
`serro-design-pr-review`.

### A note on vocabulary

We call them **recipes** because "workflow" already means several other things at
Serro — Kafka event pipelines, reporting backends. But a workflow recipe *is* an
Archon workflow on disk, so the CLI still says `archon workflow install`. Recipe =
the thing you browse and install; workflow = what Archon calls it once it lands in
`.archon/workflows/`.

---

## Install a recipe

Archon already speaks "marketplace": it reads a registry JSON, then installs the
pinned workflow into your repo's `.archon/` directory. Point it at this repo's
registry:

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow search serro
archon workflow install serro-pr-readiness
```

Then connect Serro (once per machine — see below) and run it:

```bash
archon workflow run serro-pr-readiness "1234"
```

`archon workflow install` must be run from inside a git repository; it writes to
`<repo-root>/.archon/`.

---

## Install a skill

Skills are a single `SKILL.md`. There is no CLI — you copy the file into the
directory your runtime scans, and it loads when its `description` matches what you
are doing.

**Claude Code** reads `.claude/skills/`:

```bash
mkdir -p .claude/skills/serro-context
curl -fsSL https://raw.githubusercontent.com/SerroAI/serro-recipes/main/skills/serro-context/SKILL.md \
  -o .claude/skills/serro-context/SKILL.md
```

**Codex, Copilot and Archon** resolve the [agentskills.io](https://agentskills.io)
layout, `.agents/skills/`:

```bash
mkdir -p .agents/skills/serro-context
curl -fsSL https://raw.githubusercontent.com/SerroAI/serro-recipes/main/skills/serro-context/SKILL.md \
  -o .agents/skills/serro-context/SKILL.md
```

Swap `.claude`/`.agents` for `~/.claude`/`~/.agents` to install for yourself across
every repo instead of committing it to one.

**ChatGPT** has no skill format. Paste the body of `SKILL.md` into a Project's
custom instructions or a GPT, and connect Serro as an MCP connector if your tier
supports it — the skill's tool calls only work when the tools exist.

A skill is strictly more useful with Serro MCP connected, but the ones here all
degrade honestly without it: they say what they cannot see rather than guessing.

---

## Connect Serro (required, once per machine)

Every recipe in this repo reads context through the **Serro MCP server**. If
Serro is not reachable, the recipes are designed to **fail loudly** rather than
quietly produce a generic, context-free answer.

Register Serro as a user-scoped MCP server in Claude Code:

```bash
claude mcp add --transport http --scope user serro https://mcp.serro.ai/mcp
claude mcp login serro
```

Verify:

```bash
claude mcp list
```

### Why it must be user-scoped

Archon runs headless: it forwards MCP servers to the Claude Agent SDK and loads
`settingSources: ['project', 'user']`, so the Claude Code runtime owns discovery
and OAuth refresh. A user-scoped server registered with `claude mcp add` is
visible to that runtime.

**A Serro connector added inside the claude.ai UI is _not_ visible to Archon.**
This was verified empirically — a headless probe workflow saw only locally
registered stdio servers and reported no Serro tools. If you have Serro working
in claude.ai and a workflow still reports no context, this is why. Run the two
commands above.

### Alternative: token auth (CI / fully headless)

Each bundle ships `mcp/serro.json.example`. Copy it to `.archon/mcp/serro.json`,
export a token, and add `mcp: .archon/mcp/serro.json` to the workflow's context
node. Archon expands `$SERRO_MCP_TOKEN` from its own process env
(`~/.archon/.env`) — **not** from your repo's `.env`, which Archon deliberately
strips at boot so app secrets never leak into workflow processes.

---

## Telling a recipe which program to use

In order of precedence:

1. A program name or id in the run message —
   `archon workflow run serro-release-readiness "Checkout Revamp"`
2. `SERRO_PROGRAM` in `~/.archon/.env`
3. Repo-name match — the recipe calls `list_programs` and matches the current
   repo against each program's linked repositories

If none resolve, the recipe stops and asks you to name a program. It does not
guess.

---

## What's in here

### Workflows (Archon)

| Recipe | What it does | Writes |
|---|---|---|
| `serro-pr-readiness` | Judges a PR against the program's open risks, committed requirements and recorded decisions. Not a style review — a "does this land safely in this program" review. | Report artifact |
| `serro-release-readiness` | Program-level go/no-go: unresolved risks, committed-but-unshipped requirements, open action items, recent repo and meeting activity. | Report artifact |
| `serro-design-pr-review` | Reviews a PR against a design source of truth (`design.md` or a Serro-linked design doc) plus the program's design decisions. | Report artifact |
| `serro-context-pack` | Compiles program context into a committed `SERRO-CONTEXT.md` + a Claude skill, so **any** agent (Claude Code, Codex, Codepress) inherits the context without Archon. | Repo file + skill |
| `serro-daily-brief` | One digest of what is on today — meetings, Jira movement, program flags — scoped to your identity rather than a program. Fails rather than emitting an empty brief when Serro is unreachable. | Report artifact |
| `serro-digest-builder` | The weekly, program-scoped counterpart: seven days of meetings, Jira movement, Slack discussion and open risks, condensed. | Report artifact |
| `serro-effort-analysis` | Splits a window of engineering effort into NC / KTLO / IP / QI, per engineer and per workstream, with an explicit data-confidence note. | Report artifact |
| `serro-sop-writer` | Reconstructs an incident from meeting, Slack and Jira context, runs a five-whys root cause, and drafts a runbook. Confluence publish is behind an approval gate. | Report artifact, and a Confluence page **only if you approve** |
| `serro-decision-drift-detector` | Audits the checkout against a program's locked decisions and committed requirements, grouped by decision with `file:line` evidence. Snapshots the tree and asserts it changed nothing. | Report artifact |
| `serro-incident-response` | The full loop: characterise, propose a fix, draft a runbook — then **one approval** files the issue, publishes the SOP and opens a draft PR. | Report artifacts, and on approval: a Serro issue, a Confluence page, a draft PR |

Most of them are **read-only against your codebase** and write reports into
Archon's per-run artifacts directory. Two touch your repo, and both are explicit
about it:

- `serro-context-pack` writes exactly one file, `SERRO-CONTEXT.md`, at the root.
- `serro-incident-response` can create a branch, commit, push and open a **draft**
  PR — only after you approve its gate, and only when your run input names a repo
  path. It declares `mutates_checkout: true` accordingly.

`serro-decision-drift-detector` reads your code and then *proves* it changed
nothing, by snapshotting the working tree up front and asserting it is identical
at the end.

### Skills (cross-runtime)

| Skill | What it teaches an agent | Triggers on |
|---|---|---|
| `serro-context` | Load the program context that governs this repo before planning or implementing, and what to do when a request contradicts it | any non-trivial task; "why is it built this way" |
| `serro-standup` | Draft a status update from what actually landed, with evidence on every claim — shipped means merged, blocked names the decision needed | "status update", "standup", "what did we ship" |
| `serro-meeting-prep` | Prep from the delta since the last meeting: what changed, whose promises are still open, what needs a decision today | "prep for the sync", "build an agenda" |
| `serro-decision-check` | Find out whether a question was already decided before re-opening it, and report the decision with its date and rationale | "has this been decided", "can we change X" |

Skills read; they do not write. None of them post anywhere or modify your code.

### Agent Skill editions of workflows

| Skill edition | Same as | Say to your agent |
|---|---|---|
| `serro-pr-readiness` | the PR Readiness workflow | "Use serro-pr-readiness: is PR &lt;number&gt; ready to merge?" |
| `serro-release-readiness` | the Release Readiness workflow | "Use serro-release-readiness: are we ready to ship &lt;program name&gt;?" |
| `serro-design-pr-review` | the Design PR Review workflow | "Use serro-design-pr-review: does PR &lt;number&gt; still match the design?" |

Install one like any skill (`npx skills add SerroAI/serro-recipes --skill <slug>`,
or ask an agent with the Serro MCP to call `get_workflow` with your runtime as
`target`). Like the workflows, they write nothing to your repo.

Two recipes can write outside your machine. Both do it only after an explicit
approval node, as the identity `mcp__serro__whoami` reports, into that identity's
own workspace — and both publish nothing at all if you decline:

| Recipe | On approval it can |
|---|---|
| `serro-sop-writer` | publish one SOP to Confluence |
| `serro-incident-response` | file an issue in Serro, publish an SOP to Confluence, and open a draft PR |

Everything else here reads. Nothing in this repo writes anywhere without a human
approving it in the run first.

---

## Read before you run

These recipes execute an AI agent against your repository. That deserves the
same scrutiny as any dependency:

- Every entry in `workflows.json` is pinned to a **commit SHA**. Installing
  `serro-pr-readiness` today and again in six months gets you byte-identical
  files unless the registry SHA moves.
- The YAML is short and readable on purpose. Read it before you run it.
- `archon workflow install` only accepts `github.com` sources, so what you
  install is always reviewable in a public repo.

---

## Publishing a recipe

V1 publishing is a pull request.

Open the PR against **`staging`**, not `main`; see "Staging first, then main" below.

1. Add the files for your kind:
   - workflow → `recipes/<slug>/<slug>.yaml` plus a `README.md`
   - skill → `skills/<slug>/SKILL.md` (frontmatter `name` **must** equal the slug)
2. If a workflow needs the shared Serro context preamble, run
   `bun scripts/sync-shared.ts` to vendor `shared/` into your bundle.
3. Add an entry to **`catalog.json`** — the canonical list — with its `kind`,
   `targets` and the presentation fields every surface renders: `tagline`,
   `requires`, `writes`, `outputs`, `requiresIntegrations`, and where they apply
   `verdicts`, `triggersOn`, `runsInChat`/`chatCaveat` and `addedAt`.
   `lint-registry.ts` checks them.
4. Optionally write **`guides/<slug>.md`**, the long-form page shown on Serro's
   public guides: how it reasons, how to run it, how to read the result, and an
   example. Start at `##` headings and don't use "Set up", "Details" or
   "Related guides" (the page renders those). To ship a workflow without
   Archon too, add `skills/<slug>/SKILL.md` and an `agentSkill: { "invoke": "…" }`
   field, and list the runtimes it reaches in `targets`.
5. Pin it after your commit lands on `staging`, to that merge commit:
   `bun scripts/pin-sha.ts <merge sha> && bun scripts/build-registry.ts && bun scripts/lint-registry.ts --network`.
   Pass the sha: with no argument `pin-sha.ts` pins to `origin/main`.
   Until the pin moves, a new Agent Skill edition does not exist at the pinned
   commit: the Serro MCP falls back to the Archon bundle for it, and consumers
   should not sync that catalog yet.
6. Before opening a PR, regenerate and validate:
   `bun scripts/build-registry.ts && bun scripts/lint-registry.ts`.

Slugs are `^[a-z0-9-]+$` (Archon enforces this) and a workflow's main YAML must be
named `<slug>.yaml`.

### Where this catalog is used

`catalog.json` and `guides/` are the source of truth for every surface that shows
a recipe:

- **Serro's gallery and public guides** (btnextjs) copy them in with
  `scripts/sync-recipes.ts` at a pinned commit. They are never edited there.
- **The Serro MCP** (`list_workflows`, `get_workflow`) reads `catalog.json` live:
  production from `main`, staging from `staging`. A merged change reaches agents
  without a deploy.

### Staging first, then main

Recipe changes go to the **`staging`** branch first. Serro's staging MCP reads
`catalog.json` from `staging` (kgqa's `RECIPES_CATALOG_REF`); production, the
Archon CLI and `npx skills add` read `main`.

1. Open your PR against `staging`, merge it, then pin `staging` to the merge
   commit: `bun scripts/pin-sha.ts <sha> && bun scripts/build-registry.ts && bun scripts/lint-registry.ts --network`,
   in a second PR against `staging`.
2. Test on staging (gallery, public guides, MCP `get_workflow`). Sync btnextjs
   staging to that commit with `scripts/sync-recipes.ts --ref <sha>`.
3. Promote with a PR from `staging` to `main` (it needs an approving review),
   merged with **Create a merge commit**. Squash and rebase both write new
   commits, so the pinned staging commits would not be on `main`.

### catalog.json vs workflows.json

`catalog.json` is canonical and holds every kind. **`workflows.json` is generated
from it** — the Archon-shaped projection containing only `archon-workflow` entries
that are actually pinned, because that is all Archon's CLI can parse or install.
Never hand-edit it; `lint-registry.ts` fails when it is stale.

For a skill, `description` is the whole ballgame: it is the only thing a runtime
sees when deciding whether to load the skill. Write it as the situations it applies
to, not as a summary of the file.

### Workflow bundle layout

Archon's directory installer maps subdirectories by convention:

```
recipes/serro-pr-readiness/
  serro-pr-readiness.yaml    → .archon/workflows/serro-pr-readiness.yaml
  README.md                  → .archon/workflows/README.md
  commands/*.md              → .archon/commands/
  scripts/*                  → .archon/scripts/
  mcp/*                      → .archon/mcp/
  skills/*                   → .archon/skills/
```

Only **top-level files** inside each subdirectory are installed — nested
directories under `commands/` or `skills/` are skipped. Keep those flat.

Two known, harmless installer behaviours:

- Every bundle's `README.md` installs to the same `.archon/workflows/README.md`,
  so the second bundle you install prints `Skipped (exists)` for it. The name is
  kept anyway because GitHub renders `README.md` in the directory listing, which
  is how people browse these.
- `shared/` is vendored into each bundle by `scripts/sync-shared.ts` for the same
  reason: the installer only fetches files inside the bundle directory, so a
  shared context command has to physically exist in every bundle that uses it.
  `scripts/lint-registry.ts` fails on drift.
- A bundle's `skills/` files land in `.archon/skills/`, which is **not** one of the
  four directories Archon actually resolves skills from (`.agents/skills/`,
  `.claude/skills/`, and the `~` versions of both). That is why
  `serro-context-pack` prints a copy command at the end of its run rather than
  assuming the skill is live. Worth an upstream fix.
