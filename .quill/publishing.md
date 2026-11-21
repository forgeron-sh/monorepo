# Forgeron: where pieces go

Each format of Quill maps to one place here. The schema of every front matter is in `apps/site/src/content.config.ts`: read it there before writing one.

| Format                          | File                                                       | Address                      | Notes                                                                                         |
| ------------------------------- | ---------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| blog-post, deep-dive, manifesto | `apps/site/src/content/blog/<slug>.mdx`                    | `/blog/<slug>`               | `<Figure>`, `<Callout>` need no import. `writing-a-post.mdx` shows every component.           |
| customer-story                  | `apps/site/src/content/stories/<company>.mdx`              | `/customers/<company>`       | `<Quote>`. Stays `draft: true` until the customer approves every quote and figure in writing. |
| changelog                       | `apps/site/src/content/changelog/YYYY-MM-DD-slug.md`       | `/changelog/YYYY-MM-DD-slug` | Plain Markdown. Released versions come from `CHANGELOG.md`; never invent a version number.    |
| paper                           | `docs/<topic>.md`, listed in `apps/lab/src/data/papers.ts` | `lab.forgeron.sh`            | Read `papers.ts` for how a paper is listed and given its Blueprint cover.                     |

## Art

Every blog post, story and large release has its own Blueprint scene, drawn for what it says: a function in `apps/site/src/illustrations/blog-scenes.ts`, named by `scene:` in the front matter. Propose the scene's idea in the brief (one sentence: what moves, what it stands for); `blog-scenes.test.ts` checks the name exists.

## Preview and checks

- `bun run --cwd apps/site dev`, then open the address.
- `draft: true` shows a piece in development only.
- Before handing over: `bunx astro-check` in `apps/site`, and `bunx oxfmt` on the new file.
