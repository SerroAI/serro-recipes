## What changes

Long migrations stall in the middle: thirty files left, nobody sure which are
claimed, two people fixing the same one, and status requests in Slack. With this
skill, the migration lives on a **board in Serro**: one row per unit (a file,
package or service) with its status, owner, branch, PR and blocker. Every
teammate's agent works from the same board, and one person can fan out
subagents over it. The widget is the burn-down.

**Beta.** It needs datasets with declared schemas enabled for your workspace.
The skill includes the board's schema; you create it once in Ask Serro.

## How it works

1. **Seed.** The agent finds every unit with a command you can re-run (for
   example, every file still importing an old library) and adds the new ones to
   the board as `todo`.
2. **Pick and claim.** Any agent takes the next open unit and marks it
   `in_progress` with your name. The claim is the lock: if another agent claimed
   it first, Serro refuses the second claim and the agent takes the next unit.
3. **Work and record.** It migrates that unit in a branch, opens the PR, and
   moves the row to `in_review` with the PR link, then `done` when it merges. If
   it gets stuck, the row says `blocked` and why.
4. **Status.** Ask for the state of the migration and get counts by status and
   area, stale claims, and the blockers that keep repeating.

The board changes only on real transitions, and you approve each change (or
allow edits to the board for the session).

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Pick up the next item in the Radix migration.

**Agent:** Board "Migration: Radix themes": 9 of 25 done, 3 in progress, 2 in
review, 1 blocked. Next open unit: `src/components/settings/TeamPanel.tsx`.

Claiming it for you… claimed. Migrated Button and IconButton to the shared
components; lint and unit tests pass. Opened PR #482.

Board update: TeamPanel.tsx → in_review, PR #482. Apply it?

**User:** Yes.

**Agent:** MIGRATION Radix themes: 9/25 done, 2 in progress, 3 in review, 1 blocked
Stale: src/app/billing/Plans.tsx (dana@acme.dev, since Nov 3)
Blocked: "needs a Tabs variant in the shared component" (1 unit)
```
