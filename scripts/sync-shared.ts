#!/usr/bin/env bun
/**
 * Vendor shared files into each recipe bundle.
 *
 * Archon's directory installer only fetches files inside the bundle directory
 * being installed — it does not follow paths outside it. So anything shared has
 * to physically exist in every bundle that uses it. `shared/` (and, for the
 * context skill, `skills/`) is the single source of truth; this script copies it
 * outward, and `--check` fails CI when a vendored copy has drifted.
 *
 *   bun scripts/sync-shared.ts           # write the copies
 *   bun scripts/sync-shared.ts --check   # report drift, exit 1, write nothing
 *
 * Add a bundle to BUNDLES when it needs a shared file; add to VENDORED when a
 * file must be copied under a different name.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = join(import.meta.dir, '..');

/** Shared files every bundle gets, relative to shared/ and to the bundle dir. */
const COMMON = [
  'commands/serro-context.md',
  'scripts/serro-context-guard.sh',
  'mcp/serro.json.example',
] as const;

/** bundle slug -> extra shared files it needs (COMMON is implied). */
const BUNDLES: Record<string, readonly string[]> = {
  'serro-pr-readiness': ['scripts/collect-pr-diff.sh'],
  'serro-release-readiness': [],
  'serro-design-pr-review': ['scripts/collect-pr-diff.sh'],
  'serro-context-pack': [],
};

/**
 * Explicit src -> dest copies, both relative to the repo root. Used where the
 * vendored name differs from the source name: the serro-context skill is a
 * first-class catalog entry at `skills/serro-context/SKILL.md`, but Archon's
 * installer only copies top-level files out of a bundle's `skills/` directory,
 * so the context-pack bundle carries it flattened.
 */
const VENDORED: readonly { src: string; dest: string }[] = [
  {
    src: 'skills/serro-context/SKILL.md',
    dest: 'recipes/serro-context-pack/skills/serro-context.md',
  },
];

const checkOnly = process.argv.includes('--check');

let drifted = 0;
let written = 0;

function copy(srcRel: string, destRel: string): void {
  const src = join(ROOT, srcRel);
  const dest = join(ROOT, destRel);

  if (!existsSync(src)) {
    console.error(`  ✗ missing source: ${srcRel}`);
    drifted++;
    return;
  }

  const content = readFileSync(src, 'utf8');
  const current = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
  if (current === content) return;

  if (checkOnly) {
    console.error(
      `  ✗ drift: ${destRel} ${current === null ? 'is missing' : 'differs from'} ${srcRel}`
    );
    drifted++;
    return;
  }

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content);
  console.log(`  → ${destRel}`);
  written++;
}

for (const [slug, extras] of Object.entries(BUNDLES)) {
  for (const rel of [...COMMON, ...extras]) {
    copy(join('shared', rel), join('recipes', slug, rel));
  }
}

for (const { src, dest } of VENDORED) copy(src, dest);

if (checkOnly) {
  if (drifted > 0) {
    console.error(
      `\n${String(drifted)} vendored file(s) out of sync. Run: bun scripts/sync-shared.ts`
    );
    process.exit(1);
  }
  console.log('All vendored shared files are in sync.');
} else {
  console.log(
    written === 0
      ? 'Already in sync — nothing to write.'
      : `\nSynced ${String(written)} file(s).`
  );
}
