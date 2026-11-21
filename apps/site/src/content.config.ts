import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

/** The blog's categories, in the order of the index's filter. */
export const CATEGORIES = ["Engineering", "Product", "Company", "Research"] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * The posts: one `.mdx` file per post in `src/content/blog/`, its name the post's address
 * (`launch.mdx` → `/blog/launch`). The cover sits next to it, in `src/content/blog/images/`.
 */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(110),
        /** One or two sentences: the lead under the title, the card's summary, the meta description. */
        description: z.string().max(240),
        date: z.coerce.date(),
        /** Set when the post changed after it was published. */
        updated: z.coerce.date().optional(),
        category: z.enum(CATEGORIES),
        authors: z.array(reference("authors")).min(1),
        /**
         * The post's art: an iso scene of `src/illustrations/scenes.ts` (`forge-cta`, `pipeline`…),
         * played by Blueprint on the index, the cards and the post's banner. `scenes.test.ts`
         * checks that every scene named here exists.
         */
        scene: z.string().optional(),
        /** A picture: the art when there is no scene, and the picture of a shared link. */
        cover: image().optional(),
        coverAlt: z.string().optional(),
        /** The post on top of the index. The most recent featured post wins. */
        featured: z.boolean().default(false),
        /** Shown by `astro dev` with a Draft tag, left out of the build. */
        draft: z.boolean().default(false),
      })
      .refine((post) => !post.cover || post.coverAlt, {
        message: "A post with a cover describes it in `coverAlt`.",
        path: ["coverAlt"],
      }),
});

/** The people who write: `src/content/authors.json`, keyed by `id`. */
const authors = defineCollection({
  loader: file("./src/content/authors.json"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    /** A public profile (GitHub, a personal site). */
    url: z.url().optional(),
  }),
});

/** The industries of the customer stories, in the order of the index's filter. */
export const INDUSTRIES = [
  "Distribution",
  "Industry",
  "Services",
  "Public sector",
  "Software",
  "Agencies",
] as const;

/**
 * The customer stories: one `.mdx` file per company in `src/content/stories/`, its name the
 * address (`acme.mdx` → `/customers/acme`). Only real customers, with their agreement: a story
 * that is an example stays `draft: true`.
 */
const stories = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/stories" }),
  schema: z.object({
    company: z.string(),
    /** The headline of the story: what changed for them. */
    title: z.string().max(110),
    description: z.string().max(240),
    date: z.coerce.date(),
    industry: z.enum(INDUSTRIES),
    /** `40 people`, `1,200 employees`. */
    size: z.string(),
    location: z.string(),
    /** The Forgeron tools and interfaces they use: `CRM`, `Odoo gateway`, `MCP`. */
    uses: z.array(z.string()).min(1),
    /** The quote of the card and of the story's header, in the person's words. */
    quote: z.object({ text: z.string().max(280), name: z.string(), role: z.string() }),
    /** Up to three results, each a figure and what it counts. */
    results: z
      .array(z.object({ value: z.string().max(8), label: z.string() }))
      .max(3)
      .default([]),
    scene: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

/** The areas a change touches: the product's parts, for the changelog's tags and filter. */
export const AREAS = [
  "SDK",
  "CLI",
  "Runtime",
  "Gateway",
  "Console",
  "Catalog",
  "Editors",
  "Blueprint",
  "Design system",
] as const;
/** The kinds of change, in the order they are listed. */
export const CHANGE_TYPES = ["New", "Improved", "Fixed", "Breaking", "Deprecated"] as const;

/**
 * The changelog: one Markdown file per release or change in `src/content/changelog/`, named
 * `YYYY-MM-DD-slug.md` (its address `/changelog/YYYY-MM-DD-slug`, its raw Markdown at
 * `/changelog/YYYY-MM-DD-slug.md`).
 */
const changelog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/changelog" }),
  schema: z.object({
    title: z.string().max(110),
    /** One sentence: the summary of the feed and of the meta description. */
    summary: z.string().max(240),
    date: z.coerce.date(),
    /** The released version, `0.4.0`, when the change ships in one. */
    version: z.string().optional(),
    type: z.enum(CHANGE_TYPES),
    areas: z.array(z.enum(AREAS)).min(1),
    /** A scene over the entry: for the large releases only. */
    scene: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, authors, stories, changelog };
