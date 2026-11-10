#!/usr/bin/env bun
/**
 * Pin every registry entry to a commit SHA.
 *
 *   bun scripts/pin-sha.ts                  # pin to origin/main's current HEAD
 *   bun scripts/pin-sha.ts <40-char-sha>    # pin to an explicit commit
 *   bun scripts/pin-sha.ts --local          # pin to local HEAD (dev only)
 *
 * `archon workflow install` downloads files at the pinned SHA, so an entry
 * pointing at an unpushed commit installs as a 404. Default therefore reads
 * origin/main rather than whatever is checked out locally.
 *
 * Run this AFTER your change is merged (to staging first: pass its merge sha), then
 * commit the registry bump. With no sha it pins to origin/main.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const CATALOG = join(ROOT, 'catalog.json');

const args = process.argv.slice(2);
const explicit = args.find(a => /^[0-9a-f]{40}$/.test(a));
const useLocal = args.includes('--local');
// A short or mistyped sha must not silently fall through to origin/main.
const unknown = args.filter(a => a !== '--local' && a !== explicit);
if (unknown.length > 0) {
  console.error(
    `Unrecognised argument(s): ${unknown.join(' ')}. Pass a full 40-character lowercase sha, --local, or nothing (origin/main).`
  );
  process.exit(1);
}

function git(args: string[]): string {
  const r = Bun.spawnSync(['git', ...args], { cwd: ROOT });
  if (r.exitCode !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(r.stderr).trim()}`);
  }
  return new TextDecoder().decode(r.stdout).trim();
}

let sha: string;
if (explicit) {
  sha = explicit;
} else if (useLocal) {
  sha = git(['rev-parse', 'HEAD']);
  console.warn('! Pinning to LOCAL HEAD — installs will 404 until this commit is pushed.');
} else {
  git(['fetch', 'origin', 'main', '--quiet']);
  sha = git(['rev-parse', 'origin/main']);
}

if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`Not a valid commit SHA: ${sha}`);

const text = readFileSync(CATALOG, 'utf8');
const updated = text.replace(/"sha":\s*"[0-9a-f]{40}"/g, `"sha": "${sha}"`);
const count = (text.match(/"sha":\s*"[0-9a-f]{40}"/g) ?? []).length;

if (updated === text) {
  console.log(`Already pinned to ${sha.slice(0, 8)} — nothing to change.`);
} else {
  writeFileSync(CATALOG, updated);
  console.log(`Pinned ${String(count)} catalog entr${count === 1 ? 'y' : 'ies'} to ${sha}`);
  // workflows.json is generated, so it has to be rebuilt from the new pins.
  console.log('Next: bun scripts/build-registry.ts && bun scripts/lint-registry.ts --network');
}
