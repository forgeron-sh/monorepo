import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "../../lib/blog";

/** The blog's feed, `/blog/rss.xml`: every published post, newest first. */
export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: "Forgeron blog",
    description: "Engineering, product and company notes from the people building Forgeron.",
    site: new URL("/blog", context.site ?? "https://forgeron.sh"),
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      categories: [p.data.category],
      link: `/blog/${p.id}`,
    })),
  });
}
