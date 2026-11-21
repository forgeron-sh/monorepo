import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getChanges } from "../../lib/changelog";

/** The changelog's feed, `/changelog/rss.xml`: every published change, newest first. */
export async function GET(context: APIContext) {
  const changes = await getChanges();
  return rss({
    title: "Forgeron changelog",
    description: "New features, improvements and fixes across Forgeron.",
    site: new URL("/changelog", context.site ?? "https://forgeron.sh"),
    items: changes.map((c) => ({
      title: c.data.version ? `v${c.data.version}: ${c.data.title}` : c.data.title,
      description: c.data.summary,
      pubDate: c.data.date,
      categories: [c.data.type, ...c.data.areas],
      link: `/changelog/${c.id}`,
    })),
  });
}
