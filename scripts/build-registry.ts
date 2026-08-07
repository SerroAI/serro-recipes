#!/usr/bin/env bun
/**
 * Generate workflows.json (the Archon-shaped registry) from catalog.json.
 *
 *   bun scripts/build-registry.ts           # write workflows.json
 *   bun scripts/build-registry.ts --check   # fail if it is stale, write nothing
 *
 * catalog.json is canonical and holds every artifact kind. Archon's CLI only
 * understands one shape — a flat array of marketplace entries — so this projects
 * the catalog down to it:
 *
 *   - keep only `kind: archon-workflow` (a skill has no <slug>.yaml, so
 *     `archon workflow install` physically cannot install one)
 *   - drop unpinned entries (a placeholder SHA installs as a GitHub 404)
 *   - emit exactly the fields Archon parses, and nothing else
 *
 * Generating rather than hand-maintaining is what keeps the catalog and the
 * registry from drifting — the failure mode being a gallery that advertises a
 * workflow the CLI cannot install, or a SHA bump that only lands in one file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const CATALOG = join(ROOT, 'catalog.json');
const REGISTRY = join(ROOT, 'workflows.json');
const UNPINNED = '0'.repeat(40);

/** Fields Archon's CLI reads. Anything else is ignored by it, so we omit it. */
const ARCHON_FIELDS = [
  'slug',
  'name',
  'author',
  'description',
  'sourceUrl',
  'sha',
  'tags',
  'archonVersionCompat',
  'featured',
] as const;

interface CatalogEntry {
  slug: string;
  kind: string;
  sha: string;
  featured?: boolean;
  [key: string]: unknown;
}

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')) as {
  entries: CatalogEntry[];
};

if (!Array.isArray(catalog.entries)) {
  console.error('catalog.json must have an `entries` array.');
  process.exit(1);
}

const projected = catalog.entries
  .filter(e => e.kind === 'archon-workflow')
  .filter(e => e.sha !== UNPINNED)
  .map(e => {
    const out: Record<string, unknown> = {};
    for (const field of ARCHON_FIELDS) {
      if (field === 'featured' && !e.featured) continue;
      if (e[field] === undefined) continue;
      out[field] = e[field];
    }
    return out;
  });

const rendered = `${JSON.stringify(projected, null, 2)}\n`;

const skippedUnpinned = catalog.entries.filter(
  e => e.kind === 'archon-workflow' && e.sha === UNPINNED
).length;
const skippedKind = catalog.entries.filter(e => e.kind !== 'archon-workflow').length;

if (process.argv.includes('--check')) {
  let current: string | null = null;
  try {
    current = readFileSync(REGISTRY, 'utf8');
  } catch {
    current = null;
  }
  if (current !== rendered) {
    console.error(
      'workflows.json is stale — regenerate it: bun scripts/build-registry.ts'
    );
    process.exit(1);
  }
  console.log(
    `workflows.json is up to date (${String(projected.length)} installable entries).`
  );
} else {
  writeFileSync(REGISTRY, rendered);
  console.log(`Wrote workflows.json — ${String(projected.length)} entries.`);
  if (skippedUnpinned > 0) {
    console.log(
      `  skipped ${String(skippedUnpinned)} unpinned workflow(s) — run: bun scripts/pin-sha.ts`
    );
  }
  if (skippedKind > 0) {
    console.log(
      `  skipped ${String(skippedKind)} non-workflow entr${skippedKind === 1 ? 'y' : 'ies'} (skills etc. are not Archon-installable)`
    );
  }
}
