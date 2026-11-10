#!/usr/bin/env bun
/**
 * Validate catalog.json — and the workflows.json projection generated from it —
 * against the contract Archon's CLI enforces at install time, so a broken entry is
 * caught here rather than in a customer's shell.
 *
 *   bun scripts/lint-registry.ts               # offline checks + vendored-file sync
 *   bun scripts/lint-registry.ts --network     # also verify sources exist at pinned SHAs
 *
 * Mirrors the rules in Archon's packages/cli/src/commands/workflow.ts:
 *   - slug matches ^[a-z0-9-]+$          (hard-enforced by `archon workflow install`)
 *   - sourceUrl host is github.com       (hard-enforced; anything else is rejected)
 *   - the main YAML is named <slug>.yaml (directory installs cannot resolve otherwise)
 *   - sha is a full 40-char hex commit   (install pins to it)
 *
 * Plus the catalog's own rules: a known `kind`, at least one `target`, and files
 * present in the location that kind implies.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const CATALOG = join(ROOT, 'catalog.json');
const UNPINNED = '0'.repeat(40);
const withNetwork = process.argv.includes('--network');

const KINDS = ['archon-workflow', 'agent-skill'] as const;
const TARGETS = [
  'archon',
  'claude-code',
  'codex',
  'copilot',
  'chatgpt',
  'codepress',
] as const;

/** Where each kind's files live, and the file that must exist. */
const LAYOUT: Record<string, { dir: string; required: (slug: string) => string }> = {
  'archon-workflow': { dir: 'recipes', required: slug => `${slug}.yaml` },
  'agent-skill': { dir: 'skills', required: () => 'SKILL.md' },
};

interface Entry {
  slug: string;
  kind: string;
  name: string;
  author: string;
  description: string;
  sourceUrl: string;
  sha: string;
  tags: string[];
  targets: string[];
  archonVersionCompat?: string;
  featured?: boolean;
  beta?: unknown;
  agentSkill?: { invoke?: string };
  tagline?: string;
  requiresIntegrations?: string[];
  requires?: string[];
  writes?: string;
  outputs?: string[];
  verdicts?: { value: string; meaning: string }[];
  addedAt?: string;
  runsInChat?: unknown;
  chatCaveat?: unknown;
  triggersOn?: unknown;
}

const INTEGRATIONS = [
  'serro',
  'github',
  'linear',
  'jira',
  'slack',
  'confluence',
  'notion',
  'google-drive',
  'gitlab',
] as const;

/** Headings a guide must not use: the guide page renders these itself. */
const RESERVED_GUIDE_HEADINGS = /^## (Set up|Details|Related guides)\s*$/m;

let errors = 0;
let warnings = 0;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  errors++;
};
const warn = (m: string) => {
  console.warn(`  ! ${m}`);
  warnings++;
};

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')) as { entries: Entry[] };
if (!Array.isArray(catalog.entries)) {
  console.error('catalog.json must have an `entries` array.');
  process.exit(1);
}
const entries = catalog.entries;
console.log(`Linting ${String(entries.length)} catalog entries...\n`);

const seen = new Set<string>();
for (const e of entries) {
  const p = `[${e.slug ?? '?'}]`;

  if (!e.slug || !/^[a-z0-9-]+$/.test(e.slug)) {
    fail(`${p} slug must be lowercase alphanumeric with hyphens only`);
  }
  if (seen.has(e.slug)) fail(`${p} duplicate slug`);
  seen.add(e.slug);

  if (!KINDS.includes(e.kind as (typeof KINDS)[number])) {
    fail(`${p} unknown kind '${e.kind}' — expected one of: ${KINDS.join(', ')}`);
    continue;
  }

  if (!e.name?.trim()) fail(`${p} name is required`);
  if (!e.author?.trim()) fail(`${p} author is required`);
  if (!e.description?.trim()) fail(`${p} description is required`);
  if (!Array.isArray(e.tags) || e.tags.length === 0) fail(`${p} at least one tag is required`);

  if (!Array.isArray(e.targets) || e.targets.length === 0) {
    fail(`${p} at least one target is required`);
  } else {
    for (const t of e.targets) {
      if (!TARGETS.includes(t as (typeof TARGETS)[number])) {
        fail(`${p} unknown target '${t}' — expected one of: ${TARGETS.join(', ')}`);
      }
    }
  }

  // Archon reads archonVersionCompat; only workflows are Archon-installable.
  if (e.kind === 'archon-workflow') {
    if (!e.archonVersionCompat?.trim()) fail(`${p} archonVersionCompat is required`);
    if (!e.targets?.includes('archon')) fail(`${p} an archon-workflow must target 'archon'`);
  }

  if (!e.sourceUrl?.startsWith('https://github.com/')) {
    fail(`${p} sourceUrl must start with https://github.com/ — Archon rejects other hosts`);
  }

  if (!/^[0-9a-f]{40}$/.test(e.sha ?? '')) {
    fail(`${p} sha must be a full 40-char hex commit SHA`);
  } else if (e.sha === UNPINNED) {
    warn(`${p} sha is the placeholder — run: bun scripts/pin-sha.ts (after the commit is on main)`);
  }

  // The kind determines where the files must live.
  const layout = LAYOUT[e.kind];
  const dir = join(ROOT, layout.dir, e.slug);
  if (!existsSync(dir)) {
    fail(`${p} no directory at ${layout.dir}/${e.slug}`);
    continue;
  }

  const required = layout.required(e.slug);
  if (!existsSync(join(dir, required))) {
    if (e.kind === 'archon-workflow') {
      const yamls = readdirSync(dir).filter(f => f.endsWith('.yaml'));
      if (yamls.length !== 1) {
        fail(`${p} needs ${required} (or exactly one .yaml); found: ${yamls.join(', ') || 'none'}`);
      }
    } else {
      fail(`${p} missing ${layout.dir}/${e.slug}/${required}`);
    }
  }

  if (!e.sourceUrl.includes(`/${layout.dir}/${e.slug}`)) {
    fail(`${p} sourceUrl does not point at ${layout.dir}/${e.slug}`);
  }
}

// Presentation fields: the gallery, public guides and the MCP all render these.
console.log('\nChecking presentation fields...');
const nonEmptyStrings = (v: unknown) =>
  Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string' && x.trim());
for (const e of entries) {
  const p = `[${e.slug}]`;
  if (!e.tagline?.trim()) fail(`${p} tagline is required`);
  if (!e.writes?.trim()) fail(`${p} writes is required — say plainly what installing it writes`);
  if (!nonEmptyStrings(e.requires)) fail(`${p} requires must be a non-empty string array`);
  if (!nonEmptyStrings(e.outputs)) fail(`${p} outputs must be a non-empty string array`);
  if (!nonEmptyStrings(e.requiresIntegrations)) {
    fail(`${p} requiresIntegrations must be a non-empty string array`);
  } else {
    for (const id of e.requiresIntegrations!) {
      if (!INTEGRATIONS.includes(id as (typeof INTEGRATIONS)[number])) {
        fail(`${p} unknown integration '${id}' — expected one of: ${INTEGRATIONS.join(', ')}`);
      }
    }
  }
  if (e.verdicts !== undefined && !(Array.isArray(e.verdicts) && e.verdicts.every(v => v.value && v.meaning))) {
    fail(`${p} verdicts must be [{ value, meaning }]`);
  }
  if (e.beta !== undefined && typeof e.beta !== 'boolean') {
    fail(`${p} beta must be true or false`);
  }
  if (e.runsInChat !== undefined && typeof e.runsInChat !== 'boolean') {
    // The MCP reads this with bool(), so the string "false" would mean true.
    fail(`${p} runsInChat must be true or false`);
  }
  if (e.chatCaveat !== undefined) {
    if (typeof e.chatCaveat !== 'string' || !e.chatCaveat.trim()) {
      fail(`${p} chatCaveat must be a non-empty string`);
    } else if (e.runsInChat !== true) {
      fail(`${p} chatCaveat only applies when runsInChat is true`);
    }
  }
  if (e.triggersOn !== undefined && (typeof e.triggersOn !== 'string' || !e.triggersOn.trim())) {
    fail(`${p} triggersOn must be a non-empty string`);
  }
  if (e.addedAt !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(e.addedAt)) {
    fail(`${p} addedAt must be YYYY-MM-DD`);
  }
}

// An agent-skill edition lets a workflow run without Archon. It shares the slug,
// so it lives at skills/<slug>/ beside the plain skills.
console.log('\nChecking agent-skill editions...');
for (const e of entries.filter(x => x.agentSkill !== undefined)) {
  const p = `[${e.slug}]`;
  if (e.kind !== 'archon-workflow') fail(`${p} agentSkill is only for archon-workflow entries`);
  if (!e.agentSkill?.invoke?.trim()) fail(`${p} agentSkill.invoke is required — what to say to the agent`);
  if (!e.targets?.some(t => t !== 'archon')) {
    fail(`${p} agentSkill is set but targets lists only archon — add the runtimes it reaches`);
  }
  if (!existsSync(join(ROOT, 'skills', e.slug, 'SKILL.md'))) {
    fail(`${p} agentSkill is set but skills/${e.slug}/SKILL.md is missing`);
  }
}
for (const e of entries.filter(x => x.kind === 'archon-workflow' && !x.agentSkill)) {
  if (e.targets?.some(t => t !== 'archon')) {
    fail(`[${e.slug}] lists non-Archon targets but has no agentSkill edition to run there`);
  }
}

// Guides are optional, but each must belong to an entry and leave the page's own
// headings alone.
console.log('\nChecking guides...');
const guideDir = join(ROOT, 'guides');
const slugs = new Set(entries.map(e => e.slug));
if (existsSync(guideDir)) {
  for (const file of readdirSync(guideDir).filter(f => f.endsWith('.md'))) {
    const slug = file.slice(0, -3);
    if (!slugs.has(slug)) {
      fail(`guides/${file} has no catalog entry`);
      continue;
    }
    const prose = readFileSync(join(guideDir, file), 'utf8').replace(/```[\s\S]*?```/g, '');
    if (/^# /m.test(prose)) fail(`guides/${file} uses a '# ' heading — the page already has the title`);
    if (RESERVED_GUIDE_HEADINGS.test(prose)) {
      fail(`guides/${file} uses a heading the guide page renders itself (Set up, Details, Related guides)`);
    }
  }
}
for (const e of entries) {
  if (!existsSync(join(guideDir, `${e.slug}.md`))) warn(`[${e.slug}] has no guides/${e.slug}.md`);
}

// Directories on disk that nobody can install because they are absent from the catalog.
for (const kind of KINDS) {
  const { dir } = LAYOUT[kind];
  const base = join(ROOT, dir);
  if (!existsSync(base)) continue;
  for (const name of readdirSync(base, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)) {
    if (!seen.has(name)) warn(`${dir}/${name} exists but is not in catalog.json — it cannot be installed`);
  }
}

// Skills carry frontmatter that decides whether a runtime ever triggers them.
console.log('\nChecking skill frontmatter...');
for (const e of entries.filter(x => x.kind === 'agent-skill' || x.agentSkill)) {
  const file = join(ROOT, 'skills', e.slug, 'SKILL.md');
  if (!existsSync(file)) continue;
  const head = readFileSync(file, 'utf8').slice(0, 2000);
  const fm = /^---\n([\s\S]*?)\n---/.exec(head);
  if (!fm) {
    fail(`[${e.slug}] SKILL.md has no YAML frontmatter — runtimes will not index it`);
    continue;
  }
  const nameMatch = /^name:\s*(.+)$/m.exec(fm[1]);
  const descMatch = /^description:\s*(.+)$/m.exec(fm[1]);
  if (!nameMatch) fail(`[${e.slug}] SKILL.md frontmatter is missing 'name'`);
  else if (nameMatch[1].trim() !== e.slug) {
    fail(`[${e.slug}] SKILL.md frontmatter name '${nameMatch[1].trim()}' must equal the slug`);
  }
  if (!descMatch) fail(`[${e.slug}] SKILL.md frontmatter is missing 'description'`);
  else if (descMatch[1].trim().length < 40) {
    // The description is the only thing a runtime sees when deciding to trigger.
    warn(`[${e.slug}] SKILL.md description is very short — triggering will be unreliable`);
  } else console.log(`  ✓ [${e.slug}] frontmatter ok`);
}

// The generated registry must match the catalog.
console.log('\nChecking generated workflows.json...');
const build = Bun.spawnSync(['bun', join(ROOT, 'scripts', 'build-registry.ts'), '--check'], {
  cwd: ROOT,
});
const buildOut = (
  new TextDecoder().decode(build.stdout) + new TextDecoder().decode(build.stderr)
).trim();
if (buildOut) console.log(`  ${buildOut}`);
if (build.exitCode !== 0) errors++;

// Vendored shared files must match their sources exactly.
console.log('\nChecking vendored shared files...');
const sync = Bun.spawnSync(['bun', join(ROOT, 'scripts', 'sync-shared.ts'), '--check'], {
  cwd: ROOT,
});
const syncOut = (
  new TextDecoder().decode(sync.stdout) + new TextDecoder().decode(sync.stderr)
).trim();
if (syncOut) console.log(`  ${syncOut}`);
if (sync.exitCode !== 0) errors++;

if (withNetwork) {
  console.log('\nVerifying sources exist at pinned SHAs...');
  await Promise.all(
    entries.map(async e => {
      if (e.sha === UNPINNED) {
        warn(`[${e.slug}] skipped — not pinned yet`);
        return;
      }
      const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:tree|blob)\/[^/]+\/(.+)$/.exec(
        e.sourceUrl
      );
      if (!m) {
        fail(`[${e.slug}] cannot parse sourceUrl: ${e.sourceUrl}`);
        return;
      }
      const [, owner, repo, path] = m;
      // A skill edition is fetched from skills/<slug>/ at the same pin, so it has to
      // exist there too — the pin usually predates the commit that added it.
      const paths = e.agentSkill ? [path, `skills/${e.slug}/SKILL.md`] : [path];
      for (const p of paths) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${p}?ref=${e.sha}`;
        try {
          const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
          if (!res.ok) {
            fail(`[${e.slug}] ${p} not found at pinned SHA (HTTP ${String(res.status)}) — run: bun scripts/pin-sha.ts`);
          } else console.log(`  ✓ [${e.slug}] ${p} verified at ${e.sha.slice(0, 8)}`);
        } catch (error) {
          fail(`[${e.slug}] fetch failed: ${(error as Error).message}`);
        }
      }
    })
  );
} else {
  console.log('\n(Skipping source-existence checks — pass --network to run them.)');
}

console.log('');
if (errors > 0) {
  console.error(`${String(errors)} error(s), ${String(warnings)} warning(s).`);
  process.exit(1);
}
console.log(`Catalog OK — ${String(entries.length)} entries, ${String(warnings)} warning(s).`);
