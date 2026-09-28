# idmx-project.org

Source of [idmx-project.org](https://idmx-project.org), the public website of
[IDMX](https://github.com/idmx-project/idmx) (Inter-Domain Mail Exchange).

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build),
served as a static-assets-only Cloudflare Worker (`wrangler.jsonc`).

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

`.github/workflows/deploy.yml` builds and deploys on push to `main` (production),
nightly, and when `idmx` sends a `repository_dispatch` of type
`idmx-spec-updated`. Pull requests get a preview URL (`pr-<number>-idmx-project-org.<subdomain>.workers.dev`).
The first deploy creates the Worker and attaches `idmx-project.org`.

| Setting | Kind | Purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | Cloudflare token from the *Edit Cloudflare Workers* template |
| `CLOUDFLARE_ACCOUNT_ID` | secret | Cloudflare account |
| `IDMX_READ_TOKEN` | secret | Fine-grained PAT, *Contents: read* on `idmx-project/idmx` |
| `PUBLISH_SPEC` | variable | `true` to publish the spec |

## License

- Content: [CC-BY-4.0](LICENSE-CC-BY-4.0)
- Code: [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option
