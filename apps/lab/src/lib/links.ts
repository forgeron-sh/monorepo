/**
 * Where a link of a paper leads once the paper is published. The papers are written in `docs/`
 * with links relative to their file; on the lab they lead to the other papers' pages, or to the
 * file on GitHub.
 */

export const REPO = "https://github.com/forgeron-sh/monorepo";

/** Resolves `href` against the folder of `from` (both relative to the repository root). */
export function resolveRepoPath(from: string, href: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const seg of href.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

/**
 * The published target of `href`, written in the file `from` (a repository path such as
 * `docs/shaders/design.md`). `papers` maps a repository path to a paper's page. Absolute URLs,
 * anchors and mail links are kept.
 */
export function rewriteHref(
  href: string,
  from: string,
  papers: ReadonlyMap<string, string>,
): string {
  if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
  const hash = href.indexOf("#");
  const path = hash === -1 ? href : href.slice(0, hash);
  const anchor = hash === -1 ? "" : href.slice(hash);
  if (path === "") return href;
  const target = resolveRepoPath(from, path);
  const page = papers.get(target);
  if (page) return `${page}${anchor}`;
  const kind = /\.[a-z0-9]+$/i.test(target) ? "blob" : "tree";
  return `${REPO}/${kind}/main/${target}${anchor}`;
}

/**
 * Every link of a Markdown text (`[text](href)`, `![alt](src)` and `[ref]: href`) through
 * `rewriteHref`. Fenced code is left alone.
 */
export function rewriteMarkdownLinks(
  md: string,
  from: string,
  papers: ReadonlyMap<string, string>,
): string {
  const fix = (href: string) => rewriteHref(href, from, papers);
  return md
    .split(/(^```[^\n]*\n[\s\S]*?^```)/m)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .replace(
              /\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g,
              (_, href: string, title: string) => `](${fix(href)}${title})`,
            )
            .replace(
              /^(\s*\[[^\]]+\]:\s*)(\S+)/gm,
              (_, lead: string, href: string) => `${lead}${fix(href)}`,
            ),
    )
    .join("");
}
