// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightOpenAPI, { createOpenAPISidebarGroup } from 'starlight-openapi';

// Written by scripts/sync-spec.mjs; lists the spec drafts that were synced.
/** @type {{ drafts: { name: string, label: string, hasOpenAPI: boolean }[] }} */
const manifest = existsSync('spec-manifest.json')
  ? JSON.parse(readFileSync('spec-manifest.json', 'utf8'))
  : { drafts: [] };

const drafts = manifest.drafts.map((draft, i) => ({
  ...draft,
  apiGroup: draft.hasOpenAPI ? createOpenAPISidebarGroup() : undefined,
  // Expand the newest tagged draft, or the editor's draft if nothing is tagged yet.
  collapsed: i !== Math.min(1, manifest.drafts.length - 1),
}));

// Spec headings like "2.1 Algorithm" get the citable id "section-2.1" (idmx ADR 0001).
const sectionIds = {
  name: 'section-ids',
  element: {
    filter: ['h2', 'h3', 'h4', 'h5', 'h6'],
    /** @param {any} node @param {any} ctx */
    visit(node, ctx) {
      const m = /^(\d+(?:\.\d+)*)\.?\s/.exec(ctx.textContent(node));
      if (m && typeof node.properties?.id !== 'string') ctx.setProperty(node, 'id', `section-${m[1]}`);
    },
  },
};

export default defineConfig({
  site: 'https://idmx-project.org',
  trailingSlash: 'always',
  markdown: {
    processor: satteri({ hastPlugins: [sectionIds] }),
  },
  integrations: [
    starlight({
      title: 'IDMX',
      description:
        'IDMX (Inter-Domain Mail Exchange): mail delivery between domains over HTTPS, keeping user@domain addresses and SMTP as the fallback.',
      logo: { src: './src/assets/logo.svg', alt: 'IDMX', replacesTitle: true },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/idmx-project' }],
      lastUpdated: false,
      // Spec code blocks use these; no grammar ships for them.
      expressiveCode: { shiki: { langAlias: { abnf: 'txt', dns: 'txt' } } },
      plugins: drafts.some((d) => d.hasOpenAPI)
        ? [
            starlightOpenAPI(
              drafts
                .filter((d) => d.hasOpenAPI)
                .map((d) => ({
                  base: `spec/${d.name}/api`,
                  schema: `public/spec/${d.name}/openapi.yaml`,
                  sidebar: { label: 'API reference', group: d.apiGroup },
                })),
            ),
          ]
        : [],
      sidebar: [
        {
          label: 'IDMX',
          items: [
            { label: 'Why IDMX', link: '/why/' },
            { label: 'How it works', link: '/how-it-works/' },
            { label: 'Status & roadmap', link: '/status/' },
            { label: 'Implementations', link: '/implementations/' },
            { label: 'Contribute', link: '/contribute/' },
          ],
        },
        {
          label: 'Specification',
          items: [
            { label: 'All drafts', link: '/spec/' },
            ...drafts.map((d) => ({
              label: d.label,
              collapsed: d.collapsed,
              items: [
                { autogenerate: { directory: `spec/${d.name}` } },
                ...(d.apiGroup ? [d.apiGroup] : []),
              ],
            })),
          ],
        },
      ],
    }),
  ],
});
