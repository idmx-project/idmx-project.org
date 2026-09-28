# idmx-project.org

Source of [idmx-project.org](https://idmx-project.org), the public website of
[IDMX](https://github.com/idmx-project/idmx) (Inter-Domain Mail Exchange).

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build),
hosted on GitHub Pages.

## Develop

```sh
npm install
npm run dev
```

## The specification

The spec lives in the `idmx` repository and is never copied here.
`scripts/sync-spec.mjs` reads it from a git clone at build time and writes
generated pages (gitignored) to `src/content/docs/spec/` and `public/spec/`:

- the Editor's draft (`main`) at `/spec/latest/`
- every draft tag (`spec/v1-draft-NN`) at `/spec/<draft>/`, permanently

Section headings get citable anchors (`#section-2.1`), and cross-references
like `` `discovery.md` §3.2 `` become links. See `idmx/docs/adr/0001-spec-draft-tags-and-urls.md`.

Publishing is off unless `PUBLISH_SPEC=true`; without it `/spec/` is a
placeholder. To build with the spec locally (expects `../idmx`):

```sh
PUBLISH_SPEC=true npm run build
```

## Deployment

`.github/workflows/deploy.yml` deploys to GitHub Pages on push to `main`,
nightly, and when `idmx` sends a `repository_dispatch` of type
`idmx-spec-updated`. Pull requests are built but not deployed. The custom
domain comes from `public/CNAME`; DNS stays at Infomaniak (`A` records for
GitHub Pages on `@`, `CNAME` `www` → `idmx-project.github.io`).

| Setting | Kind | Purpose |
|---|---|---|
| `IDMX_READ_TOKEN` | secret | Fine-grained PAT, *Contents: read* on `idmx-project/idmx`; not needed once `idmx` is public |
| `PUBLISH_SPEC` | variable | `true` to publish the spec |

## License

- Content: [CC-BY-4.0](LICENSE-CC-BY-4.0)
- Code: [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option
