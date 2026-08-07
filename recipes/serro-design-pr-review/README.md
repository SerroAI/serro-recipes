# serro-design-pr-review

Checks a PR against the design source of truth — a `design.md`, a PRD, or a
design doc linked to the program — plus the design decisions the program has
actually recorded.

```bash
export ARCHON_MARKETPLACE_URL=https://raw.githubusercontent.com/SerroAI/serro-recipes/main/workflows.json
archon workflow install serro-design-pr-review
archon workflow run serro-design-pr-review "1234"
archon workflow run serro-design-pr-review "1234 docs/design.md"  # pin the design doc
```

## Where the design comes from

Two sides, and the second is the reason this beats a plain "read design.md"
prompt:

- **The repo** — tracked files matching `design|architecture|spec|prd|rfc`
  (`*.md`, `*.mdx`), discovered with `git ls-files` so build output is never
  scanned. A path in the run message overrides discovery.
- **Serro** — linked program documents, the program objective, and the
  **decision log**. A committed `design.md` goes stale within weeks; the decision
  log records what the team actually agreed, and when.

Where those two disagree, the review says so rather than silently picking a
side — an ambiguous design is itself the finding.

## Finding types

| Type | Meaning |
|---|---|
| Contradiction | The change does what the design says not to do |
| Decision reversal | The change reverses a recorded design decision (quoted, with date) |
| Silent extension | New concept, boundary or state the design does not cover — the design is now behind the code |
| Stale design | The document describes something the code has moved past — fix the doc, not the code |

Every finding quotes the design assertion **and** cites the diff location. If the
design cannot be quoted, the finding is inference and gets dropped.

## Verdicts

| Verdict | Meaning |
|---|---|
| `drift` | At least one contradiction or decision reversal |
| `extends_design` | No contradictions, but the design needs updating to match |
| `aligned` | Consistent with a design source substantive enough to check |
| `no_design_source` | Nothing authoritative to check against |

`no_design_source` is a real, useful outcome: the report says what to create so
the next run has teeth. The workflow will **not** reconstruct a design from the
code — that would make the review circular.

## Output

`$ARTIFACTS_DIR/design-review.md`, plus `design-source.md` and
`design-candidates.txt`.

The report names what it did **not** examine, so it is never mistaken for a full
code review. The design document is never edited; suggested doc changes are
listed for a human to apply.

## Requirements

- Serro MCP connected (see the [repo README](../../README.md#connect-serro-required-once-per-machine))
- `gh` CLI for PR-number mode; otherwise falls back to the current branch diff
- A resolvable program
