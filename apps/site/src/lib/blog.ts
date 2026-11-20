import { type CollectionEntry, getCollection, getEntries } from "astro:content";

export type Post = CollectionEntry<"blog">;
export type Author = CollectionEntry<"authors">;

/** Drafts show in `astro dev` only. */
const showDrafts = import.meta.env.DEV;

/** The posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", (p) => showDrafts || !p.data.draft);
  return posts.sort(byDate);
}

function byDate(a: Post, b: Post): number {
  return b.data.date.getTime() - a.data.date.getTime();
}

/** The post on top of the index: the newest featured one, else the newest. */
export function lead(posts: readonly Post[]): Post | undefined {
  return posts.find((p) => p.data.featured) ?? posts[0];
}

/** Up to `count` posts to read next: the same category first, then the newest. */
export function related(post: Post, posts: readonly Post[], count = 3): Post[] {
  const others = posts.filter((p) => p.id !== post.id);
  const same = others.filter((p) => p.data.category === post.data.category);
  const rest = others.filter((p) => p.data.category !== post.data.category);
  return [...same, ...rest].slice(0, count);
}

export function authorsOf(post: Post): Promise<Author[]> {
  return getEntries(post.data.authors);
}

const long = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const short = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

/** `November 20, 2026`, for the article's header. */
export function longDate(d: Date): string {
  return long.format(d);
}

/** `Nov 20, 2026`, for the index's rows. */
export function shortDate(d: Date): string {
  return short.format(d);
}

/** `2026-11-20`, for `<time datetime>`. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Two letters for an author without a picture: `The Forgeron team` → `TF`. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
