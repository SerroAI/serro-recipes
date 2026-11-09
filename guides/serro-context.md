## What changes

With this skill installed, your agent checks the program before it plans,
writes or reviews code. It learns what was promised to customers, which risks
are open and which decisions are already made, and works within them:

- **Decisions bind.** If a recorded decision covers the task, the agent follows
  it. If the task needs to reverse one, it stops and names the decision, its
  date and why, instead of reversing it silently.
- **Committed requirements are scope.** A requirement marked committed was
  promised to a named customer. The agent treats partial work on one as
  unfinished, not done.
- **Open risks get tested.** When a change touches a risk, the agent says
  whether it improves, worsens or invalidates it.
- **It cites, not paraphrases.** Items are referenced by id and title so you can
  check it read the real thing.
- **Conflicts come first.** If your request contradicts the program, the agent
  raises that before writing code. Resolving it is your call.

## Where the context comes from

1. **Live, from the Serro MCP**, when it is connected. This is preferred.
2. **`SERRO-CONTEXT.md`** at the repository root, a snapshot of the program.
   The agent treats it as incomplete if it is more than about two weeks old.
3. **Neither:** the agent says so once and works from the code alone. It never
   invents program context or guesses commitments from code comments.

## Keeping the snapshot fresh

To regenerate `SERRO-CONTEXT.md` from live Serro data, install the
[Context Pack](/docs/guides/serro-context-pack) workflow and run it:

```bash
archon workflow run serro-context-pack "<program name>"
```

Review the diff before committing. The file is a shared statement of what the
program currently holds.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** Add a guest checkout option that skips address entry.

**Agent:** I read SERRO-CONTEXT.md first. It was generated 2026-11-02, so it is
a week old and I treated it as current. Two things apply before I write code.

- **DEC-3 (2026-09-12):** "Address is always collected before payment, for tax
  and fraud checks." Skipping address entry reverses this decision. I won't
  reverse it without your say-so.
- **REQ-7 "Saved cards for guest checkout"** is committed for Northwind. A guest
  flow touches the same screens, so I'll keep it in scope rather than build
  around it.

I would also check **RISK-12 "Duplicate charges on retry"** (high): a new guest
path adds another place the payment call can be retried.

How do you want to proceed?
1. Keep address entry and make it faster for guests (no decision change).
2. Reverse DEC-3. I'd need who agrees and the reason first.
```
