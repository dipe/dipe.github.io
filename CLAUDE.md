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
pnpm astro check   # type-check .astro/.mdx (no separate lint/test setup)
```

There is no test suite and no linter. `pnpm build` is the de facto correctness check — it fails on broken image imports, invalid frontmatter, and bad internal links.

## Deployment

Push to `main` triggers `.github/workflows/deply.yml` (note the typo in the filename), which uses `withastro/action@v5` → GitHub Pages. No manual deploy step.

## Architecture

**Everything is content-driven.** `src/content/docs/**` is the entire site; Starlight auto-generates routes and the sidebar from the directory tree. There are no `src/pages/`, no layouts, and no route files.

### Routing and slugs

Starlight slugifies directory names, so paths in Markdown links do **not** match the on-disk casing:

- `src/content/docs/fiNe-scale/` → `/fine-scale/`
- `src/content/docs/fiNe-scale/Tools & Techniques/Etching/` → `/fine-scale/tools--techniques/etching/` (the `&` collapses to a double dash)

When adding an internal link, derive the URL from the lowercased/slugified path, not the folder name.

### Sidebar ordering

No explicit `sidebar` config exists in `astro.config.mjs` — ordering is alphabetical by file/directory name. This is why the resources page is named `zz-resources.mdx` (to sort last). Pages excluded from navigation use frontmatter `sidebar: { hidden: true }` (legal pages, archived project versions).

### Image handling — three distinct paths

1. **`PhotoSwipeImage.astro`** — a single image with an optional caption (or slot content), click-to-zoom via PhotoSwipe.
2. **`MasonryGallery.astro`** — an `images={[{ src, alt, caption? }]}` array rendered as a CSS-column masonry grid, one shared lightbox.
3. Plain Markdown images — no lightbox.

Both components pre-generate a 2000px WebP via `getImage()` at build time for the lightbox and render a smaller `<Image>` inline. Images must be **imported as ES modules** from a path relative to the `.mdx` file (`import bild0 from './0.jpg'`) — string paths won't get optimized dimensions and will break the lightbox. Images live alongside their `.mdx` in `src/content/docs/`, not in `src/assets/`.

Both components re-init their lightbox on `astro:page-load` (Starlight uses view transitions), so any new PhotoSwipe usage must do the same or the lightbox dies after client-side navigation.

Note: `starlight-image-zoom` is in `package.json` but is **not** registered in `astro.config.mjs` — the PhotoSwipe components supersede it.

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
