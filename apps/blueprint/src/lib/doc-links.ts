/** Where the repository's documents live on GitHub: the format's links to its siblings go there. */
const DOCS = "https://github.com/forgeron-sh/monorepo/blob/main/docs/blueprint/";

/**
 * The format page renders `docs/blueprint/format.md` as it is in the repository. Its relative
 * links (`engine.md`, `engine.md#2-the-format`) point at files that are not pages of this site:
 * they go to the documents on GitHub instead. Other links are left as they are.
 */
export function rewriteDocLinks(html: string): string {
  return html.replace(/href="([\w./-]+\.md(?:#[^"]*)?)"/g, (_, href: string) => {
    return `href="${new URL(href, DOCS).href}"`;
  });
}
