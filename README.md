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
| **Skill** — instructions an agent loads when the task calls for it | `skills/<slug>/` | Claude Code, Codex, Copilot, Archon; ChatGPT by copy-paste | `npx skills add` (or copy `SKILL.md` yourself) |

A workflow is something you *run*. A skill is something an agent *knows*. They
share the context contract — both read program state through Serro MCP — and
differ only in packaging.

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

A skill is a single `SKILL.md` that your agent loads when its `description` matches
what you are doing. The easiest way in is the
[agentskills.io](https://skills.sh) CLI:

```bash
npx skills add SerroAI/serro-recipes --skill serro-context
```

It prompts for which agents to install into, copies the skill into each one's
skills directory, and records the install in a `skills-lock.json` at your repo
root — which is what lets `npx skills update` re-fetch the latest later.

| Flag | Effect |
|---|---|
| `-g` | install for yourself across every repo, not just this one |
| `-a claude-code -a codex` | target specific agents, skipping the prompt |
| `-y` | non-interactive, for CI |

Omit `--skill` to pick from all of them interactively.

Verified against this repo: `npx skills add SerroAI/serro-recipes --skill
serro-context -a claude-code -y` writes `.claude/skills/serro-context/SKILL.md`
plus `skills-lock.json`, and `npx skills update` refreshes it.

### Or copy the file yourself

No CLI, no dependency — but it is a plain copy, so it will not auto-update.

**Claude Code** reads `.claude/skills/`:

```bash
mkdir -p .claude/skills/serro-context
curl -fsSL https://raw.githubusercontent.com/SerroAI/serro-recipes/main/skills/serro-context/SKILL.md \
  -o .claude/skills/serro-context/SKILL.md
```

**Codex, Copilot and Archon** resolve the agentskills.io layout, `.agents/skills/`:

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

Every one of them is **read-only against your codebase**. They write reports
into Archon's per-run artifacts directory. `serro-context-pack` is the single
exception and writes exactly one file, `SERRO-CONTEXT.md`, at the repo root.

### Skills (cross-runtime)

| Skill | What it teaches an agent | Triggers on |
|---|---|---|
| `serro-context` | Load the program context that governs this repo before planning or implementing, and what to do when a request contradicts it | any non-trivial task; "why is it built this way" |
| `serro-standup` | Draft a status update from what actually landed, with evidence on every claim — shipped means merged, blocked names the decision needed | "status update", "standup", "what did we ship" |
| `serro-meeting-prep` | Prep from the delta since the last meeting: what changed, whose promises are still open, what needs a decision today | "prep for the sync", "build an agenda" |
| `serro-decision-check` | Find out whether a question was already decided before re-opening it, and report the decision with its date and rationale | "has this been decided", "can we change X" |

Skills read; they do not write. None of them post anywhere or modify your code.

None of the recipes here post to GitHub, Slack, Linear, or Serro. Nothing in this
repo has write access to your systems.

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

1. Add the files for your kind:
   - workflow → `recipes/<slug>/<slug>.yaml` plus a `README.md`
   - skill → `skills/<slug>/SKILL.md` (frontmatter `name` **must** equal the slug)
2. If a workflow needs the shared Serro context preamble, run
   `bun scripts/sync-shared.ts` to vendor `shared/` into your bundle.
3. Add an entry to **`catalog.json`** — the canonical list — with its `kind` and
   `targets`.
4. Pin it: `bun scripts/pin-sha.ts` after your commit lands on `main`.
5. Regenerate and validate:
   `bun scripts/build-registry.ts && bun scripts/lint-registry.ts`.

Slugs are `^[a-z0-9-]+$` (Archon enforces this) and a workflow's main YAML must be
named `<slug>.yaml`.

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
