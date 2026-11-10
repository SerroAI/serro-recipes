## What changes

Customer promises live with product, in Serro's customer requirements. Code
changes live with engineering. The two usually meet only when something breaks.
With this skill, a coding agent checks the promises before it changes behavior,
and afterwards records which PR delivered, changed or put at risk which customer
ask, in a **ledger in Serro** that product can read.

**Beta.** It needs datasets with declared schemas enabled for your workspace.
The skill includes the ledger's schema; you create it once in Ask Serro.
Customer requirements are only read, never edited.

## How it works

1. **Check before changing.** The agent lists what the change touches
   (features, endpoints, flows, limits, defaults) and matches it, by meaning
   rather than wording, against the program's customer requirements and the
   decisions that narrow them.
2. **Stop and report.** For each ask it says whether the change delivers,
   changes or risks it, and for which customers. Then you decide.
3. **Record after the PR.** It adds a ledger row per affected ask. A change that
   risks or alters a promise is recorded only with the name of the person who
   accepted that, so the ledger never holds an anonymous broken promise.
4. **Answer product's questions.** "Did we deliver X for this customer?", "what
   changed for them this month?" and "which commitments are at risk?" come from
   the ledger.

## Example output

_Illustrative example for a fictional program. A real run uses your own program's data._

```markdown
**User:** I'm lowering the default export page size from 10,000 to 1,000 rows.

**Agent:** COMMITMENTS touched by "default export page size 10,000 → 1,000"
"Full-history export in one file" (Northwind, Globex; committed): RISKS
  why: a full export above 1,000 rows now needs pagination the export UI doesn't do
  earlier: acme/web#402 delivered it in September
No other matches (searched exports, downloads, CSV, reports, limits).

This would break a committed ask for two customers. Do you want to go ahead?
If you do, who accepted the risk?
```
