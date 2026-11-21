import { type CollectionEntry, getCollection } from "astro:content";

export type Story = CollectionEntry<"stories">;

/** The customer stories, newest first; drafts in `astro dev` only. */
export async function getStories(): Promise<Story[]> {
  const stories = await getCollection("stories", (s) => import.meta.env.DEV || !s.data.draft);
  return stories.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** The story on top of the index: the newest featured one, else the newest. */
export function leadStory(stories: readonly Story[]): Story | undefined {
  return stories.find((s) => s.data.featured) ?? stories[0];
}
