import type { APIContext } from "astro";
import { asMarkdown, type Change, getChanges } from "../../lib/changelog";

/** Every entry as plain Markdown, `/changelog/<id>.md`: for agents, scripts and copy-paste. */
export async function getStaticPaths() {
  const changes = await getChanges();
  return changes.map((change) => ({ params: { slug: change.id }, props: { change } }));
}

export function GET(context: APIContext) {
  const { change } = context.props as { change: Change };
  return new Response(asMarkdown(change, context.site), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
