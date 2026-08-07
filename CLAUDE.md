# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal website of Peter Ehrenberg (`https://dipe.de`), built with Astro + Starlight. Content is mostly fiNe-scale (1:160 N-gauge) model railway documentation. Prose is English; some code comments are German.

Note: the repository lives at `dipe.github.io/` inside the parent working directory — run all commands from the repo root.

## Commands

Package manager is **pnpm** (pinned via `packageManager`).

```bash
pnpm install
pnpm dev        # dev server at localhost:4321
pnpm build      # production build to ./dist/
pnpm preview    # serve the built site
pnpm check      # type-check the .astro components (no separate lint/test setup)
```

There is no test suite and no linter. `pnpm build` is the de facto correctness check — it fails on broken image imports, invalid frontmatter, and dead internal links (see below).

`pnpm check` covers the four `.astro` components only — **not** `.mdx`. Component `Props` interfaces therefore guard the components and editor tooling, but nothing validates how content calls them; a bad prop in an `.mdx` file surfaces at build time or not at all.

`typescript` is pinned to **6.x** on purpose. TypeScript 7 dropped the programmatic API that `@astrojs/check` relies on, so `pnpm check` fails immediately on 7.x. Don't bump it until `@astrojs/check` supports the native compiler.

Two peer-dependency warnings are expected and harmless: `@catppuccin/starlight` asks for `astro@^6` and `vite-plugin-license` for `vite@^7`, while the project is on Astro 7 / Vite 8.

The site is normally built by CI, not locally. A `dist/` directory in the working tree may be stale — don't infer routes from it.

## Deployment

Push to `main` triggers `.github/workflows/deply.yml` (note the typo in the filename), which uses `withastro/action@v5` → GitHub Pages. No manual deploy step.

## Architecture

**Everything is content-driven.** `src/content/docs/**` is the entire site; Starlight auto-generates routes and the sidebar from the directory tree. There are no `src/pages/`, no layouts, and no route files.

### Routing and slugs

Starlight slugifies directory names, so paths in Markdown links do **not** match the on-disk casing:

- `src/content/docs/fiNe-scale/` → `/fine-scale/`
- `src/content/docs/fiNe-scale/Tools and Techniques/Etching/` → `/fine-scale/tools-and-techniques/etching/`
- `src/content/docs/fiNe-scale/zz-resources.mdx` → `/fine-scale/zz-resources/`

When adding an internal link, derive the URL from the lowercased/slugified path, not the folder name.

### Link validation

`starlight-links-validator` runs inside `astro build` and fails the build on dead internal links, including links to files in `public/` and invalid heading anchors. Its config lives in the `plugins` array in `astro.config.mjs`.

Two consequences for content:

- **Internal links must be site-absolute** (`/fine-scale/projects/rubin-mill/`). The plugin's `errorOnRelativeLinks` default is `true`, and switching it off would make relative links unvalidated rather than valid — so `./foo` and `../foo` are not an option here.
- The plugin only reads Markdown/MDX, and within it only known link props. Any **new component that takes a URL prop must be registered** via the `components` option (currently `[['ExternalLinkCard', 'href']]`), otherwise its links are silently unchecked.

External links are **not** covered by the build. `.github/workflows/linkcheck.yml` builds the site and runs `lychee` over `dist/**/*.html` weekly (and on manual dispatch). It deliberately does not run on push, so an unreachable third-party site can never block a deployment.

### Sidebar ordering

No explicit `sidebar` config exists in `astro.config.mjs` — ordering is alphabetical by file/directory name. This is why the resources page is named `zz-resources.mdx` (to sort last). Pages excluded from navigation use frontmatter `sidebar: { hidden: true }` (legal pages, archived project versions).

### Image handling — three distinct paths

1. **`PhotoSwipeImage.astro`** — a single image with an optional caption (or slot content), click-to-zoom via PhotoSwipe.
2. **`MasonryGallery.astro`** — an `images={[{ src, alt, caption? }]}` array rendered as a CSS-column masonry grid. Each instance is its own lightbox group, so several galleries can sit on one page.
3. Plain Markdown images — no lightbox.

Both components pre-generate a 2000px WebP via `getImage()` at build time for the lightbox and render a smaller `<Image>` inline. Images must be **imported as ES modules** from a path relative to the `.mdx` file (`import bild0 from './0.jpg'`) — string paths won't get optimized dimensions and will break the lightbox. Images live alongside their `.mdx` in `src/content/docs/`, not in `src/assets/`.

### The lightbox

All PhotoSwipe wiring lives in **`src/scripts/lightbox.ts`**; the components only render markup and call `registerLightbox({ gallery, children })` from their `<script>`. Anything new that needs a lightbox should do the same rather than instantiate PhotoSwipe itself — the module owns three things that are easy to get wrong:

- **Re-init on `astro:page-load`.** Starlight navigates client-side, so the elements PhotoSwipe bound its click handlers to are gone after every navigation and the instance must be rebuilt, not created once.
- **The history entry.** PhotoSwipe 5 dropped v4's `history` option, so the module pushes a `#lightbox` entry itself to make the back button close the lightbox instead of leaving the page. Passing `history: false` to PhotoSwipe 5 does nothing.
- **The caption.** The lightbox caption is read from the `[data-pswp-caption]` element inside the thumbnail's `<figure>`, so markup is never duplicated — whatever shows under the thumbnail shows in the lightbox. A `<figure>` without that attribute simply has no lightbox caption.

The lightbox renders outside every component (PhotoSwipe appends its root to `<body>`), so its CSS cannot be component-scoped: it lives in `src/styles/lightbox.css`, which also pulls in `photoswipe/style.css` and is imported by both components. Component-local styling stays in the components' scoped `<style>` blocks.

### External links

Two mechanisms, both producing the same trailing-icon affordance:

- `rehypeExternalLinks` (configured in `astro.config.mjs`) rewrites all external Markdown links with `target="_blank"`, `rel="nofollow noopener noreferrer"`, and `class="external-link"`. The icon itself is a base64-masked SVG in `src/styles/custom.css` — that file exists almost solely for this.
- `ExternalLinkCard.astro` wraps Starlight's `LinkCard` for card-style external links, hiding the built-in SVG and overlaying its own icon.

### Theming and footer

- Colors come from `@catppuccin/starlight` (mocha/sapphire dark, latte/sky light). Use Starlight CSS variables (`--sl-color-gray-3`, `--sl-color-accent-high`, …) in components rather than hard-coded colors.
- `src/components/Footer.astro` overrides Starlight's footer via the `components` map. It renders the CC BY-SA 4.0 notice **only** for paths starting with `/fine-scale` — that check is a literal `pathname.startsWith()`, so it must be kept in sync if the section is ever renamed.
- `vite-plugin-license` emits `dist/3rd-party-licenses.txt` at build time; the footer links to it, so it only resolves in a real build (not `pnpm dev`).

## Conventions

- Content files are `.mdx` named `index.mdx` inside a per-topic directory (so images can sit next to them). Only the top-level legal pages and `zz-resources.mdx` are flat files.
- Superseded project revisions are kept under `Projects/<Name>/Archive/version-N/` with `sidebar: { hidden: true }`, duplicating their images rather than referencing the live version's.
- `public/` holds only true static assets served verbatim: license SVGs, `robots.txt`, `.well-known/security.txt`, and PDFs under `public/~pe/`.
- Commit messages use a `Type: subject` prefix — observed types: `Content:`, `Chore:`, `Feat:`, `Fix:`.
- `pnpm-workspace.yaml` disables build scripts for `esbuild`/`sharp` via `allowBuilds`; `sharp` is required for image optimization, so don't remove it from `onlyBuiltDependencies`.
