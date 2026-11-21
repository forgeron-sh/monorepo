# @forgeron/site

The `forgeron.sh` marketing site: Astro, static pages, deployed as a Workers static-assets Worker (`wrangler.jsonc`).

## Layout

- `src/pages/index.astro`: the home page, in the lab language (voice and brand: `docs/design-system.md`). It is composed of `@forgeron/ui` atoms (`Button`, `Tag`, `Chip`, `Led`, `Command`, `Icon`, `Title`, `PixelText`, `Logo`…) and of the site's own composition: navigation, hero, sections, footer.
- `src/pages/blog/`, `src/pages/customers/`, `src/pages/changelog/`: the editorial pages, each an index and a page per entry, with a filter and (blog, changelog) an RSS feed. They share `PagesNav`, the cards of the landing (`fg-cards`), `PostArt` (a Blueprint scene over the dithered field) and the prose of `src/styles/blog.css`; `stories.css` and `changelog.css` add their own parts. The filter is `src/lib/filter.ts`.
- `src/content/`: the entries, checked by `src/content.config.ts`.
  - `blog/*.mdx`: the posts, the file name the address (`manifesto.mdx` → `/blog/manifesto`). Authors in `authors.json`. `<Figure>` (a picture, a scene or code, with a caption) and `<Callout>` need no import. `writing-a-post.mdx` is a draft that shows every component: start from it.
  - `stories/*.mdx`: the customer stories (`/customers/<id>`): company, industry, size, quote, up to three results; `<Quote>` in the text. Only real customers, with their agreement on every quote and figure. `example.mdx` is a made-up draft to write the first one from. The Customers link of the navigation shows once a story is published.
  - `changelog/YYYY-MM-DD-slug.md`: the changes, Markdown, each with a type (New, Improved, Fixed, Breaking, Deprecated), its areas and its version. Each is also served as raw Markdown at `/changelog/<id>.md`.
  - `draft: true` shows an entry in `astro dev` only.
- `src/illustrations/blog-scenes.ts`: the editorial scenes, one drawn for each post, story or large release, named by `scene:` in its front matter. `blog-scenes.test.ts` checks that every scene named exists.
- `src/pages/design-system/architecture.astro`: the architecture diagram of a tool, on the manifests of the four templates (a React island).
- `src/layouts/Site.astro`: the document: `@forgeron/ui/tokens.css`, `@forgeron/ui/atoms.css`, `src/styles/site.css` (base, rail, the blocks of the home page), the fonts.
- `src/components/`: `SectionHead`, `Footer`, and the architecture preview.
- `src/illustrations/`: the canvases. `canvas.ts` mounts every `canvas[data-iso]` (a scene of `scenes.ts`) and `canvas[data-shader]` (a WebGL field) through `@forgeron/blueprint`; page scripts drive a scene through `isoCanvas(el)`. Without JavaScript the canvases stay blank and the rest of the page renders.
- `src/explorations/`: the design explorations the home page came from (`index`, `landing-a` to `landing-e`) and their support files (`lab/`). They are kept in the repository and type-checked, but not routed, so not published. To look at one, copy it under `src/pages/` locally; it still needs `public/fonts/` (its own `lab.css` loads Forge Sans from there).

## Commands

- `bun run dev` (port 5173), `bun run build`, `astro-check` through `moon run site:typecheck`.
