// Pulls the IDMX specification out of the idmx repository (the single source of truth) and writes
// it as Starlight pages: one page set per Draft tag plus the Editor's draft.
// See idmx/docs/adr/0001-spec-draft-tags-and-urls.md.
//
// Env:
//   PUBLISH_SPEC=true   publish the spec; otherwise /spec/ is a placeholder page
//   IDMX_REPO           path to an idmx clone with tags (default: ../idmx)
//   IDMX_LATEST_REF     ref for the Editor's draft (default: main)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_URL = 'https://github.com/idmx-project/idmx';
const DOCS_OUT = 'src/content/docs/spec';
const PUBLIC_OUT = 'public/spec';
const MANIFEST = 'spec-manifest.json';

// Tagged drafts open for public review. Remove a draft when its review closes.
const IN_REVIEW = new Set(['v1-draft-00']);

// Reading order from spec/REVIEW.md; unknown pages sort after these.
const PAGE_ORDER = ['discovery', 'signing', 'delivery', 'capabilities', 'errors', 'iana', 'review'];

const repo = process.env.IDMX_REPO ?? '../idmx';
const latestRef = process.env.IDMX_LATEST_REF ?? 'main';
const publish = process.env.PUBLISH_SPEC === 'true';

const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });

rmSync(DOCS_OUT, { recursive: true, force: true });
rmSync(PUBLIC_OUT, { recursive: true, force: true });
mkdirSync(DOCS_OUT, { recursive: true });

if (!publish || !existsSync(join(repo, '.git'))) {
  if (publish) console.warn(`sync-spec: no git repo at ${repo}, publishing placeholder`);
  writePlaceholder();
  writeFileSync(MANIFEST, JSON.stringify({ drafts: [] }, null, 2));
  process.exit(0);
}

const drafts = [
  { name: 'latest', label: "Editor's draft", ref: latestRef, githubRef: 'main' },
  ...draftTags().map(({ name, tag }) => ({ name, label: name, ref: tag, githubRef: tag })),
];

for (const draft of drafts) syncDraft(draft);
writeSpecIndex(drafts);
writeFileSync(
  MANIFEST,
  JSON.stringify({ drafts: drafts.map(({ name, label, hasOpenAPI }) => ({ name, label, hasOpenAPI })) }, null, 2),
);
console.log(`sync-spec: ${drafts.map((d) => d.name).join(', ')}`);

// Draft tags are `spec/v<major>-draft-<NN>`. `v1-draft-00` predates the prefix and is accepted too.
function draftTags() {
  const byName = new Map();
  for (const tag of git('tag', '-l').split('\n')) {
    const m = /^(spec\/)?(v\d+-draft-\d+)$/.exec(tag);
    if (m && (!byName.has(m[2]) || m[1])) byName.set(m[2], tag);
  }
  return [...byName]
    .map(([name, tag]) => ({ name, tag }))
    .sort((a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }));
}

function syncDraft(draft) {
  const files = git('ls-tree', '--name-only', draft.ref, 'spec/').split('\n').filter(Boolean);
  const pages = files
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ file: f, slug: f.slice('spec/'.length, -'.md'.length).toLowerCase() }));
  const slugs = new Set(pages.map((p) => p.slug));
  const dir = join(DOCS_OUT, draft.name);
  mkdirSync(dir, { recursive: true });

  draft.pages = [];
  for (const page of pages) {
    const { title, body } = splitTitle(git('show', `${draft.ref}:${page.file}`));
    const order = PAGE_ORDER.indexOf(page.slug);
    draft.pages.push({ slug: page.slug, title, order: order === -1 ? PAGE_ORDER.length : order });
    writeFileSync(
      join(dir, `${page.slug}.md`),
      frontmatter({
        title,
        description: `${title}, IDMX specification ${draft.label}.`,
        head: [{ tag: 'title', content: `${title} (${draft.label}) | IDMX` }],
        sidebar: { order: (order === -1 ? PAGE_ORDER.length : order) + 1 },
        ...draftBanner(draft),
      }) + transform(body, draft, slugs),
    );
  }
  draft.pages.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

  draft.hasOpenAPI = files.includes('spec/openapi.yaml');
  if (draft.hasOpenAPI) {
    mkdirSync(join(PUBLIC_OUT, draft.name), { recursive: true });
    writeFileSync(join(PUBLIC_OUT, draft.name, 'openapi.yaml'), git('show', `${draft.ref}:spec/openapi.yaml`));
  }

  const rows = draft.pages.map((p) => `| [${p.title}](/spec/${draft.name}/${p.slug}/) | \`${p.slug}.md\` |`);
  writeFileSync(
    join(dir, 'index.md'),
    frontmatter({
      title: draft.name === 'latest' ? "Editor's draft" : `IDMX ${draft.name}`,
      description: `The IDMX specification, ${draft.label}.`,
      sidebar: { label: 'Overview', order: 0 },
      ...draftBanner(draft),
    }) +
      `| Document | Source |\n|---|---|\n${rows.join('\n')}\n\n` +
      `## Machine-readable companions\n\n` +
      (draft.hasOpenAPI
        ? `- [API reference](/spec/${draft.name}/api/) and the raw [OpenAPI document](/spec/${draft.name}/openapi.yaml)\n`
        : '') +
      `- [Test vectors](${REPO_URL}/tree/${draft.githubRef}/spec/test-vectors) on GitHub\n\n` +
      `Specification prose is licensed [CC-BY-4.0](${REPO_URL}/blob/${draft.githubRef}/spec/LICENSE); ` +
      `the OpenAPI document is MIT OR Apache-2.0.\n`,
  );
}

function draftBanner(draft) {
  if (draft.name === 'latest') {
    return { banner: { content: 'Editor’s draft: changes at any time. Cite a tagged draft instead.' } };
  }
  if (IN_REVIEW.has(draft.name)) {
    draft.hasReview ??= git('ls-tree', '--name-only', draft.ref, 'spec/REVIEW.md').trim() !== '';
    const guide = draft.hasReview
      ? ` See the <a href="/spec/${draft.name}/review/">reviewer guide</a>.`
      : '';
    return { banner: { content: `${draft.name} is in public review; feedback welcome.${guide}` } };
  }
  return {};
}


function splitTitle(md) {
  const m = /^# (.+)\n/m.exec(md);
  if (!m) return { title: 'Untitled', body: md };
  return { title: m[1].trim(), body: md.slice(0, m.index) + md.slice(m.index + m[0].length) };
}

// Outside fenced code: link `page.md` (and `page.md` §N.N) cross-references, escape stray `<`
// in prose so placeholders like <DEADLINE> are not parsed as HTML.
function transform(md, draft, slugs) {
  let fenced = false;
  return md
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (fenced || /^\s*(```|~~~)/.test(line)) return line;
      return line
        .split(/(`[^`]*`)/)
        .map((part, i) => (i % 2 === 1 ? part : part.replace(/<(?!https?:)/g, '&lt;')))
        .join('')
        .replace(/`([A-Za-z0-9_-]+)\.md`(?: §(\d+(?:\.\d+)*))?/g, (match, name, section) => {
          const slug = name.toLowerCase();
          if (!slugs.has(slug)) return match;
          const hash = section ? `#section-${section}` : '';
          return `[${match}](/spec/${draft.name}/${slug}/${hash})`;
        });
    })
    .join('\n');
}

function writeSpecIndex(drafts) {
  const tagged = drafts.filter((d) => d.name !== 'latest');
  writeFileSync(
    join(DOCS_OUT, 'index.md'),
    frontmatter({
      title: 'Specification',
      description: 'The IDMX specification: tagged drafts and the editor’s draft.',
      sidebar: { order: 0 },
    }) +
      `The specification is the normative definition of IDMX; the reference implementation only demonstrates it.\n\n` +
      `A **draft** is a tagged, immutable revision: its URLs and section numbers never change, so cite a draft ` +
      `(for example “${tagged[0]?.name ?? 'v1-draft-00'} §2.1”). The **editor’s draft** is the current work and ` +
      `may change at any time.\n\n` +
      `| Revision | Status |\n|---|---|\n` +
      drafts.map((d) => `| [${d.label}](/spec/${d.name}/) | ${draftStatus(d)} |`).join('\n') +
      '\n',
  );
}

function draftStatus(draft) {
  if (draft.name === 'latest') return 'work in progress';
  return IN_REVIEW.has(draft.name) ? '**in public review**' : 'tagged';
}

function writePlaceholder() {
  writeFileSync(
    join(DOCS_OUT, 'index.md'),
    frontmatter({
      title: 'Specification',
      description: 'The IDMX specification will be published here.',
      sidebar: { order: 0 },
    }) +
      `The IDMX specification will be published here, with a permanent URL for every draft.\n\n` +
      `Until then, [How it works](/how-it-works/) describes the design in plain terms.\n`,
  );
}

function frontmatter(data) {
  return `---\n${toYaml(data, '')}---\n\n`;
}

function toYaml(obj, indent) {
  if (Array.isArray(obj)) return obj.map((v) => `${indent}- ${JSON.stringify(v)}\n`).join('');
  return Object.entries(obj)
    .map(([k, v]) =>
      v && typeof v === 'object' ? `${indent}${k}:\n${toYaml(v, indent + '  ')}` : `${indent}${k}: ${JSON.stringify(v)}\n`,
    )
    .join('');
}
